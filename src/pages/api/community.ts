import type { NextApiRequest, NextApiResponse } from "next";
import { withApiMonitoring } from "@/lib/apiMonitoring";
import { randomBytes } from "crypto";
import { databaseTransaction, prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { cleanText } from "@/lib/learningProfile";

const ROLES = new Set(["STUDENT", "GUARDIAN", "TEACHER"]);

function createCode(prefix: string) {
  return `${prefix}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function studentSignal(student: {
  learnerProfile: { diagnosticCompleted: boolean } | null;
  conceptMasteries: Array<{ score: number; lastPracticedAt: Date | null }>;
  privacySettings: {
    shareProgressWithTeachers: boolean;
    shareProgressWithGuardians: boolean;
  } | null;
}, audience: "TEACHER" | "GUARDIAN") {
  const canShare = audience === "TEACHER"
    ? student.privacySettings?.shareProgressWithTeachers !== false
    : student.privacySettings?.shareProgressWithGuardians !== false;
  if (!canShare) {
    return {
      averageMastery: 0,
      needsAttention: false,
      restricted: true,
      reasons: ["Learner has limited progress sharing"],
    };
  }
  const scores = student.conceptMasteries.map((item) => item.score);
  const average = scores.length
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;
  const lastPractice = student.conceptMasteries
    .flatMap((item) => item.lastPracticedAt ?? [])
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const inactiveDays = lastPractice
    ? Math.floor((Date.now() - lastPractice.getTime()) / 86_400_000)
    : null;
  const reasons = [
    ...(!student.learnerProfile?.diagnosticCompleted ? ["Diagnostic not completed"] : []),
    ...(scores.length > 0 && average < 0.55 ? ["Mastery is below 55%"] : []),
    ...(inactiveDays !== null && inactiveDays >= 7
      ? [`No mastery evidence for ${inactiveDays} days`]
      : []),
  ];
  return {
    averageMastery: Math.round(average * 100),
    needsAttention: reasons.length > 0,
    restricted: false,
    reasons,
  };
}

const studentSelect = {
  id: true,
  name: true,
  learnerProfile: { select: { gradeLevel: true, diagnosticCompleted: true } },
  privacySettings: {
    select: {
      shareProgressWithTeachers: true,
      shareProgressWithGuardians: true,
    },
  },
  conceptMasteries: {
    select: { score: true, lastPracticedAt: true },
    orderBy: { updatedAt: "desc" as const },
    take: 30,
  },
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authUser = await requireApiUser(req, res);
  if (!authUser) {return;}
  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user) {return res.status(404).json({ error: "Account not found." });}

  if (req.method === "GET") {
    if (user.accountRole === "TEACHER") {
      if (!["VERIFIED", "DOMAIN_VERIFIED"].includes(user.roleVerificationStatus)) {
        return res.status(200).json({
          role: user.accountRole,
          roleVerificationStatus: user.roleVerificationStatus,
          verificationRequired: true,
          classrooms: [],
        });
      }
      const classrooms = await prisma.classroom.findMany({
        where: { teacherId: user.id, archivedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          memberships: {
            where: { status: "ACTIVE" },
            include: { student: { select: studentSelect } },
          },
          assignments: {
            orderBy: { createdAt: "desc" },
            take: 10,
            include: { _count: { select: { submissions: true } } },
          },
        },
      });
      const viewedStudentIds = [...new Set(
        classrooms.flatMap((classroom) =>
          classroom.memberships.map((membership) => membership.student.id)
        )
      )];
      if (viewedStudentIds.length) {
        await prisma.auditEvent.createMany({
          data: viewedStudentIds.map((studentId) => ({
            actorUserId: user.id,
            subjectId: studentId,
            action: "STUDENT_PROGRESS_VIEWED",
            resourceType: "ClassroomProgress",
          })),
        });
      }
      return res.status(200).json({
        role: user.accountRole,
        roleVerificationStatus: user.roleVerificationStatus,
        classrooms: classrooms.map((classroom) => ({
          ...classroom,
          memberships: classroom.memberships.map((membership) => ({
            ...membership,
            student: {
              ...membership.student,
              signal: studentSignal(membership.student, "TEACHER"),
            },
          })),
        })),
      });
    }

    if (user.accountRole === "GUARDIAN") {
      const [links, invite] = await Promise.all([
        prisma.guardianStudent.findMany({
          where: { guardianId: user.id, status: "ACTIVE" },
          include: { student: { select: studentSelect } },
        }),
        prisma.guardianInvite.findFirst({
          where: { guardianId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        }),
      ]);
      if (links.length) {
        await prisma.auditEvent.createMany({
          data: links.map((link) => ({
            actorUserId: user.id,
            subjectId: link.student.id,
            action: "STUDENT_PROGRESS_VIEWED",
            resourceType: "GuardianProgress",
          })),
        });
      }
      return res.status(200).json({
        role: user.accountRole,
        roleVerificationStatus: user.roleVerificationStatus,
        invite,
        students: links.map((link) => ({
          ...link,
          student: { ...link.student, signal: studentSignal(link.student, "GUARDIAN") },
        })),
      });
    }

    const memberships = await prisma.classroomMembership.findMany({
      where: { studentId: user.id, status: "ACTIVE" },
      include: {
        classroom: {
          include: {
            teacher: { select: { name: true } },
            assignments: {
              orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
              include: {
                submissions: { where: { studentId: user.id }, take: 1 },
              },
            },
          },
        },
      },
    });
    const guardians = await prisma.guardianStudent.findMany({
      where: { studentId: user.id, status: "ACTIVE" },
      select: { id: true, relationship: true, guardian: { select: { name: true } } },
    });
    return res.status(200).json({
      role: "STUDENT",
      roleVerificationStatus: user.roleVerificationStatus,
      learningLockedUntil: user.learningLockedUntil?.toISOString() ?? null,
      memberships,
      guardians,
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const action = cleanText(req.body?.action, 40);
  if (action === "set-role") {
    const role = cleanText(req.body?.role, 20).toUpperCase();
    if (!ROLES.has(role)) {return res.status(400).json({ error: "Invalid role." });}
    if (role !== "STUDENT") {
      if (user.ageGroup !== "ADULT") {
        return res.status(403).json({ error: "Adult roles require an 18-or-older age group in the Trust Center." });
      }
      const lastSignIn = authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at) : null;
      if (!lastSignIn || Date.now() - lastSignIn.getTime() > 15 * 60_000) {
        return res.status(428).json({
          code: "RECENT_SIGN_IN_REQUIRED",
          error: "Sign out and sign back in before changing to an adult account role.",
        });
      }
      const learnerConnections = await prisma.$transaction([
        prisma.classroomMembership.count({ where: { studentId: user.id, status: "ACTIVE" } }),
        prisma.guardianStudent.count({ where: { studentId: user.id, status: "ACTIVE" } }),
      ]);
      if (learnerConnections.some((count) => count > 0)) {
        return res.status(409).json({ error: "A connected learner account cannot self-promote to an adult role. Open a data-rights correction request in the Trust Center." });
      }
    }
    if (role === "STUDENT" && user.accountRole !== "STUDENT") {
      const adultResponsibilities = await prisma.$transaction([
        prisma.classroom.count({ where: { teacherId: user.id, archivedAt: null } }),
        prisma.guardianStudent.count({ where: { guardianId: user.id, status: "ACTIVE" } }),
      ]);
      if (adultResponsibilities.some((count) => count > 0)) {
        return res.status(409).json({ error: "Transfer or close active adult responsibilities before changing roles." });
      }
    }
    const roleVerificationStatus = role === "TEACHER"
      ? "UNVERIFIED"
      : role === "GUARDIAN"
        ? "SELF_ATTESTED"
        : "NOT_REQUIRED";
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { accountRole: role, roleVerificationStatus, verifiedAt: null },
      }),
      prisma.auditEvent.create({
        data: {
          actorUserId: user.id,
          subjectId: user.id,
          action: "ACCOUNT_ROLE_CHANGED",
          resourceType: "User",
          resourceId: user.id,
          metadata: { from: user.accountRole, to: role },
        },
      }),
    ]);
    return res.status(200).json({ ok: true, role });
  }

  if (action === "create-classroom") {
    if (user.accountRole !== "TEACHER") {return res.status(403).json({ error: "Teacher role required." });}
    if (!["VERIFIED", "DOMAIN_VERIFIED"].includes(user.roleVerificationStatus)) {
      return res.status(403).json({ error: "Verify your educator identity in the Trust Center first." });
    }
    const name = cleanText(req.body?.name, 120);
    const subject = cleanText(req.body?.subject, 80);
    const gradeBand = cleanText(req.body?.gradeBand, 30);
    if (!name || !subject || !gradeBand) {return res.status(400).json({ error: "Name, subject, and grade band are required." });}
    const organizationMembership = await prisma.organizationMembership.findFirst({
      where: { userId: user.id, status: "ACTIVE", organization: { status: "VERIFIED" } },
      include: { organization: { include: { policy: true } } },
    });
    const allowedGradeBands = organizationMembership?.organization.policy?.allowedGradeBands;
    if (
      Array.isArray(allowedGradeBands) &&
      !allowedGradeBands.some((item) => item === gradeBand)
    ) {
      return res.status(403).json({ error: "This grade band is disabled by district policy." });
    }
    const classroom = await prisma.classroom.create({
      data: {
        teacherId: user.id,
        organizationId: organizationMembership?.organizationId ?? null,
        name,
        subject,
        gradeBand,
        joinCode: createCode("CLASS"),
      },
    });
    return res.status(201).json({ classroom });
  }

  if (action === "join-classroom") {
    if (user.accountRole !== "STUDENT") {return res.status(403).json({ error: "Student role required." });}
    const code = cleanText(req.body?.code, 30).toUpperCase();
    const classroom = await prisma.classroom.findUnique({
      where: { joinCode: code },
      include: { organization: { include: { policy: true } } },
    });
    if (!classroom || classroom.archivedAt) {return res.status(404).json({ error: "Class code not found." });}
    const allowedGradeBands = classroom.organization?.policy?.allowedGradeBands;
    if (Array.isArray(allowedGradeBands) && !allowedGradeBands.some((item) => item === classroom.gradeBand)) {
      return res.status(403).json({ error: "This classroom is not currently allowed by district policy." });
    }
    await databaseTransaction(async (tx) => {
      await tx.classroomMembership.upsert({
        where: { classroomId_studentId: { classroomId: classroom.id, studentId: user.id } },
        create: { classroomId: classroom.id, studentId: user.id },
        update: { status: "ACTIVE" },
      });
      const assignments = await tx.assignment.findMany({
        where: { classroomId: classroom.id },
        select: { id: true },
      });
      if (assignments.length) {
        await tx.assignmentSubmission.createMany({
          data: assignments.map((assignment) => ({
            assignmentId: assignment.id,
            studentId: user.id,
          })),
          skipDuplicates: true,
        });
      }
    });
    return res.status(200).json({ ok: true });
  }

  if (action === "create-family-invite") {
    if (user.accountRole !== "GUARDIAN") {return res.status(403).json({ error: "Parent or guardian role required." });}
    const invite = await prisma.guardianInvite.create({
      data: {
        guardianId: user.id,
        code: createCode("FAMILY"),
        expiresAt: new Date(Date.now() + 7 * 86_400_000),
      },
    });
    return res.status(201).json({ invite });
  }

  if (action === "join-family") {
    if (user.accountRole !== "STUDENT") {return res.status(403).json({ error: "Student role required." });}
    const code = cleanText(req.body?.code, 30).toUpperCase();
    const relationship = cleanText(req.body?.relationship, 40) || "Guardian";
    const invite = await prisma.guardianInvite.findFirst({
      where: { code, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!invite || invite.guardianId === user.id) {return res.status(404).json({ error: "Family code is invalid or expired." });}
    await prisma.$transaction([
      prisma.guardianStudent.upsert({
        where: { guardianId_studentId: { guardianId: invite.guardianId, studentId: user.id } },
        create: { guardianId: invite.guardianId, studentId: user.id, relationship },
        update: { relationship, status: "ACTIVE" },
      }),
      prisma.guardianInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } }),
    ]);
    return res.status(200).json({ ok: true });
  }

  if (action === "create-assignment") {
    if (user.accountRole !== "TEACHER") {return res.status(403).json({ error: "Teacher role required." });}
    if (!["VERIFIED", "DOMAIN_VERIFIED"].includes(user.roleVerificationStatus)) {
      return res.status(403).json({ error: "Verified educator status required." });
    }
    const classroomId = cleanText(req.body?.classroomId, 64);
    const classroom = await prisma.classroom.findFirst({ where: { id: classroomId, teacherId: user.id } });
    if (!classroom) {return res.status(404).json({ error: "Classroom not found." });}
    const title = cleanText(req.body?.title, 160);
    const instructions = cleanText(req.body?.instructions, 1000);
    if (!title) {return res.status(400).json({ error: "Assignment title is required." });}
    const dueAt = req.body?.dueAt ? new Date(req.body.dueAt) : null;
    const assignment = await databaseTransaction(async (tx) => {
      const created = await tx.assignment.create({
        data: {
          classroomId,
          teacherId: user.id,
          title,
          instructions: instructions || null,
          dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null,
        },
      });
      const members = await tx.classroomMembership.findMany({
        where: { classroomId, status: "ACTIVE" },
        select: { studentId: true },
      });
      if (members.length) {
        await tx.assignmentSubmission.createMany({
          data: members.map((member) => ({ assignmentId: created.id, studentId: member.studentId })),
        });
      }
      return created;
    });
    return res.status(201).json({ assignment });
  }

  if (action === "complete-assignment") {
    if (user.accountRole !== "STUDENT") {return res.status(403).json({ error: "Student role required." });}
    if (user.learningLockedUntil && user.learningLockedUntil > new Date()) {
      return res.status(423).json({
        code: "LEARNING_LOCKED",
        error: "Assignments cannot be completed during the safety pause.",
        lockedUntil: user.learningLockedUntil.toISOString(),
      });
    }
    const assignmentId = cleanText(req.body?.assignmentId, 64);
    const submission = await prisma.assignmentSubmission.updateMany({
      where: { assignmentId, studentId: user.id },
      data: { status: "COMPLETED", submittedAt: new Date() },
    });
    if (!submission.count) {return res.status(404).json({ error: "Assignment not found." });}
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: "Unknown action." });
}

export default withApiMonitoring("api.community", handler);
