import type { NextApiRequest, NextApiResponse } from 'next';

type Recommendation = {
  topic: string;
  confidence: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).end('Method Not Allowed');
    return;
  }

  try {
    const { keywords }: { keywords: string[] } = req.body;

    // Simulated recommendation logic
    const recommendations: Recommendation[] = keywords.map((keyword, index) => ({
      topic: `Recommended Topic for ${keyword}`,
      confidence: Math.round((Math.random() * 10000) / (index + 1)) / 100,
    }));

    res.status(200).json({ recommendations });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
}
