import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/auth";
import { resolvedExternalHttpsUrl } from "@/lib/interoperability/lti";
import { prisma } from "@/lib/prisma";

function value(input: unknown, max = 500) {
  return typeof input === "string" ? input.trim().slice(0, max) : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
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
  try {
    const [issuerUrl, loginUrl, keysUrl, tokenUrl] = await Promise.all([
      resolvedExternalHttpsUrl(value(req.body?.issuer)),
      resolvedExternalHttpsUrl(value(req.body?.authLoginUrl)),
      resolvedExternalHttpsUrl(value(req.body?.jwksUrl)),
      req.body?.authTokenUrl ? resolvedExternalHttpsUrl(value(req.body.authTokenUrl)) : null,
    ]);
    const issuer = issuerUrl.toString().replace(/\/$/, "");
    const authLoginUrl = loginUrl.toString();
    const jwksUrl = keysUrl.toString();
    const authTokenUrl = tokenUrl?.toString() ?? null;
    const clientId = value(req.body?.clientId, 240);
    const deploymentId = value(req.body?.deploymentId, 240);
    const name = value(req.body?.name, 160) || new URL(issuer).hostname;
    if (!clientId || !deploymentId) {
      return res.status(400).json({ error: "Client ID and deployment ID are required." });
    }
    const integration = await prisma.integrationConnection.upsert({
      where: { ownerUserId_type_name: { ownerUserId: teacher.id, type: "LTI_1_3", name } },
      create: { ownerUserId: teacher.id, type: "LTI_1_3", name },
      update: { status: "ACTIVE" },
    });
    const deployment = await prisma.ltiDeployment.upsert({
      where: { issuer_clientId_deploymentId: { issuer, clientId, deploymentId } },
      create: {
        integrationId: integration.id,
        issuer,
        clientId,
        deploymentId,
        authLoginUrl,
        authTokenUrl,
        jwksUrl,
      },
      update: { integrationId: integration.id, authLoginUrl, authTokenUrl, jwksUrl, active: true },
    });
    return res.status(201).json({ ok: true, deploymentId: deployment.id });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Invalid LTI registration." });
  }
}
