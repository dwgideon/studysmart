import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {return res.status(405).end();}
  const origin = new URL(process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000").origin;
  return res.status(200).json({
    title: "StudySmart K–12 Learning Tool",
    description: "Adaptive, source-grounded K–12 study and tutoring.",
    oidc_initiation_url: `${origin}/api/integrations/lti/login`,
    target_link_uri: `${origin}/api/integrations/lti/launch`,
    redirect_uris: [`${origin}/api/integrations/lti/launch`],
    scopes: [],
    messages: [{ type: "LtiResourceLinkRequest", placements: ["course_navigation", "assignment_selection"] }],
  });
}
