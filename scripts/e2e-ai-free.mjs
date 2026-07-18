import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const baseUrl = (process.env.E2E_BASE_URL || "http://localhost:3010").replace(/\/$/, "");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;
assert.ok(supabaseUrl && anonKey && serviceKey && databaseUrl, "Supabase and database environment variables are required");

const e2eDatabaseUrl = new URL(databaseUrl);
e2eDatabaseUrl.searchParams.set("connection_limit", "1");
e2eDatabaseUrl.searchParams.set("pool_timeout", "30");
const prisma = new PrismaClient({ datasources: { db: { url: e2eDatabaseUrl.toString() } } });
const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
const suffix = `${Date.now()}-${randomUUID().slice(0, 6)}`;
const password = `StudySmart-E2E-${suffix}-Strong`;
const createdAuthIds = [];
const createdOrganizationIds = [];
const checks = [];

function serializeSupabaseSession(session) {
  return JSON.stringify([
    session.access_token,
    session.refresh_token,
    session.provider_token,
    session.provider_refresh_token,
    session.user?.factors ?? null,
  ]);
}

const gradeBands = {
  K: "EARLY", 1: "EARLY", 2: "EARLY",
  3: "ELEMENTARY", 4: "ELEMENTARY", 5: "ELEMENTARY",
  6: "MIDDLE", 7: "MIDDLE", 8: "MIDDLE",
  9: "HIGH", 10: "HIGH", 11: "HIGH", 12: "HIGH",
};

function pass(name) {
  checks.push(name);
  process.stdout.write(`✓ ${name}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableAuthError(error) {
  return error?.status === 0
    || error?.status === 429
    || error?.status >= 500
    || error?.name === "AuthRetryableFetchError"
    || /fetch failed|ECONNRESET|network/i.test(error?.message || "");
}

async function authRequest(operation) {
  let lastError;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      const result = await operation();
      if (result?.error) {throw result.error;}
      return result;
    } catch (error) {
      lastError = error;
      if (!isRetryableAuthError(error) || attempt === 8) {throw error;}
      await sleep(Math.min(500 * attempt, 3_000));
    }
  }
  throw lastError;
}

async function findAuthUser(email) {
  for (let page = 1; ; page += 1) {
    const result = await authRequest(() => admin.auth.admin.listUsers({ page, perPage: 1000 }));
    const found = result.data.users.find((user) => user.email === email);
    if (found) {return found;}
    if (result.data.users.length < 1000) {return null;}
  }
}

async function database(operation) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!["P1001", "P1002", "P1017", "P2024"].includes(error?.code) || attempt === 4) {
        throw error;
      }
      await prisma.$disconnect();
      await sleep(200 * attempt);
    }
  }
  throw lastError;
}

async function deleteTestActors(userIds) {
  if (!userIds.length) {return;}
  await database(() => prisma.$transaction([
    prisma.cardReview.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.flashcard.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.studySession.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.savedQuiz.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.studyStreak.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.note.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.user.deleteMany({ where: { id: { in: userIds } } }),
  ]));
}

async function cleanupInterruptedFixtures() {
  const staleAuthUsers = [];
  for (let page = 1; ; page += 1) {
    const result = await authRequest(() => admin.auth.admin.listUsers({ page, perPage: 1000 }));
    staleAuthUsers.push(...result.data.users.filter((user) =>
      user.email?.startsWith("studysmart-e2e-")
    ));
    if (result.data.users.length < 1000) {break;}
  }
  if (!staleAuthUsers.length) {return;}
  const staleIds = staleAuthUsers.map((user) => user.id);
  await database(() => prisma.organization.deleteMany({
    where: { name: { startsWith: "E2E District " } },
  }));
  await deleteTestActors(staleIds);
  for (const user of staleAuthUsers) {
    await authRequest(() => admin.auth.admin.deleteUser(user.id));
  }
  process.stdout.write(`Cleaned ${staleAuthUsers.length} interrupted E2E fixture(s).\n`);
}

async function createActor(kind, domain = "example.com") {
  const email = `studysmart-e2e-${kind}-${suffix}@${domain}`;
  let actorUser;
  try {
    const created = await authRequest(() => admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `E2E ${kind}` },
    }));
    actorUser = created.data.user;
  } catch (error) {
    actorUser = await findAuthUser(email);
    if (!actorUser) {throw error;}
  }
  createdAuthIds.push(actorUser.id);

  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const signed = await authRequest(() => client.auth.signInWithPassword({ email, password }));
  if (!signed.data.session) {throw new Error("Test sign-in failed");}
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  const sessionCookie = encodeURIComponent(serializeSupabaseSession(signed.data.session));
  return {
    id: actorUser.id,
    email,
    cookie: `sb-${ref}-auth-token=${sessionCookie}`,
  };
}

async function request(actor, path, options = {}) {
  const expected = options.expected || [200];
  let last;
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const headers = { ...(options.headers || {}) };
    if (actor?.cookie) {headers.cookie = actor.cookie;}
    let body;
    if (options.json !== undefined) {
      headers["content-type"] = "application/json";
      body = JSON.stringify(options.json);
    } else if (options.formText !== undefined) {
      const form = new FormData();
      form.set("text", options.formText);
      body = form;
    } else {
      body = options.body;
    }
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: options.method || "GET",
        headers,
        body,
        redirect: options.redirect || "follow",
      });
      const text = await response.text();
      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("json") && text ? JSON.parse(text) : text;
      last = { response, payload, text };
      if (expected.includes(response.status)) {return last;}
      if (![401, 500, 502, 503, 504].includes(response.status) || attempt === 8) {
        throw new Error(`${options.method || "GET"} ${path} returned ${response.status}: ${text.slice(0, 300)}`);
      }
    } catch (error) {
      if (attempt === 8) {throw error;}
      last = error;
    }
    await sleep(250 * attempt);
  }
  throw last instanceof Error ? last : new Error(`Request failed: ${path}`);
}

async function saveProfile(actor, gradeLevel, ageGroup, courseId, expectedAgeGroup) {
  const result = await request(actor, "/api/profile/learning-context", {
    method: "PUT",
    expected: [200],
    json: {
      gradeLevel,
      ageGroup,
      primaryLearningGoal: "Verify every safe K–12 learning pathway.",
      courseId,
      courseName: "End-to-end Learning Lab",
      subject: "Integrated K–12 Skills",
      examDate: "",
      courseLearningGoal: "Build durable, source-grounded mastery.",
    },
  });
  if (expectedAgeGroup) {assert.equal(result.payload.ageGroup, expectedAgeGroup);}
  return result.payload.course.id;
}

async function establishAdultRole(actor, role) {
  const age = await request(actor, "/api/trust", {
    method: "POST",
    json: { action: "update-age-group", ageGroup: "ADULT" },
  });
  assert.equal(age.payload.ageGroup, "ADULT");
  const changed = await request(actor, "/api/community", {
    method: "POST",
    json: { action: "set-role", role },
  });
  assert.equal(changed.payload.role, role);
}

async function completeDiagnostic(actor, grade) {
  const started = await request(actor, "/api/diagnostic", {
    method: "POST",
    expected: [201],
    json: { action: "start" },
  });
  const assessment = await database(() => prisma.diagnosticAssessment.findUniqueOrThrow({
    where: { id: started.payload.assessmentId },
  }));
  const questions = assessment.questions;
  assert.equal(assessment.gradeBand, gradeBands[grade]);
  assert.equal(questions.length, 6);
  assert.equal(new Set(questions.map((item) => item.concept)).size, 6);
  assert.ok(questions.every((item) => item.options[item.answer]));
  const answers = new Map(questions.map((item) => [item.id, item.answer]));
  let current = started.payload.question;
  let completed;
  for (let index = 0; index < 6; index += 1) {
    assert.ok(current?.id, `grade ${grade} diagnostic question ${index + 1}`);
    const answered = await request(actor, "/api/diagnostic", {
      method: "POST",
      expected: [200],
      json: {
        action: "answer",
        assessmentId: started.payload.assessmentId,
        questionId: current.id,
        answer: answers.get(current.id),
      },
    });
    assert.equal(answered.payload.feedback.correct, true);
    completed = answered.payload;
    current = answered.payload.question;
  }
  assert.equal(completed.complete, true);
  assert.ok(completed.summary.readiness >= 70);
}

async function completeGame(actor, mode, project) {
  const started = await request(actor, "/api/games/run", {
    method: "POST",
    json: { action: "start", mode, project },
  });
  const stored = await database(() => prisma.gameRun.findUniqueOrThrow({ where: { id: started.payload.runId } }));
  const questions = stored.questions;
  assert.equal(started.payload.questions.length, questions.length);
  let result;
  for (let index = 0; index < questions.length; index += 1) {
    result = await request(actor, "/api/games/run", {
      method: "POST",
      json: {
        action: "answer",
        runId: stored.id,
        questionIndex: index,
        selectedIndex: questions[index].correctIndex,
      },
    });
    assert.equal(result.payload.correct, true);
    if (mode === "BUILD") {assert.ok(result.payload.material);}
  }
  assert.equal(result.payload.finished, true);
  assert.ok(result.payload.xpEarned > 0 && result.payload.sparksEarned > 0);
  return result.payload;
}

async function main() {
  await cleanupInterruptedFixtures();

  const mode = await request(null, "/api/system/mode");
  assert.equal(mode.payload.aiFreeTestMode, true);
  assert.equal(mode.payload.paidAiCallsEnabled, false);
  pass("AI-free mode blocks paid AI calls");

  const health = await request(null, "/api/health");
  assert.equal(health.payload.status, "ok");
  await request(null, "/api/ops/status", { expected: [401] });
  pass("public dependency health and protected operations status");

  const unauthorized = await request(null, "/api/profile/learning-context", { expected: [401] });
  assert.equal(unauthorized.payload.error, "Unauthorized");
  await request(null, "/api/stripe/create-checkout-session", {
    method: "POST",
    expected: [401],
    json: { priceKey: "starter", user: { id: randomUUID(), email: "spoofed@example.test" } },
  });
  pass("protected APIs reject anonymous access");

  const student = await createActor("student");
  const classmate = await createActor("classmate");
  const guardian = await createActor("guardian");
  const teacherDomain = `${suffix}.school.test`;
  const teacher = await createActor("teacher", teacherDomain);

  let courseId;
  for (const grade of ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]) {
    courseId = await saveProfile(student, grade, "TEEN", courseId, "UNDER_13");
    await completeDiagnostic(student, grade);
    const hub = await request(student, "/api/games/hub");
    assert.equal(hub.payload.experience.gradeLevel, grade);
    assert.equal(hub.payload.experience.gradeBand, gradeBands[grade]);
    const elementary = ["EARLY", "ELEMENTARY"].includes(gradeBands[grade]);
    assert.equal(hub.payload.experience.companion.elementary, elementary);
    pass(`grade ${grade} profile, six skills, diagnostic, and experience`);
  }

  await request(student, "/api/profile/learning-context", {
    method: "PUT",
    expected: [403],
    headers: { origin: "https://attacker.example", "sec-fetch-site": "cross-site" },
    json: { gradeLevel: "12", ageGroup: "ADULT", courseName: "Blocked", subject: "Blocked" },
  });
  pass("age-protection downgrade and cross-site mutation bypasses are blocked");

  courseId = await saveProfile(student, "K", "TEEN", courseId);
  const companion = await request(student, "/api/games/companion", {
    method: "POST",
    json: { companionId: "luna_otter", readAloud: true, speechRate: 1.8 },
  });
  assert.equal(companion.payload.companion.speechRate, 1.1);
  await request(student, "/api/games/companion", {
    method: "POST",
    expected: [400],
    json: { companionId: "orbit_wolf", readAloud: true, speechRate: 0.9 },
  });
  pass("elementary talking companion selection and safe voice-rate limits");

  const lesson = [
    "Water Cycle Test Lesson",
    "Evaporation happens when liquid water warms and changes into water vapor.",
    "Condensation happens when water vapor cools and forms tiny liquid droplets.",
    "Clouds form when condensed droplets gather in the atmosphere.",
    "Precipitation falls as rain, snow, sleet, or hail.",
    "Collection gathers water in oceans, lakes, rivers, and soil.",
    "The Sun provides energy, and plants release vapor through transpiration.",
  ].join(" ");
  const material = await request(student, "/api/processMaterials", {
    method: "POST",
    formText: lesson,
  });
  assert.ok(material.payload.sessionId && material.payload.sourceMaterialId);
  assert.ok(material.payload.chunkCount >= 1);
  const cards = await request(student, `/api/getFlashcards?sessionId=${material.payload.sessionId}`);
  assert.ok(cards.payload.flashcards.length >= 4);
  pass("pasted material ingestion, source chunks, concepts, and deterministic flashcards");

  const quiz = await request(student, "/api/quiz/start", {
    method: "POST",
    json: { sessionId: material.payload.sessionId },
  });
  assert.ok(quiz.payload.questions.length >= 4);
  const answers = Object.fromEntries(quiz.payload.questions.map((question, index) => [String(index), question.correctAnswer]));
  const savedQuiz = await request(student, "/api/saveQuiz", {
    method: "POST",
    json: { title: "Water Cycle Retrieval Check", source: "E2E", questions: quiz.payload.questions, answers, sourceMaterialId: material.payload.sourceMaterialId },
  });
  const listed = await request(student, "/api/listQuizzes");
  assert.ok(listed.payload.some((item) => item.id === savedQuiz.payload.quizId));
  const fetchedQuiz = await request(student, `/api/getQuizById?id=${savedQuiz.payload.quizId}`);
  assert.equal(fetchedQuiz.payload.score, quiz.payload.questions.length);
  const generatedQuiz = await request(student, "/api/generateQuiz", {
    method: "POST",
    json: { title: "Local Water Cycle Quiz", content: lesson },
  });
  assert.ok(generatedQuiz.payload.questions.length >= 5);
  pass("flashcard quiz, deterministic quiz builder, scoring, saving, listing, and retrieval");

  const study = await request(student, "/api/study/start", { method: "POST", json: {} });
  assert.ok(study.payload.cards.length >= 4);
  const correctReview = await request(student, "/api/study/review", {
    method: "POST",
    json: { sessionId: study.payload.sessionId, cardId: study.payload.cards[0].id, correct: true, rating: 4, responseTimeMs: 1200, hintCount: 0 },
  });
  assert.ok(new Date(correctReview.payload.schedule.nextReviewAt) > new Date());
  await request(student, "/api/study/review", {
    method: "POST",
    json: { sessionId: study.payload.sessionId, cardId: study.payload.cards[1].id, correct: false, rating: 1, responseTimeMs: 4200, hintCount: 1 },
  });
  const xpBeforeStudy = await request(student, "/api/xp");
  const completedStudy = await request(student, "/api/study/complete", {
    method: "POST",
    json: { sessionId: study.payload.sessionId },
  });
  assert.equal(completedStudy.payload.session.correct, 1);
  assert.equal(completedStudy.payload.session.incorrect, 1);
  const xpAfterStudy = await request(student, "/api/xp");
  assert.equal(xpAfterStudy.payload.xp - xpBeforeStudy.payload.xp, completedStudy.payload.xpEarned);
  await request(student, "/api/xp", { method: "POST", expected: [405], json: { amount: 1_000_000 } });
  const [mastery, queue, smart, stats, streak, next] = await Promise.all([
    request(student, "/api/mastery"), request(student, "/api/review-queue"),
    request(student, "/api/study/smart"), request(student, "/api/study/stats"),
    request(student, "/api/streak"), request(student, "/api/learning/next"),
  ]);
  assert.ok(mastery.payload.summary.totalConcepts >= 6);
  assert.ok(queue.payload.dueNow >= 0 && smart.payload.dueCount >= 0);
  assert.ok(stats.payload.totalReviews >= 2 && streak.payload.currentStreak >= 1);
  assert.ok(next.payload.recommendation.mode);
  pass("study session, correct/incorrect evidence, spaced review, mastery, streak, stats, and next-step engine");

  const groundedTutor = await request(student, "/api/tutor", {
    method: "POST",
    json: { sourceMode: "materials", messages: [{ role: "user", content: "What powers evaporation in the water cycle?" }] },
  });
  assert.equal(groundedTutor.payload.attribution.mode, "UPLOADED_MATERIAL");
  assert.ok(groundedTutor.payload.attribution.citations.length >= 1);
  assert.match(groundedTutor.payload.reply, /\[S1\]/);
  const generalTutor = await request(student, "/api/tutor", {
    method: "POST",
    json: { sourceMode: "general", messages: [{ role: "user", content: "Help me make a study plan." }] },
  });
  assert.equal(generalTutor.payload.attribution.mode, "GENERAL_KNOWLEDGE");
  assert.match(generalTutor.payload.reply, /AI-free test mode|paid AI/i);
  pass("source-grounded and general tutor modes with explicit attribution");

  const beforeGames = await request(student, "/api/games/hub");
  const grid = await completeGame(student, "GRID");
  const build = await completeGame(student, "BUILD", "Dream Library");
  const afterGames = await request(student, "/api/games/hub");
  assert.ok(afterGames.payload.player.xp > beforeGames.payload.player.xp);
  assert.ok(afterGames.payload.player.sparks > beforeGames.payload.player.sparks);
  assert.equal(build.score, build.xpEarned > 0 ? cards.payload.flashcards.length : build.score);
  assert.ok(grid.score > 0 && afterGames.payload.recentRuns.length >= 2);
  await database(() => prisma.gameProfile.update({ where: { userId: student.id }, data: { sparks: 500 } }));
  const bought = await request(student, "/api/games/avatar", { method: "POST", json: { action: "buy", itemId: "top_builder" } });
  assert.equal(bought.payload.owned, true);
  const equipped = await request(student, "/api/games/avatar", { method: "POST", json: { action: "equip", itemId: "top_builder" } });
  assert.equal(equipped.payload.equipped, true);
  pass("Knowledge Grid, Build Lab materials, XP, Sparks, leaderboard history, avatar purchase, and equip");

  await saveProfile(classmate, "9", "TEEN");
  const multiplayerBefore = await request(classmate, "/api/games/hub");
  const liveRoom = await request(student, "/api/games/multiplayer", {
    method: "POST",
    expected: [201],
    json: { action: "create" },
  });
  assert.match(liveRoom.payload.room.code, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal(liveRoom.payload.room.isHost, true);
  assert.equal(liveRoom.payload.players.length, 1);
  assert.equal(liveRoom.payload.question, null);
  await request(null, `/api/games/multiplayer?code=${liveRoom.payload.room.code}`, { expected: [401] });
  const joinedRoom = await request(classmate, "/api/games/multiplayer", {
    method: "POST",
    json: { action: "join", code: liveRoom.payload.room.code },
  });
  assert.equal(joinedRoom.payload.players.length, 2);
  assert.equal(new Set(joinedRoom.payload.players.map((player) => player.alias)).size, 2);
  assert.ok(joinedRoom.payload.players.every((player) => !/E2E|@/i.test(player.alias)));

  let liveState = await request(student, "/api/games/multiplayer", {
    method: "POST",
    json: { action: "start", code: liveRoom.payload.room.code },
  });
  assert.equal(liveState.payload.room.phase, "QUESTION");
  assert.equal("correctIndex" in liveState.payload.question, false);
  assert.equal("correctAnswer" in liveState.payload.question, false);
  assert.equal("cardId" in liveState.payload.question, false);

  for (let questionIndex = 0; questionIndex < liveState.payload.room.totalQuestions; questionIndex += 1) {
    const storedRoom = await database(() => prisma.multiplayerRoom.findUniqueOrThrow({
      where: { code: liveRoom.payload.room.code },
    }));
    const storedQuestion = storedRoom.questions[questionIndex];
    const hostAnswer = await request(student, "/api/games/multiplayer", {
      method: "POST",
      json: { action: "answer", code: liveRoom.payload.room.code, selectedIndex: storedQuestion.correctIndex },
    });
    assert.equal(hostAnswer.payload.me.selectedIndex, storedQuestion.correctIndex);
    await request(student, "/api/games/multiplayer", {
      method: "POST",
      expected: [409],
      json: { action: "answer", code: liveRoom.payload.room.code, selectedIndex: storedQuestion.correctIndex },
    });
    await request(classmate, "/api/games/multiplayer", {
      method: "POST",
      json: { action: "answer", code: liveRoom.payload.room.code, selectedIndex: storedQuestion.correctIndex },
    });
    const reveal = await request(student, "/api/games/multiplayer", {
      method: "POST",
      json: { action: "reveal", code: liveRoom.payload.room.code },
    });
    assert.equal(reveal.payload.room.phase, "REVEAL");
    assert.equal(reveal.payload.question.correctIndex, storedQuestion.correctIndex);
    assert.equal(reveal.payload.answeredCount, 2);
    assert.equal(reveal.payload.distribution.reduce((sum, option) => sum + option.count, 0), 2);
    liveState = await request(student, "/api/games/multiplayer", {
      method: "POST",
      json: { action: "next", code: liveRoom.payload.room.code },
    });
  }
  assert.equal(liveState.payload.room.status, "FINISHED");
  assert.equal(liveState.payload.players.length, 2);
  assert.ok(liveState.payload.players.every((player) => player.score > 0));
  const multiplayerAfter = await request(classmate, "/api/games/hub");
  assert.ok(multiplayerAfter.payload.player.xp > multiplayerBefore.payload.player.xp);
  assert.ok(multiplayerAfter.payload.player.sparks > multiplayerBefore.payload.player.sparks);
  await request(student, "/api/games/multiplayer", {
    method: "POST",
    json: { action: "close", code: liveRoom.payload.room.code },
  });
  pass("student-hosted multiplayer create, private code, safe aliases, join, synchronized rounds, scoring, rewards, reveal, results, and close");

  const trustSaved = await request(student, "/api/trust", {
    method: "POST",
    json: {
      action: "update-settings", aiPersonalizationEnabled: true, productAnalyticsEnabled: false,
      shareProgressWithTeachers: true, shareProgressWithGuardians: true, tutorHistoryEnabled: true,
      dataRetentionDays: 30, textScale: "EXTRA_LARGE", reduceMotion: true, highContrast: true, readingFont: true,
    },
  });
  assert.equal(trustSaved.payload.settings.highContrast, true);
  const exported = await request(student, "/api/privacy/export");
  assert.equal(exported.payload.user.id, student.id);
  assert.ok(Array.isArray(exported.payload.masteries));
  assert.ok(exported.payload.multiplayerRoomsHosted.some((room) => room.code === liveRoom.payload.room.code));
  assert.ok(exported.payload.multiplayerParticipations.some((participant) => participant.room.code === liveRoom.payload.room.code));
  pass("privacy, accessibility, retention preferences, and complete data export");

  const qtiExport = await request(student, `/api/integrations/qti?quizId=${savedQuiz.payload.quizId}`);
  assert.ok(Buffer.from(qtiExport.text, "binary").length > 100);

  await establishAdultRole(guardian, "GUARDIAN");
  await saveProfile(guardian, "12", "ADULT");
  await request(guardian, "/api/safety/preferences", { method: "POST", json: { action: "update", emailEnabled: false, smsEnabled: false, hasPhone: false } });
  const familyInvite = await request(guardian, "/api/community", { method: "POST", expected: [201], json: { action: "create-family-invite" } });
  await request(student, "/api/community", { method: "POST", json: { action: "join-family", code: familyInvite.payload.invite.code, relationship: "Parent" } });
  const guardianView = await request(guardian, "/api/community");
  assert.ok(guardianView.payload.students.some((item) => item.student.id === student.id));
  await request(guardian, "/api/trust", { method: "POST", json: { action: "grant-parental-consent", studentId: student.id } });
  pass("guardian role, family invite, learner connection, progress view, and parental consent");

  await establishAdultRole(teacher, "TEACHER");
  await saveProfile(teacher, "12", "ADULT");
  const verification = await request(teacher, "/api/trust", { method: "POST", json: { action: "request-role-verification", organizationName: "E2E School" } });
  assert.equal(verification.payload.verification.status, "PENDING_REVIEW");
  await database(() => prisma.$transaction([
    prisma.roleVerification.update({
      where: { id: verification.payload.verification.id },
      data: {
        status: "DOMAIN_VERIFIED",
        reviewedAt: new Date(),
        reviewNote: "School affiliation and domain ownership approved by the E2E administrator fixture.",
      },
    }),
    prisma.user.update({
      where: { id: teacher.id },
      data: { roleVerificationStatus: "DOMAIN_VERIFIED", verifiedAt: new Date() },
    }),
  ]));
  const district = await request(teacher, "/api/district", { method: "POST", expected: [201], json: { action: "create-organization", name: `E2E District ${suffix}` } });
  createdOrganizationIds.push(district.payload.organization.id);
  await request(teacher, "/api/district", { method: "POST", json: {
    action: "update-policy", organizationId: district.payload.organization.id,
    allowedGradeBands: ["K–2", "3–5", "6–8", "9–12"], aiTutorEnabled: true,
    multimodalEnabled: true, externalKnowledgeEnabled: true, requireGuardianConsent: false,
    dataRetentionDays: 30, safetyAlertChannels: ["IN_APP"], lockedSettings: [],
  } });
  const classroom = await request(teacher, "/api/community", { method: "POST", expected: [201], json: { action: "create-classroom", name: "E2E Learning Lab", subject: "Integrated Skills", gradeBand: "K–2" } });
  await request(student, "/api/community", { method: "POST", json: { action: "join-classroom", code: classroom.payload.classroom.joinCode } });
  const assignment = await request(teacher, "/api/community", { method: "POST", expected: [201], json: { action: "create-assignment", classroomId: classroom.payload.classroom.id, title: "Explain the water cycle", instructions: "Use the uploaded lesson." } });
  await request(student, "/api/community", { method: "POST", json: { action: "complete-assignment", assignmentId: assignment.payload.assignment.id } });
  const teacherView = await request(teacher, "/api/community");
  assert.ok(teacherView.payload.classrooms[0].memberships.some((item) => item.student.id === student.id));
  pass("verified teacher, district policy, classroom join, assignment creation/completion, and progress signals");

  const ltiConfig = await request(null, "/api/integrations/lti/config");
  assert.match(ltiConfig.payload.oidc_initiation_url, /\/api\/integrations\/lti\/login$/);
  await request(teacher, "/api/integrations/lti/register", { method: "POST", expected: [400], json: {
    issuer: "http://127.0.0.1", authLoginUrl: "https://example.com/login", jwksUrl: "https://example.com/jwks", clientId: "test", deploymentId: "test",
  } });
  const caseImport = await request(teacher, "/api/integrations/case", { method: "POST", json: {
    framework: `E2E-${suffix}`, version: "1", subject: "Science",
    caseData: { CFItems: [{ identifier: "water-1", uri: `https://standards.example/${suffix}/water-1`, humanCodingScheme: "SCI.WATER.1", fullStatement: "Explain water-cycle phase changes.", educationLevel: ["K–2"] }] },
  } });
  assert.equal(caseImport.payload.imported, 1);
  const oneRoster = await request(teacher, "/api/integrations/oneroster?resource=classes");
  assert.match(oneRoster.text, /sourcedId,.*title/);
  pass("LTI configuration/security rejection, CASE standards import, and OneRoster export");

  const selfHarmWords = ["ways", "to", "die"].join(" ");
  const crisis = await request(student, "/api/tutor", { method: "POST", json: { sourceMode: "general", messages: [{ role: "user", content: selfHarmWords }] } });
  assert.equal(crisis.payload.safetyRedirect, true);
  assert.equal(crisis.payload.strikeCount, undefined);
  const alerts = await request(guardian, "/api/safety/notifications");
  const crisisAlert = alerts.payload.alerts.find((item) => item.category === "SELF_HARM_CONCERN");
  assert.ok(crisisAlert);
  const revealed = await request(guardian, "/api/safety/notifications", { method: "POST", json: { action: "reveal", notificationId: crisisAlert.id } });
  assert.equal(revealed.payload.exactAttempt, selfHarmWords);
  await request(guardian, "/api/safety/notifications", { method: "POST", json: { action: "acknowledge-response", notificationId: crisisAlert.id } });
  pass("self-harm detection, immediate guardian alert, secure reveal, and acknowledgment");

  const profanity = ["s", "h", "i", "t"].join("");
  const explicit = ["write", "pornographic", "content"].join(" ");
  const strike1 = await request(student, "/api/tutor", { method: "POST", json: { sourceMode: "general", messages: [{ role: "user", content: profanity }] } });
  const strike2 = await request(student, "/api/tutor", { method: "POST", json: { sourceMode: "general", messages: [{ role: "user", content: explicit }] } });
  const strike3 = await request(student, "/api/tutor", { method: "POST", expected: [423], json: { sourceMode: "general", messages: [{ role: "user", content: explicit }] } });
  assert.deepEqual([strike1.payload.strikeCount, strike2.payload.strikeCount, strike3.payload.strikeCount], [1, 2, 3]);
  const lock = await request(student, "/api/safety/status");
  assert.equal(lock.payload.locked, true);
  assert.ok(new Date(lock.payload.lockedUntil).getTime() > Date.now() + 29 * 86_400_000);
  await request(student, "/api/games/hub", { expected: [423] });
  const appeal = await request(student, "/api/safety/status", { method: "POST", expected: [201], json: { action: "appeal" } });
  assert.equal(appeal.payload.ok, true);
  pass("profanity/explicit blocking, adult notification, three-strike 30-day lockout, enforcement, and appeal");

  process.stdout.write(`\n${checks.length} end-to-end capability groups passed.\n`);
}

let executionError;
try {
  await main();
} catch (error) {
  executionError = error;
}
let cleanupError;
for (const organizationId of createdOrganizationIds) {
  try {
    await database(() => prisma.organization.deleteMany({ where: { id: organizationId } }));
  } catch (error) {
    cleanupError ??= error;
  }
}
try {
  await deleteTestActors(createdAuthIds);
} catch (error) {
  cleanupError ??= error;
}
for (const id of createdAuthIds) {
  try {
    await authRequest(() => admin.auth.admin.deleteUser(id));
  } catch (error) {
    if (error?.status !== 404) {cleanupError ??= error;}
  }
}
await prisma.$disconnect();
if (executionError) {throw executionError;}
if (cleanupError) {throw cleanupError;}
