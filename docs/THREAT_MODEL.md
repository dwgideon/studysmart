# StudySmart K–12 threat model

Last reviewed: 2026-07-16

## Protected assets

Learner identity and education records, uploaded materials, tutor history, mastery evidence, guardian contact details, encrypted safety-alert content, authentication sessions, district policy, integration keys, and service credentials.

## Trust boundaries

1. The learner or adult browser communicates with Next.js over TLS.
2. Supabase verifies the authentication session; API routes re-fetch the authenticated user.
3. Server routes access PostgreSQL through Prisma and call configured AI, email, SMS, push, billing, and LMS providers.
4. Guardian, teacher, and district views cross an authorization boundary and therefore require relationship, verification, and role checks.
5. Uploaded sources and LTI claims are untrusted input even when they originate from a school system.

## Priority threats and controls

| Threat | Primary controls | Residual launch work |
|---|---|---|
| Child impersonates an adult | Age-protection downgrade rule, recent sign-in for adult-role escalation, relationship checks, verified educator workflow, audited role changes | Independent abuse-case test and stronger age-assurance decision with counsel |
| Unauthorized safety-detail access | Per-recipient authorization, active learner relationship, recent sign-in, AES-GCM encryption, no-store responses, reveal audit, scheduled detail purge | External authorization and cryptography review |
| Prompt injection or unsafe content | Local K–12 rules, provider moderation, source-as-data system instruction, output moderation, red-team cron | Expand multilingual and obfuscated-input suites continuously |
| Uploaded-file attack | File-size/type allowlist, structured extractors, no executable rendering, source chunking | Malware scanning and parser sandbox in production architecture |
| LMS token forgery or replay | Remote JWKS verification, issuer/client/deployment checks, one-time state and nonce hashes, expiry, private-network URL rejection | 1EdTech conformance testing and key-rotation drill |
| Cross-tenant district access | Membership-scoped queries, owner/admin policy changes, verified-domain creation, audit events | Database row-level defense in depth and external tenant-isolation test |
| Data retained too long | Learner/district retention ceiling, daily enforcement record, safety-detail purge, cascade deletion | Monitor cron success and test restore/deletion behavior in backups |
| Telemetry leaks learner content | Analytics opt-in, keyed hashes only, no raw AI content in trace table, structured operational-event redaction | Rotate hash key and verify downstream provider/log configuration |
| XSS/CSRF/session theft | React escaping, SameSite auth cookies, explicit trusted-origin mutation checks, CSP, frame denial, security headers, server-side user verification | Replace inline CSP allowances with nonces and complete penetration test |
| Checkout account spoofing | Server-authenticated billing identity, database-owned Stripe customer ID, server-controlled pricing/metadata | Stripe sandbox abuse testing and webhook replay/load testing |
| Silent operational failure | Correlation IDs, dependency health, authenticated operational status, persistent cron runs, redacted error events, webhook-ready alerts | Configure real alert destinations, external uptime checks, and incident tabletop |

## Abuse invariants

- A self-harm concern creates protective guardian escalation and never a disciplinary strike.
- A third qualifying inappropriate learner request produces a 30-day learning pause, but safety, privacy, support, and appeal paths remain available.
- District policy may make controls stricter; it cannot lengthen a learner’s chosen content-retention period.
- No product experiment runs for a learner unless optional product analytics is enabled.
- No raw prompt or response is written to AI observability tables.
