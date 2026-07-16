import type { NextApiRequest, NextApiResponse } from "next";
import { withApiMonitoring } from "@/lib/apiMonitoring";
import { Prisma } from "@prisma/client";
import { openai } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/auth";
import { getPrimaryCourse } from "@/lib/concepts";
import { parseAiJson } from "@/lib/parseAiJson";
import { gradeBandFor } from "@/lib/learningProfile";
import { normalizeConceptName } from "@/lib/mastery";
import { recordMasteryEvidence } from "@/lib/masteryService";
import { aiAccessForUser, K12_SAFETY_PROMPT, moderateK12Content } from "@/lib/childSafety";
import {
  chooseNextQuestion,
  fallbackDiagnostic,
  publicQuestion,
  updateAbilityEstimate,
  validateDiagnosticQuestions,
  type DiagnosticQuestion,
  type DiagnosticResponse,
} from "@/lib/diagnostic";
import { isAiFreeTestMode } from "@/lib/aiFreeTestMode";

const QUESTION_COUNT = 6;

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireApiUser(req, res);
  if (!user) {return;}

  if (req.method === "GET") {
    const assessment = await prisma.diagnosticAssessment.findFirst({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        status: true,
        subject: true,
        abilityEstimate: true,
        summary: true,
        completedAt: true,
      },
    });
    return res.status(200).json({ assessment });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const action = req.body?.action === "answer" ? "answer" : "start";
  try {
    if (action === "start") {
      return await startDiagnostic(user.id, res);
    }
    return await answerDiagnostic(user.id, req, res);
  } catch (error) {
    console.error("Diagnostic error:", error);
    return res.status(500).json({ error: "The diagnostic could not continue." });
  }
}

export default withApiMonitoring("api.diagnostic", handler);

async function startDiagnostic(userId: string, res: NextApiResponse) {
  const [profile, course] = await Promise.all([
    prisma.learnerProfile.findUnique({ where: { userId } }),
    getPrimaryCourse(userId),
  ]);
  if (!profile?.onboardingCompleted || !course) {
    return res.status(409).json({ error: "Complete your learning profile first." });
  }

  let questions: DiagnosticQuestion[] = isAiFreeTestMode ? fallbackDiagnostic(profile.gradeLevel) : [];
  if (!isAiFreeTestMode) {
    const access = await aiAccessForUser(userId);
    try {
      if (!access.allowed) {throw new Error(access.reason);}
    const context = `Grade: ${profile.gradeLevel}. Course: ${course.name}. Subject: ${course.subject}. Learning goal: ${course.learningGoal ?? profile.primaryLearningGoal ?? "build mastery"}.`;
    const contextSafety = await moderateK12Content(userId, context, "DIAGNOSTIC_CONTEXT");
    if (!contextSafety.allowed) {throw new Error("Unsafe diagnostic context");}
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 2200,
      messages: [
        {
          role: "system",
          content:
            `${K12_SAFETY_PROMPT}\n\nCreate 10 safe, age-appropriate K-12 readiness questions. Questions must diagnose prerequisites, not trivia. Cover difficulty 1 through 5, use unambiguous A-D choices, and include no sensitive personal questions. Include an estimated item discrimination from 0.5 to 2, guessing probability from 0.05 to 0.35, and a recognized K-12 standard code only when confident. Return JSON only: {"questions":[{"id":"q1","concept":"short skill","prerequisite":"earlier skill or null","prompt":"","options":{"A":"","B":"","C":"","D":""},"answer":"A","difficulty":1,"discrimination":1,"guessing":0.2,"standardCode":null,"reason":"why this predicts readiness"}]}`,
        },
        {
          role: "user",
          content: context,
        },
      ],
    });
    const raw = completion.choices[0].message.content;
    const outputSafety = await moderateK12Content(userId, raw ?? "", "DIAGNOSTIC_OUTPUT");
    if (!outputSafety.allowed) {throw new Error("Unsafe diagnostic output");}
      questions = validateDiagnosticQuestions(parseAiJson(raw));
    } catch (error) {
      console.warn("Using fallback diagnostic:", error);
    }
  }
  if (questions.length < QUESTION_COUNT) {
    questions = fallbackDiagnostic(profile.gradeLevel);
  }

  const assessment = await prisma.diagnosticAssessment.create({
    data: {
      userId,
      courseId: course.id,
      gradeBand: gradeBandFor(profile.gradeLevel),
      subject: course.subject,
      questions: questions as unknown as Prisma.InputJsonValue,
      responses: [],
    },
  });
  const first = chooseNextQuestion(questions, [], assessment.abilityEstimate);
  return res.status(201).json({
    assessmentId: assessment.id,
    progress: { answered: 0, total: QUESTION_COUNT },
    question: first ? publicQuestion(first) : null,
  });
}

async function answerDiagnostic(
  userId: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  const assessmentId =
    typeof req.body.assessmentId === "string" ? req.body.assessmentId : "";
  const questionId =
    typeof req.body.questionId === "string" ? req.body.questionId : "";
  const answer = typeof req.body.answer === "string" ? req.body.answer : "";
  if (!assessmentId || !questionId || !["A", "B", "C", "D"].includes(answer)) {
    return res.status(400).json({ error: "Choose an answer before continuing." });
  }

  const assessment = await prisma.diagnosticAssessment.findFirst({
    where: { id: assessmentId, userId },
  });
  if (!assessment || assessment.status !== "IN_PROGRESS") {
    return res.status(404).json({ error: "Active diagnostic not found." });
  }
  const questions = assessment.questions as unknown as DiagnosticQuestion[];
  const responses = assessment.responses as unknown as DiagnosticResponse[];
  const expected = chooseNextQuestion(questions, responses, assessment.abilityEstimate);
  if (!expected || expected.id !== questionId) {
    return res.status(409).json({ error: "This question is no longer active." });
  }

  const correct = expected.answer === answer;
  const abilityEstimate = updateAbilityEstimate(
    assessment.abilityEstimate,
    correct,
    expected
  );
  const nextResponses: DiagnosticResponse[] = [
    ...responses,
    {
      questionId,
      answer,
      correct,
      concept: expected.concept,
      difficulty: expected.difficulty,
    },
  ];

  if (nextResponses.length < Math.min(QUESTION_COUNT, questions.length)) {
    await prisma.diagnosticAssessment.update({
      where: { id: assessment.id },
      data: {
        responses: nextResponses as unknown as Prisma.InputJsonValue,
        abilityEstimate,
      },
    });
    const next = chooseNextQuestion(questions, nextResponses, abilityEstimate);
    return res.status(200).json({
      feedback: { correct, explanation: expected.reason },
      progress: { answered: nextResponses.length, total: QUESTION_COUNT },
      question: next ? publicQuestion(next) : null,
    });
  }

  const summary = await completeDiagnostic(
    assessment.id,
    userId,
    assessment.courseId,
    assessment.gradeBand,
    questions,
    nextResponses,
    abilityEstimate
  );
  return res.status(200).json({
    complete: true,
    feedback: { correct, explanation: expected.reason },
    summary,
  });
}

async function completeDiagnostic(
  assessmentId: string,
  userId: string,
  courseId: string | null,
  gradeBand: string,
  questions: DiagnosticQuestion[],
  responses: DiagnosticResponse[],
  abilityEstimate: number
) {
  if (!courseId) {throw new Error("Diagnostic course is missing");}
  const grouped = new Map<string, DiagnosticResponse[]>();
  for (const response of responses) {
    grouped.set(response.concept, [
      ...(grouped.get(response.concept) ?? []),
      response,
    ]);
  }
  const results = [...grouped.entries()].map(([concept, items]) => ({
    concept,
    correct: items.filter((item) => item.correct).length,
    total: items.length,
    mastery: items.filter((item) => item.correct).length / items.length,
    prerequisite:
      questions.find((question) => question.concept === concept)?.prerequisite ?? null,
  }));
  const strengths = results.filter((result) => result.mastery >= 0.7);
  const priorities = results.filter((result) => result.mastery < 0.7);
  const summary = {
    readiness: Math.round(abilityEstimate * 100),
    strengths: strengths.map((result) => result.concept),
    priorities: priorities.map((result) => result.concept),
    nextSteps: priorities.map((result) => ({
      concept: result.concept,
      why: result.prerequisite
        ? `Build ${result.prerequisite} first; it supports this skill.`
        : "This was the clearest readiness gap in the diagnostic.",
    })),
  };

  await prisma.$transaction(async (tx) => {
    for (const result of results) {
      const normalizedName = normalizeConceptName(result.concept);
      const concept = await tx.concept.upsert({
        where: { courseId_normalizedName: { courseId, normalizedName } },
        create: {
          courseId,
          name: result.concept,
          normalizedName,
          gradeBand,
          standardCode: questions.find((item) => item.concept === result.concept)?.standardCode,
        },
        update: {
          name: result.concept,
          gradeBand,
          standardCode: questions.find((item) => item.concept === result.concept)?.standardCode,
        },
      });
      let estimatedMastery = result.mastery;
      for (const response of itemsForConcept(result.concept, responses, questions)) {
        const mastery = await recordMasteryEvidence(tx, {
          userId,
          conceptId: concept.id,
          sourceType: "DIAGNOSTIC_RESPONSE",
          sourceId: assessmentId,
          correct: response.correct,
          difficulty: response.question.difficulty / 5,
          independent: true,
        });
        estimatedMastery = mastery.score;
      }
      if (result.prerequisite) {
        const prerequisiteName = result.prerequisite.trim().slice(0, 120);
        const prerequisiteNormalized = normalizeConceptName(prerequisiteName);
        if (prerequisiteNormalized && prerequisiteNormalized !== normalizedName) {
          const prerequisite = await tx.concept.upsert({
            where: { courseId_normalizedName: { courseId, normalizedName: prerequisiteNormalized } },
            create: { courseId, name: prerequisiteName, normalizedName: prerequisiteNormalized, gradeBand },
            update: { name: prerequisiteName, gradeBand },
          });
          await tx.conceptPrerequisite.upsert({
            where: { conceptId_prerequisiteId: { conceptId: concept.id, prerequisiteId: prerequisite.id } },
            create: { conceptId: concept.id, prerequisiteId: prerequisite.id, source: "DIAGNOSTIC" },
            update: { source: "DIAGNOSTIC" },
          });
        }
      }
      await tx.diagnosticConceptResult.create({
        data: {
          assessmentId,
          conceptId: concept.id,
          correctCount: result.correct,
          totalCount: result.total,
          estimatedMastery,
        },
      });
    }
    await tx.diagnosticAssessment.update({
      where: { id: assessmentId },
      data: {
        status: "COMPLETED",
        responses: responses as unknown as Prisma.InputJsonValue,
        abilityEstimate,
        summary,
        completedAt: new Date(),
      },
    });
    await tx.learnerProfile.update({
      where: { userId },
      data: { diagnosticCompleted: true, lastDiagnosticAt: new Date() },
    });
  });
  return summary;
}

function itemsForConcept(
  concept: string,
  responses: DiagnosticResponse[],
  questions: DiagnosticQuestion[]
) {
  const questionById = new Map(questions.map((question) => [question.id, question]));
  return responses.flatMap((response) => {
    const question = questionById.get(response.questionId);
    return response.concept === concept && question ? [{ ...response, question }] : [];
  });
}
