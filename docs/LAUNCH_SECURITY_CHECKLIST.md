# K–12 production launch gates

These are release blockers, not claims of completed certification. Record evidence, owner, date, finding severity, and remediation for every item.

## Independent assurance

- [ ] Independent web, API, tenant-isolation, authentication, and authorization penetration test completed; all critical/high findings closed and retested.
- [ ] Independent WCAG 2.2 AA audit completed with keyboard-only, screen-reader, zoom/reflow, contrast, motion, cognitive, and mobile testing.
- [ ] Child-safety red team completed across grade bands, languages, misspellings, obfuscation, images, audio, documents, grooming, self-harm, and prompt injection.
- [ ] COPPA, FERPA, state student-privacy, mandatory-reporting, record-retention, and parental-consent flows reviewed by qualified counsel for every launch jurisdiction.
- [ ] 1EdTech OneRoster, CASE, QTI, and LTI certification/conformance completed for each interoperability feature marketed as certified.

## Operational readiness

- [ ] Dedicated production encryption, trace-HMAC, cron, VAPID, provider, database, Supabase, Stripe, and OpenAI secrets configured and rotation rehearsed.
- [ ] Email, SMS, push, and in-app urgent alerts tested end-to-end on real provider sandboxes, including retry, escalation, acknowledgement, outage, and invalid-recipient paths.
- [ ] Daily AI evaluation and retention crons monitored with paging on failure, staleness, or failed critical eval cases.
- [ ] Backups encrypted; restore tested; content deletion and safety-detail purge verified in active data, replicas, logs, analytics, and backup lifecycle.
- [ ] Incident-response tabletop completed for account takeover, cross-tenant exposure, harmful AI output, missing guardian alert, provider outage, and suspected child endangerment.
- [ ] Named 24/7 security and child-safety escalation owners, severity definitions, evidence-preservation rules, and law-enforcement/mandatory-reporting procedures approved.
- [ ] Provider data-use, retention, training, subprocessors, regional processing, and breach terms reviewed and configured for K–12 use.

## Application gates

- [ ] `npm run check:all`, migration status, dependency audit, secret scan, and production smoke tests pass on the exact release artifact.
- [ ] CSP inline-script/style allowances replaced with nonces or documented, time-bounded risk acceptance.
- [ ] Malware scanning and isolated parsing added for uploaded files before broad district rollout.
- [ ] Rate limits moved to a production-grade atomic/distributed store and load-tested.
- [ ] District policy, adult-role verification, guardian relationship, recent-sign-in, safety-detail reveal, data export, and deletion authorization covered by integration tests.
- [ ] Privacy notice, child-facing explanations, parental notice, terms, accessibility statement, security contact, and subprocessors page published and versioned.
- [ ] Rollback, feature kill switches, AI-provider fail-closed behavior, and district offboarding/export tested.
