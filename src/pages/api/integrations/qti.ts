import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/auth";
import { buildQtiPackage, parseQtiPackage, type QtiQuestion } from "@/lib/interoperability/qti";
import { prisma } from "@/lib/prisma";

export const config = { api: { bodyParser: { sizeLimit: "12mb" } } };

function normalizeQuestions(value: unknown): QtiQuestion[] {
  if (!Array.isArray(value)) {return [];}
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {return [];}
    const question = item as Record<string, unknown>;
    const prompt = typeof question.question === "string"
      ? question.question
      : typeof question.prompt === "string" ? question.prompt : "";
    const options = question.options && typeof question.options === "object"
      ? Object.fromEntries(Object.entries(question.options).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string"
        ))
      : {};
    const answer = typeof question.answer === "string"
      ? question.answer
      : typeof question.correctAnswer === "string" ? question.correctAnswer : "";
    if (!prompt || Object.keys(options).length < 2 || !answer) {return [];}
    return [{
      question: prompt.slice(0, 2_000),
      options,
      answer,
      explanation: typeof question.explanation === "string" ? question.explanation.slice(0, 2_000) : undefined,
      concept: typeof question.concept === "string" ? question.concept.slice(0, 160) : undefined,
    }];
  }).slice(0, 200);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireApiUser(req, res);
  if (!user) {return;}
  if (req.method === "GET") {
    const quizId = typeof req.query.quizId === "string" ? req.query.quizId : "";
    const quiz = await prisma.savedQuiz.findFirst({ where: { id: quizId, userId: user.id } });
    if (!quiz) {return res.status(404).json({ error: "Quiz not found." });}
    const questions = normalizeQuestions(quiz.questions);
    if (questions.length === 0) {return res.status(422).json({ error: "Quiz has no exportable questions." });}
    const archive = await buildQtiPackage({ identifier: quiz.id, title: quiz.title, questions });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${quiz.title.replace(/[^A-Za-z0-9_-]+/g, "-").slice(0, 80) || "assessment"}-qti.zip"`);
    return res.status(200).send(archive);
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const packageBase64 = typeof req.body?.packageBase64 === "string" ? req.body.packageBase64 : "";
  if (!packageBase64 || packageBase64.length > 14_000_000) {
    return res.status(400).json({ error: "Provide a QTI ZIP package up to 10 MB." });
  }
  const questions = await parseQtiPackage(Buffer.from(packageBase64, "base64"));
  if (questions.length === 0) {
    return res.status(422).json({ error: "No supported QTI 2.2 multiple-choice items were found." });
  }
  const title = typeof req.body?.title === "string"
    ? req.body.title.trim().slice(0, 160)
    : "Imported QTI assessment";
  const quiz = await prisma.savedQuiz.create({
    data: {
      userId: user.id,
      title: title || "Imported QTI assessment",
      source: "QTI_2_2_IMPORT",
      questions,
    },
  });
  await prisma.auditEvent.create({
    data: {
      actorUserId: user.id,
      subjectId: user.id,
      action: "QTI_ASSESSMENT_IMPORTED",
      resourceType: "SavedQuiz",
      resourceId: quiz.id,
      metadata: { questionCount: questions.length },
    },
  });
  return res.status(201).json({ ok: true, quizId: quiz.id, questionCount: questions.length });
}
