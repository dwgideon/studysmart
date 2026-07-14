# Security policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability or include child data, credentials, tokens, or request content in a report. Send a minimal reproduction to the private security contact configured by the deploying organization. Production deployments must publish that contact in their security.txt and incident plan.

## Supported version

Only the currently deployed production version is supported. Critical security updates should be deployed through an expedited, reviewed release process.

## Data handling commitments

- Child data is never used for advertising.
- Product analytics is off by default and learner-linked AI traces require opt-in.
- AI observability stores keyed hashes and operational measurements, not raw prompts or replies.
- Exact blocked requests used for authorized adult alerts are encrypted separately, require recent sign-in to reveal, and are purged on a short schedule.
- Secrets belong only in the deployment secret store. Never commit `.env` files.
- Suspected child-safety incidents follow the deploying organization’s reviewed escalation and mandatory-reporting procedures; the software does not substitute for trained human judgment.

See [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) and [docs/LAUNCH_SECURITY_CHECKLIST.md](docs/LAUNCH_SECURITY_CHECKLIST.md).
