import type { NextApiRequest, NextApiResponse } from "next";
import { appleAssociation } from "@/lib/mobileAssociation";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {res.setHeader("Allow", "GET"); return res.status(405).end();}
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  return res.status(200).json(appleAssociation());
}
