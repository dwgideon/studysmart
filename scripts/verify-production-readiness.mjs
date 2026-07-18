const priceValues = {
  STRIPE_PRICE_ID_STARTER: process.env.STRIPE_PRICE_ID_STARTER ?? process.env.PRICE_STARTER,
  STRIPE_PRICE_ID_PRO: process.env.STRIPE_PRICE_ID_PRO ?? process.env.PRICE_PRO,
  STRIPE_PRICE_ID_UNLIMITED: process.env.STRIPE_PRICE_ID_UNLIMITED ?? process.env.PRICE_UNLIMITED,
};

const required = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "SAFETY_ENCRYPTION_KEY",
  "AI_TRACE_HASH_KEY",
  "OPS_HEALTH_TOKEN",
  "OPS_ALERT_WEBHOOK_URL",
  "OPENAI_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PORTAL_CONFIGURATION_ID",
  "NEXT_PUBLIC_SITE_URL",
];
const missing = required.filter((name) => !process.env[name]?.trim());
const errors = [];
const warnings = [];

for (const [name, value] of Object.entries(priceValues)) {
  if (!value) {missing.push(name);}
  else if (!value.startsWith("price_")) {errors.push(`${name} must contain a Stripe price ID beginning with price_.`);}
}
for (const name of ["CRON_SECRET", "SAFETY_ENCRYPTION_KEY", "AI_TRACE_HASH_KEY", "OPS_HEALTH_TOKEN"]) {
  const value = process.env[name];
  if (value && value.length < 32) {errors.push(`${name} must contain at least 32 characters.`);}
}
if (process.env.AI_FREE_TEST_MODE === "true") {
  errors.push("AI_FREE_TEST_MODE must not be enabled in Production.");
}
if (process.env.STRIPE_PORTAL_CONFIGURATION_ID && !process.env.STRIPE_PORTAL_CONFIGURATION_ID.startsWith("bpc_")) {
  errors.push("STRIPE_PORTAL_CONFIGURATION_ID must contain a Stripe portal configuration ID beginning with bpc_.");
}
try {
  if (process.env.NEXT_PUBLIC_SITE_URL && new URL(process.env.NEXT_PUBLIC_SITE_URL).protocol !== "https:") {
    errors.push("NEXT_PUBLIC_SITE_URL must use HTTPS.");
  }
} catch {
  errors.push("NEXT_PUBLIC_SITE_URL must be a valid absolute URL.");
}
if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
  errors.push("STRIPE_SECRET_KEY is in test mode. Replace all Stripe billing values with LIVE-mode values before a public Production deployment.");
}
const externalSafetyDelivery = Boolean(
  (process.env.RESEND_API_KEY && process.env.SAFETY_FROM_EMAIL) ||
  (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_SAFETY_FROM_NUMBER) ||
  (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
);
if (!externalSafetyDelivery) {
  errors.push("Configure a complete email, SMS, or Web Push provider for urgent guardian safety alerts.");
}

for (const name of required) {
  console.log(`${name}: ${missing.includes(name) ? "MISSING" : "configured"}`);
}
for (const name of Object.keys(priceValues)) {
  console.log(`${name}: ${missing.includes(name) ? "MISSING" : "configured"}`);
}
for (const error of errors) {console.error(`ERROR: ${error}`);}
for (const warning of warnings) {console.warn(`WARNING: ${warning}`);}
if (missing.length || errors.length) {
  console.error(`Production environment has ${missing.length} missing and ${errors.length} invalid setting(s).`);
  process.exit(1);
}
console.log("Required production environment settings are present and structurally valid.");
