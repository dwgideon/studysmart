import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  // TODO: parse file, extract text, save to Supabase
  // For now, return a guaranteed sessionId

  const sessionId = randomUUID();

  res.status(200).json({ sessionId });
}
