import type { NextApiRequest, NextApiResponse } from "next";
import type { Prisma } from "@prisma/client";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CaseItem = {
  identifier?: unknown;
  uri?: unknown;
  fullStatement?: unknown;
  humanCodingScheme?: unknown;
  educationLevel?: unknown;
  CFDocumentURI?: { identifier?: unknown; uri?: unknown };
};

function text(value: unknown, length = 500) {
  return typeof value === "string" ? value.trim().slice(0, length) : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authUser = await requireApiUser(req, res);
  if (!authUser) {return;}
  const teacher = await prisma.user.findFirst({
    where: {
      id: authUser.id,
      accountRole: "TEACHER",
      roleVerificationStatus: { in: ["VERIFIED", "DOMAIN_VERIFIED"] },
    },
  });
  if (!teacher) {return res.status(403).json({ error: "Verified teacher role required." });}

  if (req.method === "GET") {
    const query = text(req.query.q, 120);
    const standards = await prisma.academicStandard.findMany({
      where: query
        ? { OR: [{ code: { contains: query, mode: "insensitive" } }, { title: { contains: query, mode: "insensitive" } }] }
        : {},
      orderBy: [{ framework: "asc" }, { code: "asc" }],
      take: 100,
    });
    return res.status(200).json({ standards });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (req.body?.action === "align-concept") {
    const conceptId = text(req.body?.conceptId, 64);
    const standardId = text(req.body?.standardId, 64);
    const concept = await prisma.concept.findFirst({
      where: { id: conceptId, course: { userId: teacher.id } },
    });
    const standard = await prisma.academicStandard.findUnique({ where: { id: standardId } });
    if (!concept || !standard) {return res.status(404).json({ error: "Concept or standard not found." });}
    await prisma.concept.update({
      where: { id: concept.id },
      data: {
        academicStandardId: standard.id,
        standardFramework: standard.framework,
        standardCode: standard.code,
      },
    });
    return res.status(200).json({ ok: true });
  }

  const framework = text(req.body?.framework, 120);
  const version = text(req.body?.version, 80) || "unspecified";
  const subject = text(req.body?.subject, 120) || null;
  const caseData = req.body?.caseData;
  const items: CaseItem[] = Array.isArray(caseData?.CFItems)
    ? caseData.CFItems
    : Array.isArray(caseData?.items) ? caseData.items : [];
  if (!framework || items.length === 0) {
    return res.status(400).json({ error: "Framework name and CASE CFItems are required." });
  }
  const uriToId = new Map<string, string>();
  let imported = 0;
  for (const item of items.slice(0, 20_000)) {
    const code = text(item.humanCodingScheme, 120) || text(item.identifier, 120);
    const title = text(item.fullStatement, 2_000);
    if (!code || !title) {continue;}
    const educationLevels = Array.isArray(item.educationLevel)
      ? item.educationLevel.filter((value): value is string => typeof value === "string")
      : [];
    const standard = await prisma.academicStandard.upsert({
      where: { framework_version_code: { framework, version, code } },
      create: {
        framework,
        version,
        code,
        uri: text(item.uri, 500) || null,
        title: title.slice(0, 500),
        description: title,
        gradeBand: educationLevels.join(", ").slice(0, 120) || null,
        subject,
        metadata: { caseIdentifier: text(item.identifier, 160) } as Prisma.InputJsonValue,
      },
      update: {
        uri: text(item.uri, 500) || null,
        title: title.slice(0, 500),
        description: title,
        gradeBand: educationLevels.join(", ").slice(0, 120) || null,
        subject,
      },
    });
    const uri = text(item.uri, 500);
    if (uri) {uriToId.set(uri, standard.id);}
    imported += 1;
  }
  const associations = Array.isArray(caseData?.CFAssociations)
    ? caseData.CFAssociations as Array<Record<string, unknown>>
    : [];
  let linked = 0;
  for (const association of associations.slice(0, 40_000)) {
    const origin = association.originNodeURI as { uri?: unknown } | undefined;
    const destination = association.destinationNodeURI as { uri?: unknown } | undefined;
    const sourceId = uriToId.get(text(origin?.uri, 500));
    const targetId = uriToId.get(text(destination?.uri, 500));
    const type = text(association.associationType, 80) || "RELATED_TO";
    if (!sourceId || !targetId || sourceId === targetId) {continue;}
    await prisma.standardAssociation.upsert({
      where: { sourceId_targetId_type: { sourceId, targetId, type } },
      create: { sourceId, targetId, type },
      update: {},
    });
    linked += 1;
  }
  await prisma.auditEvent.create({
    data: {
      actorUserId: teacher.id,
      subjectId: teacher.id,
      action: "CASE_FRAMEWORK_IMPORTED",
      resourceType: "AcademicStandard",
      metadata: { framework, version, imported, linked } as Prisma.InputJsonValue,
    },
  });
  return res.status(200).json({ ok: true, imported, linked });
}
