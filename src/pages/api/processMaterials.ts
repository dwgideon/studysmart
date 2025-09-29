// src/pages/api/processMaterials.js
import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

export const config = { api: { bodyParser: false } };

const DEPTH_CONFIG = {
  min: { flashcards: 20, quizQuestions: 10, summaryParas: 1, studyBullets: 5, maxTokens: 800 },
  med: { flashcards: 40, quizQuestions: 20, summaryParas: 2, studyBullets: 10, maxTokens: 1500 },
  max: { flashcards: 80, quizQuestions: 40, summaryParas: 4, studyBullets: 20, maxTokens: 2500 },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST');
    return res.status(405).end('Method Not Allowed');
  }

  const form = formidable({ multiples: true });
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error parsing form data' });

    const { depth = 'med', topic = '' } = fields;
    const cfg = DEPTH_CONFIG[depth] || DEPTH_CONFIG.med;

    // Extract text (PDF/text only for brevity)
    const textPieces = [];
    const noteFiles = Array.isArray(files['note-upload'])
      ? files['note-upload']
      : files['note-upload'] ? [files['note-upload']] : [];

    for (let nf of noteFiles) {
      const buf = fs.readFileSync(nf.filepath);
      if (nf.mimetype === 'application/pdf') {
        const data = await pdfParse(buf);
        textPieces.push(data.text);
      } else {
        textPieces.push(buf.toString('utf8'));
      }
    }
    const combinedText = textPieces.join('\n\n');

    // Build prompt with explanation request
    const prompt = `
You are an expert study-material generator. The learner provided materials on the topic: "${topic}".
Generate exactly:
1) A JSON array "flashcards" with ${cfg.flashcards} items of {question, answer}.
2) A JSON array "quizQuestions" with ${cfg.quizQuestions} items of {question, choices:[...], answer, explanation}.
3) A JSON field "summary" with exactly ${cfg.summaryParas} paragraph${cfg.summaryParas>1?'s':''}.
4) A JSON array "studyGuide" with ${cfg.studyBullets} bullet-point strings.

Use only the content below. Return valid JSON only.
-----  
${combinedText}
-----`.trim();

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You generate study materials.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: cfg.maxTokens,
      });

      const aiText = response.choices[0].message.content;
      const result = JSON.parse(aiText);
      return res.status(200).json(result);
    } catch (e) {
      console.error('AI generation error:', e);
      // Fallback omitted for brevity
      return res.status(500).json({ error: 'AI generation failed', detail: e.message });
    }
  });
}

