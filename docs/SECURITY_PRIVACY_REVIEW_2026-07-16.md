# StudySmart K–12 security and privacy technical review

Review date: 2026-07-16
Scope: application code, database schema/migrations, Vercel configuration names, authentication/authorization paths, safety controls, privacy controls, operational telemetry, dependencies, and release procedures.

## Decision

The application has a strong technical baseline, but this review does **not** authorize a broad public or district launch and is not a legal opinion, certification, penetration test, or accessibility conformance report. The external launch blockers listed below require qualified people or provider/account actions that cannot be truthfully completed in source code.

## Official criteria used

- The FTC’s current COPPA guidance requires a clear privacy notice, verifiable parental consent where applicable, parental review/deletion rights, reasonable confidentiality/security/integrity procedures, data minimization, and purpose-limited retention/deletion. The amended rule also requires a written information-security program and written retention/deletion policy: <https://www.ftc.gov/business-guidance/resources/childrens-online-privacy-protection-rule-six-step-compliance-plan-your-business>
- U.S. Department of Education FERPA guidance requires school-official contractors to operate under school control, use education-record PII only for the authorized purpose, restrict redisclosure, and limit access to legitimate educational interests: <https://studentprivacy.ed.gov/faq/who-school-official-under-ferpa>
- OWASP recommends consistent structured security/application logging, correlation identifiers, authentication and authorization failure signals, error/performance monitoring, log-injection protection, and exclusion of credentials, session values, and sensitive personal data: <https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html>

## Findings closed in this review

| Severity | Finding | Resolution |
|---|---|---|
| Critical | Checkout trusted a browser-supplied user ID and email. | Checkout now requires the server-verified Supabase user, reads the account from PostgreSQL, and writes only that authenticated ID to Stripe metadata. |
| High | The learning-profile endpoint could relax an existing child age group and bypass the stricter Trust workflow. | Grade and existing child status now enforce the most protective applicable age group. Relaxation requires the reviewed correction process. |
| High | Any confirmed non-public email domain was automatically treated as a verified teacher. | Email domain alone now results in pending review. Automatic domain verification is limited to a separately activated organization with that verified domain. |
| High | State-changing cookie-authenticated APIs had no explicit cross-site request check. | Browser cross-site mutations are rejected; signed/non-browser clients remain supported and must still pass their own authentication. |
| High | AI rate limiting used a read-then-update sequence vulnerable to concurrency races. | The limit is now one atomic PostgreSQL upsert/update condition shared across server instances. |
| High | Scheduled jobs had no configured Vercel cron secret and no staleness/error record. | Dedicated cron authentication is a required environment gate; each job now records status/duration and sends privacy-safe failure signals. |
| Medium | Operational errors were unstructured and could include arbitrary provider messages. | Critical APIs now emit a consistent redacted JSON schema with request ID, route name, status, and duration—never request bodies or direct learner identifiers. |
| Medium | No dependency-aware health/readiness endpoints existed. | Public minimal health and authenticated detailed operations status endpoints were added. |
| Medium | Public privacy/security/accessibility/subprocessor disclosures were missing. | Versioned disclosures and `/.well-known/security.txt` were added. |
| Medium | Vercel Stripe price variable names did not match the application. | Checkout accepts the existing names and the canonical `STRIPE_PRICE_ID_*` names. |

## Verification evidence

- All 33 deterministic unit/security tests passed.
- The production build compiled all 28 pages, including the new public policy and health routes.
- Dead-code, export-use, and dependency-use checks passed with no cleanup findings.
- The live AI-free suite passed 29 end-to-end capability groups: every grade K–12, diagnostics, source ingestion, tutor attribution, quizzes, study scheduling/mastery, games/rewards/avatars, guardians/consent, verified educators, district/classroom controls, interoperability, privacy export, self-harm escalation, and inappropriate-content lockout/appeal.
- The live suite left zero temporary authentication or database accounts.
- The production database migration was applied successfully; all 18 migrations are current.
- The package advisory scan reported zero known vulnerabilities, and the repository scan found no tracked or untracked secret files/patterns.

This evidence validates the implemented technical controls; it does not replace the independent, legal, provider, accessibility, or restore-drill work below.

## Control assessment

### Data minimization and purpose limitation

Implemented: age group instead of birth date; product analytics off by default; AI trace storage is opt-in and HMAC-based; tutor history can be disabled; content retention is selectable; district retention can only shorten the learner choice; safety-alert exact text is separately encrypted and purged; operational logs redact content and direct identifiers.

Residual: the final production operator must document the purpose and retention period for every field and provider in its data inventory and contracts.

### Authentication and authorization

Implemented: server-side Supabase user verification; owner-scoped learning records; active guardian relationships; active classroom membership; verified-teacher requirement for student safety access; recent sign-in before decrypting exact safety requests; district membership/role checks; LTI issuer/client/deployment/nonce checks; server-authoritative XP and billing identity.

Residual: commission an independent tenant-isolation and authorization penetration test. Add database row-level defense in depth before a large multi-district rollout.

### Child safety and consent

Implemented: age/grade protection, local and provider safety checks, fail-closed moderation, source-as-data instructions, non-punitive self-harm routing, encrypted adult notifications, acknowledgment/escalation, three-strike lockout for qualifying inappropriate requests, appeal, and audited consent actions.

Residual launch blocker: a connected account labeled “guardian” is not by itself evidence of a legally sufficient verifiable-parental-consent method. Counsel must select and approve the consent method and direct notice, and the workflow/provider must be independently tested.

### FERPA/school use

Implemented: relationship-scoped views, educator verification state, district policy, audit events, privacy sharing choices, export, retention, and purpose-specific integrations.

Residual launch blocker: each school/LEA must approve contract language establishing direct control, authorized purposes, legitimate educational interest, redisclosure restrictions, deletion/offboarding, security, breach duties, and provider terms. StudySmart must not market “FERPA certified.”

### Upload and AI security

Implemented: size/type limits, non-executable extraction, source chunking, content moderation, AI output moderation, prompt-injection rules, model configuration failure handling, and citations.

Residual launch blocker: add malware scanning and isolated/sandboxed parsing before broad district uploads; complete multilingual, obfuscated, image, audio, and document red-team testing.

### Security logging and operations

Implemented: request correlation, redacted structured application events, high-risk API timing, operational job records, authenticated detailed health, public minimal health, webhook-ready critical alerts, Vercel observability runbook, dependency audit, and secret-pattern scan.

Residual: subscribe named owners to Vercel alerts and an external uptime monitor; configure a real alert webhook; verify log retention/access; perform an incident tabletop.

## External release blockers

1. Add the production operator’s legal name, postal address, monitored privacy/security/accessibility contacts, and jurisdiction-specific notices to the public policies.
2. Obtain qualified COPPA, FERPA, state student-privacy, mandatory-reporting, retention, and consent review for every launch jurisdiction.
3. Complete and remediate independent application/API/tenant-isolation penetration testing.
4. Complete and remediate an independent WCAG 2.2 AA audit and child-safety red team.
5. Select and validate a legally sufficient verifiable-parental-consent method.
6. Complete provider contracts/configuration review and real sandbox delivery tests.
7. Verify Supabase backup/PITR status and complete a restore-to-new-project drill.
8. Add malware scanning/parser isolation for uploads.

No unchecked item above may be represented as certified, compliant, or complete.
