import type { NextApiRequest, NextApiResponse } from "next";
import type { Prisma } from "@prisma/client";
import { requireApiUser } from "@/lib/auth";
import { parseCsv, serializeCsv } from "@/lib/interoperability/csv";
import { databaseTransaction, prisma } from "@/lib/prisma";

async function verifiedTeacher(userId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      accountRole: "TEACHER",
      roleVerificationStatus: { in: ["VERIFIED", "DOMAIN_VERIFIED"] },
    },
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authUser = await requireApiUser(req, res);
  if (!authUser) {return;}
  const teacher = await verifiedTeacher(authUser.id);
  if (!teacher) {return res.status(403).json({ error: "Verified teacher role required." });}

  if (req.method === "GET") {
    const resource = typeof req.query.resource === "string" ? req.query.resource : "classes";
    const classrooms = await prisma.classroom.findMany({
      where: { teacherId: teacher.id, archivedAt: null },
      include: { memberships: { where: { status: "ACTIVE" }, include: { student: true } } },
    });
    let fileName = "classes.csv";
    let csv: string;
    if (resource === "users") {
      fileName = "users.csv";
      const people = new Map<string, { id: string; email: string; name: string | null; role: string }>();
      people.set(teacher.id, { ...teacher, role: "teacher" });
      for (const classroom of classrooms) {
        for (const membership of classroom.memberships) {
          people.set(membership.student.id, { ...membership.student, role: "student" });
        }
      }
      csv = serializeCsv(
        ["sourcedId", "status", "dateLastModified", "enabledUser", "orgSourcedIds", "role", "username", "givenName", "familyName", "email", "grades", "password"],
        [...people.values()].map((person) => ({
          sourcedId: person.id,
          status: "active",
          dateLastModified: new Date().toISOString(),
          enabledUser: "true",
          orgSourcedIds: "",
          role: person.role,
          username: person.email,
          givenName: person.name?.split(" ")[0] ?? "",
          familyName: person.name?.split(" ").slice(1).join(" ") ?? "",
          email: person.email,
          grades: "",
          password: "",
        }))
      );
    } else if (resource === "enrollments") {
      fileName = "enrollments.csv";
      csv = serializeCsv(
        ["sourcedId", "status", "dateLastModified", "classSourcedId", "schoolSourcedId", "userSourcedId", "role", "primary", "beginDate", "endDate"],
        classrooms.flatMap((classroom) => classroom.memberships.map((membership) => ({
          sourcedId: membership.id,
          status: "active",
          dateLastModified: membership.joinedAt.toISOString(),
          classSourcedId: classroom.id,
          schoolSourcedId: "",
          userSourcedId: membership.studentId,
          role: "student",
          primary: "false",
          beginDate: "",
          endDate: "",
        })))
      );
    } else {
      csv = serializeCsv(
        ["sourcedId", "status", "dateLastModified", "title", "grades", "courseSourcedId", "classCode", "classType", "location", "schoolSourcedId", "termSourcedIds", "subjects", "subjectCodes", "periods"],
        classrooms.map((classroom) => ({
          sourcedId: classroom.id,
          status: "active",
          dateLastModified: classroom.updatedAt.toISOString(),
          title: classroom.name,
          grades: classroom.gradeBand,
          courseSourcedId: "",
          classCode: classroom.joinCode,
          classType: "scheduled",
          location: "",
          schoolSourcedId: "",
          termSourcedIds: "",
          subjects: classroom.subject,
          subjectCodes: "",
          periods: "",
        }))
      );
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.status(200).send(csv);
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const files = req.body?.files;
  if (!files || typeof files !== "object") {
    return res.status(400).json({ error: "Provide OneRoster classes, users, and enrollments CSV text." });
  }
  const classes = parseCsv(typeof files.classes === "string" ? files.classes : "");
  const users = parseCsv(typeof files.users === "string" ? files.users : "");
  const enrollments = parseCsv(typeof files.enrollments === "string" ? files.enrollments : "");
  if (classes.length === 0) {return res.status(400).json({ error: "classes.csv is required." });}
  const connection = await prisma.integrationConnection.upsert({
    where: {
      ownerUserId_type_name: {
        ownerUserId: teacher.id,
        type: "ONEROSTER_1_2",
        name: "OneRoster CSV",
      },
    },
    create: { ownerUserId: teacher.id, type: "ONEROSTER_1_2", name: "OneRoster CSV" },
    update: { status: "ACTIVE" },
  });
  const emailByExternalId = new Map(users.map((user) => [user.sourcedId, user.email || user.username]));
  const matchingUsers = await prisma.user.findMany({
    where: { email: { in: [...emailByExternalId.values()].filter(Boolean) } },
    select: { id: true, email: true, accountRole: true },
  });
  const internalByExternalUser = new Map<string, string>();
  for (const [externalId, email] of emailByExternalId) {
    const match = matchingUsers.find((user) => user.email.toLocaleLowerCase() === email.toLocaleLowerCase());
    if (match?.accountRole === "STUDENT") {internalByExternalUser.set(externalId, match.id);}
  }

  const result = await databaseTransaction(async (tx) => {
    const classroomByExternal = new Map<string, string>();
    for (const item of classes.slice(0, 500)) {
      if (!item.sourcedId || !item.title) {continue;}
      const mapping = await tx.externalMapping.findUnique({
        where: {
          integrationId_entityType_externalId: {
            integrationId: connection.id,
            entityType: "CLASS",
            externalId: item.sourcedId,
          },
        },
      });
      const existing = mapping
        ? await tx.classroom.findFirst({ where: { id: mapping.internalId, teacherId: teacher.id } })
        : null;
      const classroom = existing
        ? await tx.classroom.update({
            where: { id: existing.id },
            data: { name: item.title.slice(0, 160), subject: (item.subjects || "General").slice(0, 120), gradeBand: (item.grades || "K–12").slice(0, 40) },
          })
        : await tx.classroom.create({
            data: {
              teacherId: teacher.id,
              name: item.title.slice(0, 160),
              subject: (item.subjects || "General").slice(0, 120),
              gradeBand: (item.grades || "K–12").slice(0, 40),
              joinCode: `OR-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`,
            },
          });
      await tx.externalMapping.upsert({
        where: { integrationId_entityType_externalId: { integrationId: connection.id, entityType: "CLASS", externalId: item.sourcedId } },
        create: { integrationId: connection.id, entityType: "CLASS", externalId: item.sourcedId, internalId: classroom.id },
        update: { internalId: classroom.id },
      });
      classroomByExternal.set(item.sourcedId, classroom.id);
    }
    let enrolled = 0;
    let skipped = 0;
    for (const enrollment of enrollments.slice(0, 5_000)) {
      if (enrollment.role !== "student" || enrollment.status === "tobedeleted") {continue;}
      const classroomId = classroomByExternal.get(enrollment.classSourcedId);
      const studentId = internalByExternalUser.get(enrollment.userSourcedId);
      if (!classroomId || !studentId) {skipped += 1; continue;}
      await tx.classroomMembership.upsert({
        where: { classroomId_studentId: { classroomId, studentId } },
        create: { classroomId, studentId },
        update: { status: "ACTIVE" },
      });
      enrolled += 1;
    }
    await tx.auditEvent.create({
      data: {
        actorUserId: teacher.id,
        subjectId: teacher.id,
        action: "ONEROSTER_CSV_IMPORTED",
        resourceType: "IntegrationConnection",
        resourceId: connection.id,
        metadata: { classes: classroomByExternal.size, enrolled, skipped } as Prisma.InputJsonValue,
      },
    });
    return { classes: classroomByExternal.size, enrolled, skipped };
  });
  return res.status(200).json({ ok: true, ...result });
}
