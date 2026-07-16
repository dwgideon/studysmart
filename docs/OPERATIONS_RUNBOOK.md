# StudySmart production operations runbook

Last updated: 2026-07-16

## Required ownership before production

Record a primary and backup person, phone/paging path, and timezone for: incident commander, security, child safety, privacy/data rights, database/backups, deployment/rollback, billing, and school/district support. Do not launch with an unmonitored shared mailbox as the only urgent path.

## Required environment controls

Core secrets: `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `SAFETY_ENCRYPTION_KEY`, `AI_TRACE_HASH_KEY`, and `OPS_HEALTH_TOKEN`. Configure them separately for Development, Preview, and Production and rehearse rotation. `OPS_ALERT_WEBHOOK_URL` must be an HTTPS incident channel that contains no child content.

Run `npm run check:production-env` in an environment containing the production variable names. The script prints names/status only—never values.

## Health and monitoring

- `GET /api/health`: minimal public dependency health. Expected `200 { status: "ok" }`; use an external uptime monitor at least every five minutes.
- `GET /api/ops/status` with `Authorization: Bearer $OPS_HEALTH_TOKEN`: detailed cron staleness, safety-delivery queue, recent evaluation/retention failures, and configuration booleans. Never expose this token in a browser bundle.
- Structured server events use schema `studysmart.operations.v1`. Search by `requestId`, `event`, `route`, `status`, and `durationMs`. Request bodies, prompts, uploads, cookies, tokens, contact data, and child identifiers are forbidden.
- In Vercel, enable Observability alerts for 5xx error anomalies and usage anomalies. Route alerts to the named incident channel. Add saved views for function error rate, p95 duration, external API failures, and the three cron routes.

Initial alert thresholds to approve during the pilot:

| Signal | Warning | Critical |
|---|---:|---:|
| 5xx rate, 5 minutes | 1% | 5% |
| Public health failures | 2 consecutive | 3 consecutive |
| Safety delivery exhausted | any | any self-harm alert |
| Safety delivery pending/failed | older than 10 min | older than 30 min |
| Data retention or AI evaluation | one failed/stale run | two consecutive |
| Auth/database external resets | 5 in 10 min | sustained 15 min |
| Critical learning API p95 | 2.5 s | 5 s |

## Scheduled jobs

Vercel sends `Authorization: Bearer $CRON_SECRET`. A missing or incorrect secret must fail closed.

- Safety delivery: immediately attempted when created; scheduled job backfills/retries and creates reminders.
- Data retention: daily enforcement and safety-detail purge.
- AI evaluation: daily local safety regression and privacy-safe aggregate metrics.

Each job writes `OperationalRun`. An absent/stale job makes `/api/ops/status` degraded. The current daily safety schedule is acceptable only for backfill; before relying on 10/30-minute reminder SLAs, use a scheduler/plan that invokes the job at least every five minutes.

## Incident response

1. Acknowledge the alert, assign incident commander, open a private timeline, and preserve only necessary evidence.
2. Classify severity: SEV-1 child danger/cross-tenant exposure/credential compromise; SEV-2 material outage or missing safety delivery; SEV-3 limited degradation; SEV-4 minor issue.
3. Contain: disable affected feature/provider, rotate exposed secrets, revoke sessions, or roll back. Do not disable safety/privacy/appeal access during learner lockouts.
4. Assess child-safety and legal notification duties with trained owners/counsel. The software does not decide mandatory reporting.
5. Recover using a verified deployment and dependency health checks.
6. Notify affected schools/families only through the approved incident process.
7. Complete a blameless post-incident review with root cause, detection gap, corrective owner, and due date.

Tabletop before launch: account takeover, cross-tenant student exposure, harmful AI output, missing guardian alert, payment/provider outage, database loss, secret leak, and suspected child endangerment.

## Database backup and restore

Supabase states that Pro/Team/Enterprise projects receive daily backups and that PITR is a separate finer-grained option. Database backups do not include deleted Storage objects. Verify the actual project plan and dashboard state; source code cannot prove it.

Production minimum:

1. Confirm an encrypted backup exists and record its timestamp daily.
2. Keep an encrypted off-site logical backup if the plan does not provide adequate history.
3. Inventory Storage objects separately; database metadata alone is not an object backup.
4. Quarterly, restore to a new isolated Supabase project—never over production for a drill.
5. Run migrations/status, row counts, authenticated smoke tests, relationship isolation tests, and deletion/retention checks against the restored project.
6. Destroy the drill project and record evidence, duration, RPO, RTO, and findings.

Target for pilot approval: RPO ≤24 hours with daily backups or the approved PITR window; RTO ≤4 hours. A restore has not been proven until a dated drill succeeds.

Official reference: <https://supabase.com/docs/guides/platform/backups>

## Deployment and rollback

Before promotion:

```sh
npm run check:release
npx prisma migrate status
node scripts/smoke-deployment.mjs https://PREVIEW_DEPLOYMENT
```

Release migrations must be backward-compatible with the previous application deployment. A Vercel rollback does not roll back PostgreSQL.

When production is broken:

```sh
vercel logs --environment production --status-code 5xx --since 30m
vercel rollback
vercel rollback status
node scripts/smoke-deployment.mjs https://PRODUCTION_DOMAIN
vercel logs --environment production --status-code 5xx --since 5m
```

After rollback, Vercel stops automatic production-domain assignment until a deployment is promoted. Restore normal flow only after the fix passes preview checks:

```sh
vercel promote GOOD_DEPLOYMENT_URL
vercel promote status
```

Official reference: <https://vercel.com/docs/deployments/rollback-production-deployment>

## Data-rights and deletion operations

Review requester identity and guardian authority before exporting, correcting, restricting, or deleting child data. Record request, verifier, scope, decision, and completion date. Verify deletion in active data, search/log systems, provider systems, replicas, and the documented backup expiry lifecycle. Do not promise immediate erasure from immutable backups when the actual process is expiration/non-restoration.

## Monthly evidence review

- Vercel alerts subscribed and delivered.
- Uptime and authenticated ops checks healthy.
- No exhausted safety deliveries; failures investigated.
- Cron jobs current; retention and AI evaluation passed.
- Dependency/secret scans clean.
- Backup is recent; quarterly restore drill current.
- Access to Vercel, Supabase, Stripe, providers, and logs reviewed.
- Security, privacy, accessibility, and subprocessor notices still accurate.
