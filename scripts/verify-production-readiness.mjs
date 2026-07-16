const required = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "SAFETY_ENCRYPTION_KEY",
  "AI_TRACE_HASH_KEY",
  "OPS_HEALTH_TOKEN",
];
if (process.env.AI_FREE_TEST_MODE !== "true") {required.push("OPENAI_API_KEY");}
const missing = required.filter((name) => !process.env[name]?.trim());
const warnings = [];
if (!process.env.OPS_ALERT_WEBHOOK_URL) {warnings.push("OPS_ALERT_WEBHOOK_URL is not configured.");}
if (!process.env.RESEND_API_KEY && !process.env.TWILIO_ACCOUNT_SID && !process.env.VAPID_PRIVATE_KEY) {
  warnings.push("No external urgent-alert delivery provider is configured.");
}
for (const name of required) {
  console.log(`${name}: ${missing.includes(name) ? "MISSING" : "configured"}`);
}
for (const warning of warnings) {console.warn(`WARNING: ${warning}`);}
if (missing.length) {
  console.error(`Production environment is missing ${missing.length} required setting(s).`);
  process.exit(1);
}
console.log("Required production environment settings are present.");
