import { createRemoteJWKSet, jwtVerify } from "jose";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Prisma } from "@prisma/client";
import { hashLtiValue, LTI_CLAIMS, safeExternalHttpsUrl } from "@/lib/interoperability/lti";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {return res.status(405).end();}
  const state = typeof req.body?.state === "string" ? req.body.state : "";
  const idToken = typeof req.body?.id_token === "string" ? req.body.id_token : "";
  if (!state || !idToken) {return res.status(400).json({ error: "Missing LTI launch token or state." });}
  const launchState = await prisma.ltiLaunchState.findUnique({
    where: { stateHash: hashLtiValue(state) },
    include: { deployment: true },
  });
  if (!launchState || launchState.usedAt || launchState.expiresAt <= new Date()) {
    return res.status(400).json({ error: "LTI launch state is invalid or expired." });
  }
  try {
    const jwks = createRemoteJWKSet(safeExternalHttpsUrl(launchState.deployment.jwksUrl));
    const verified = await jwtVerify(idToken, jwks, {
      issuer: launchState.deployment.issuer,
      audience: launchState.deployment.clientId,
      maxTokenAge: "10 minutes",
      clockTolerance: 10,
    });
    const claims = verified.payload;
    if (!claims.nonce || hashLtiValue(String(claims.nonce)) !== launchState.nonceHash) {
      throw new Error("LTI nonce validation failed.");
    }
    if (claims[LTI_CLAIMS.deploymentId] !== launchState.deployment.deploymentId) {
      throw new Error("LTI deployment claim does not match registration.");
    }
    if (claims[LTI_CLAIMS.version] !== "1.3.0") {
      throw new Error("Unsupported LTI version.");
    }
    const roles = Array.isArray(claims[LTI_CLAIMS.roles]) ? claims[LTI_CLAIMS.roles] : [];
    const context = claims[LTI_CLAIMS.context] as { id?: unknown; title?: unknown } | undefined;
    const resource = claims[LTI_CLAIMS.resourceLink] as { id?: unknown; title?: unknown } | undefined;
    const subjectHash = hashLtiValue(`${launchState.deployment.issuer}|${claims.sub ?? ""}`);
    const launch = await prisma.$transaction(async (tx) => {
      await tx.ltiLaunchState.update({ where: { id: launchState.id }, data: { usedAt: new Date() } });
      return tx.ltiLaunch.create({
        data: {
          deploymentId: launchState.deployment.id,
          subjectHash,
          contextId: typeof context?.id === "string" ? context.id.slice(0, 500) : null,
          resourceLinkId: typeof resource?.id === "string" ? resource.id.slice(0, 500) : null,
          roles: roles as Prisma.InputJsonValue,
          claims: {
            messageType: claims[LTI_CLAIMS.messageType],
            contextTitle: typeof context?.title === "string" ? context.title.slice(0, 300) : null,
            resourceTitle: typeof resource?.title === "string" ? resource.title.slice(0, 300) : null,
          } as Prisma.InputJsonValue,
        },
      });
    });
    const appOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000").origin;
    return res.redirect(303, `${appOrigin}/login?ltiLaunch=${encodeURIComponent(launch.id)}`);
  } catch (error) {
    console.warn("Rejected LTI launch:", error);
    return res.status(401).json({ error: "LTI launch verification failed." });
  }
}
