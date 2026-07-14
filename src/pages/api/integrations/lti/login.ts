import type { NextApiRequest, NextApiResponse } from "next";
import { hashLtiValue, randomLtiValue } from "@/lib/interoperability/lti";
import { prisma } from "@/lib/prisma";

function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {return res.status(405).end();}
  const issuer = queryValue(req.query.iss).replace(/\/$/, "");
  const clientId = queryValue(req.query.client_id);
  const loginHint = queryValue(req.query.login_hint);
  const messageHint = queryValue(req.query.lti_message_hint);
  const targetLinkUri = queryValue(req.query.target_link_uri);
  if (!issuer || !loginHint || !targetLinkUri) {
    return res.status(400).json({ error: "Missing required LTI login parameters." });
  }
  const deployment = await prisma.ltiDeployment.findFirst({
    where: { issuer, active: true, ...(clientId ? { clientId } : {}) },
  });
  if (!deployment) {return res.status(404).json({ error: "LTI deployment not registered." });}
  const appOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000").origin;
  let target: URL;
  try {target = new URL(targetLinkUri);} catch {return res.status(400).json({ error: "Invalid target link URI." });}
  if (target.origin !== appOrigin) {
    return res.status(400).json({ error: "Untrusted LTI target link URI." });
  }
  const state = randomLtiValue();
  const nonce = randomLtiValue();
  await prisma.ltiLaunchState.create({
    data: {
      deploymentId: deployment.id,
      stateHash: hashLtiValue(state),
      nonceHash: hashLtiValue(nonce),
      targetLinkUri,
      loginHint: loginHint.slice(0, 500),
      messageHint: messageHint.slice(0, 1_000) || null,
      expiresAt: new Date(Date.now() + 10 * 60_000),
    },
  });
  const params = new URLSearchParams({
    scope: "openid",
    response_type: "id_token",
    response_mode: "form_post",
    prompt: "none",
    client_id: deployment.clientId,
    redirect_uri: `${appOrigin}/api/integrations/lti/launch`,
    login_hint: loginHint,
    state,
    nonce,
  });
  if (messageHint) {params.set("lti_message_hint", messageHint);}
  return res.redirect(302, `${deployment.authLoginUrl}${deployment.authLoginUrl.includes("?") ? "&" : "?"}${params}`);
}
