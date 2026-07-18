# StudySmart internal penetration test

Date: July 18, 2026  
Scope: local production build with disposable Supabase identities, AI-free mode, no disruptive load, and no production learner data.

## Result

The controlled internal penetration suite passed 19 checks. The final run passed after the following fixes were applied:

- Production CSRF origin validation no longer trusts a client-supplied `x-forwarded-host` value.
- Sensitive AES-256-GCM records require a 12-byte IV and full 16-byte authentication tag, with canonical Base64 and bounded ciphertext validation.
- Supabase Edge Function package resolution requires a seven-day minimum release age.

## Coverage

- Public headers, CORS reflection, unsupported methods, anonymous API access, request-ID injection, and secret non-disclosure.
- Cross-site mutation attempts and forwarded-host origin spoofing.
- Profile mass assignment, role/verification/plan/XP tampering, and XSS/SQL-like input handling.
- Cross-account access to flashcards, quizzes, study sessions, reviews, saved quizzes, QTI export, game runs, and privacy export.
- Server-authoritative XP/Sparks and duplicate/foreign game answers.
- Multiplayer participant/host authorization and join rate limiting.
- Stripe webhook signature rejection, billing ownership checks, and client price tampering.
- District/LTI role boundaries, unsafe LTI administration, unsupported uploads, and oversized uploads.
- Safety moderation behavior, including appropriate blocking and alerting of unsafe test content.

## Static and regression evidence

- 46 unit/security tests passed.
- 30 AI-free end-to-end capability groups passed across grades K–12.
- ESLint passed.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities.
- Repository security scan passed for 280 release-candidate files.
- Semgrep scanned 282 files with 0 findings; two JSX parser notices are scanner limitations on literal ampersands and the files compile successfully.
- iOS and Android mobile lint, type checks, and bundle exports passed.
- Prisma reports all 23 migrations applied and current.

## Residual launch requirements

This internal test does not replace an independent third-party penetration test. Public production remains blocked until the production environment has live Stripe configuration, incident alerting, at least one verified external guardian-alert provider, legal/privacy approvals, backups/PITR, domain and mobile-link verification, store credentials, and an operator-led safety/accessibility pilot.
