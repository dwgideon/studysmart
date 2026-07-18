# StudySmart

StudySmart is a K–12 learning platform built with the Next.js Pages Router, Supabase authentication, PostgreSQL/Prisma, and OpenAI. It connects learner profiles, diagnostics, concept mastery, tutoring, quizzes, flashcards, and spaced review while adapting language and challenge by grade band.

## Local development

Install dependencies, apply database migrations, and start the app:

```bash
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required environment variables

Configure these server-side values in `.env` and in the production host:

```text
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
SAFETY_ENCRYPTION_KEY=
AI_TRACE_HASH_KEY=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SITE_URL=
OPS_HEALTH_TOKEN=

# Billing and cost controls
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PORTAL_CONFIGURATION_ID=
STRIPE_PRICE_ID_STARTER=
STRIPE_PRICE_ID_PRO=
STRIPE_PRICE_ID_UNLIMITED=

# Durable guardian safety delivery
RESEND_API_KEY=
SAFETY_FROM_EMAIL=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_SAFETY_FROM_NUMBER=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=

# Optional retention override (7–90 days; default 30)
SAFETY_DETAIL_RETENTION_DAYS=30
```

`SAFETY_ENCRYPTION_KEY`, `AI_TRACE_HASH_KEY`, and `CRON_SECRET` should be independent, long, randomly generated production secrets. Back up the encryption key separately and rotate it only through a planned data migration. Local development has compatibility fallbacks, but production should always set the dedicated keys. Email, SMS, and Web Push remain inactive until their provider credentials are configured.

Billing uses guardian-managed Stripe Checkout for learners under 18, signed webhook verification, idempotent subscription records, a customer self-service portal, and atomic monthly AI credits. Stripe variables are required because public paid plans are enabled. The configured values must be Stripe Price IDs beginning with `price_`, not Product IDs beginning with `prod_`.

The launch pricing assumptions, current OpenAI costs, competitor benchmarks, credit weights, and repeatable margin model are documented in [`docs/PRICING_AND_UNIT_ECONOMICS.md`](docs/PRICING_AND_UNIT_ECONOMICS.md). Run `npm run pricing:model` before changing prices.

The verified release status and operator-owned public-launch gates are tracked in [`docs/PRODUCTION_READINESS_2026-07-17.md`](docs/PRODUCTION_READINESS_2026-07-17.md). Vercel Production builds fail closed until live billing, external guardian safety delivery, operations alerting, and the rest of the required production environment are configured.

## Verification

Run the complete production and cleanup checks:

```bash
npm run check:all
```

This runs the safety, learning-model, interoperability, grounding, retention, and experimentation tests; builds the production app; and checks unused files, exports, and dependencies.

For a no-cost live acceptance run with temporary accounts, start the app with `AI_FREE_TEST_MODE=true` and run `npm run test:e2e:free`. The suite covers every K–12 grade, source-grounded learning, games, privacy, safety, adult roles, integrations, and student-hosted multiplayer. Test accounts and fixtures are removed automatically.

## Student-hosted multiplayer

Signed-in students can create a private Live Mastery Arena from their own flashcards, receive a six-character room code, and share a link with up to 30 other signed-in students. The host controls question start, reveal, advancement, and room closure. Scores, bounded XP, and Sparks are verified by the server, while duplicate answers and reward farming are limited.

Rooms use automatic friendly aliases instead of real names and provide no open chat or custom public text. They expire after two hours, reconnect through the same code, appear in privacy exports, and are deleted automatically after the operational retention window. The same create, join, play, share, read-aloud, and results flow is available on the website and native app.

## Native iOS and Android app

The Expo/React Native app lives in [`apps/mobile`](apps/mobile). It uses the same Supabase accounts and StudySmart APIs as the website, with secure native session storage, offline review synchronization, spoken elementary guidance, grounded tutoring, learning games, avatar rewards, camera/file intake, and protected adult safety alerts.

```bash
cd apps/mobile
npm install
cp .env.example .env.local
npm run lint
npm run typecheck
npm run test:bundle
```

The first store release is consumption-only: adult, school, and district plans are managed outside the app, and student Sparks cannot be purchased with money. Run `npm run check:mobile` from the repository root for the fast mobile checks. See [`apps/mobile/README.md`](apps/mobile/README.md) for EAS builds, physical-device testing, notifications, and verified web links.

## K–12 safety controls

All AI input and output passes local rules plus OpenAI moderation. Prohibited learner requests are blocked; qualifying learner-originated attempts create a safety strike. Connected guardians and verified classroom teachers receive an encrypted, access-controlled alert containing the exact attempted request. Provider-backed email, SMS, Web Push, and native mobile push delivery retry durably and privacy-safe previews never include the request. The encrypted detail is automatically purged after the configured short retention window while the non-content safety event remains. The third strike pauses learning tools for 30 days, while the Trust Center, Community, privacy export, and appeal path remain available.

Help-seeking disclosures, self-harm concerns, abuse disclosures, personal-information mistakes, and legitimate age-appropriate health or biology education are handled through protective guidance and do not create disciplinary strikes. Learner searches that indicate self-harm intent or seek ways to die create an urgent, guardian-only in-app alert with the exact request encrypted at rest; they never increase the learner's strike count or trigger a lockout.

Safety alerts attempt delivery immediately when the event is created. The Vercel Hobby cron runs once daily as a fallback for failed deliveries and unacknowledged-alert processing; production deployments requiring 10- and 30-minute reminder escalation must use a Pro-grade scheduler or an equivalent external worker.

## Production launch gates

The application includes technical controls and automated checks, but it does not self-certify legal or standards compliance. Before serving children in production, complete every gate in [docs/LAUNCH_SECURITY_CHECKLIST.md](docs/LAUNCH_SECURITY_CHECKLIST.md), including an independent penetration test, WCAG 2.2 audit, privacy/legal review, incident-response exercise, and any required 1EdTech certification.
