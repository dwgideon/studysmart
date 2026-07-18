# StudySmart production readiness

Reviewed July 17, 2026. This document separates verified application readiness from external launch obligations that source code cannot complete on the operator's behalf.

## Verified in this release

- All 46 unit and policy tests pass.
- All 30 AI-free end-to-end capability groups pass with temporary fixtures removed automatically.
- Every K–12 grade passes profile persistence, six readiness skills, diagnostic completion, and its intended experience.
- Web production build, TypeScript, ESLint, unused-code, unused-dependency, and high-severity dependency vulnerability checks pass.
- iOS and Android lint, type checks, and production-style JavaScript bundle exports pass.
- The database schema validates, Prisma Client generates, and all 23 migrations are applied.
- The five configured OpenAI models are available to the configured credential without generating billable content.
- Stripe Checkout trusts only server-owned plans, prices, payer identity, and beneficiary relationships.
- Stripe webhook processing is signature-verified, idempotent, authoritative, and connected to monthly AI entitlements.
- Atomic AI credits prevent concurrent overuse; failed and stale reservations release automatically.
- Under-18 paid plans require a connected guardian; learners cannot purchase their own plan.
- Safety, self-harm escalation, exact-attempt reveal, three-strike lockout, appeals, source attribution, privacy export, retention, adult roles, and multiplayer pass end to end.
- Transient database queries and complete interactive transactions retry safely. Account-sync races return a retryable response instead of an unhandled error.
- Production builds fail closed when required secrets, live Stripe, operations alerting, or complete external guardian-alert delivery are absent.
- Internal controlled penetration testing passed 19 authenticated and unauthenticated abuse checks after fixing forwarded-host CSRF origin spoofing and enforcing full-length AES-GCM authentication tags. This is evidence for the release record, not a substitute for the independent penetration test listed below.

## Blocking public launch

1. Replace the Stripe test secret, webhook signing secret, and three test Price IDs with LIVE-mode values. Recreate and verify the LIVE webhook and customer portal.
2. Configure `OPS_ALERT_WEBHOOK_URL` to a private incident destination that will never receive child content.
3. Configure and verify at least one complete external guardian-alert path: Resend email, Twilio SMS, or Web Push. Run a real device/inbox drill for both an ordinary content alert and an urgent self-harm alert.
4. The verified official Supabase session-pooler connection is now synchronized to Vercel Production. Upgrade the current Free project to an appropriate paid production plan and verify backups/PITR with a restore-to-new-project drill.
5. Add the production operator's legal name, address, support/privacy contacts, governing law, consumer cancellation/refund terms, and counsel-approved K–12 consent language to the Privacy Notice and Terms. Complete COPPA, FERPA/school-contract, state student-privacy, and applicable accessibility review.
6. Connect and verify a production custom domain, email domain, DNS security records, and the mobile universal/app links for that final domain.
7. Complete Stripe tax/refund configuration and a test-card matrix before switching payments live.
8. Configure Apple and Google developer credentials, native signing, push credentials, privacy manifests/disclosures, store listings, closed testing, and physical-device acceptance tests.
9. Configure production uptime/error alerting, establish an on-call owner, and rehearse the incident, key-rotation, safety-escalation, backup-restore, and rollback runbooks.
10. Run an independent penetration test and a supervised K–12 usability/accessibility pilot before broad public enrollment.

## Deployment rule

Preview deployments may use test billing and in-app-only safety fixtures for supervised testing. Public Production must remain blocked until all items above that affect payments, guardian notification, privacy, infrastructure, and incident response are complete. Run `npm run check:release` before every release candidate and retain the output with the release record.
