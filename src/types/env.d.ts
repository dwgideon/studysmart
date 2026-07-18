// src/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

    // Optional Stripe/env if you already added them:
    NEXT_PUBLIC_SITE_URL?: string;
    NEXT_PUBLIC_APP_URL?: string;
    APP_URL?: string;
    DATABASE_URL?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_PRICE_ID_STARTER?: string;
    STRIPE_PRICE_ID_PRO?: string;
    STRIPE_PRICE_ID_UNLIMITED?: string;
    PRICE_STARTER?: string;
    PRICE_PRO?: string;
    PRICE_UNLIMITED?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    STRIPE_PORTAL_CONFIGURATION_ID?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    SAFETY_ENCRYPTION_KEY?: string;
    AI_TRACE_HASH_KEY?: string;
    CRON_SECRET?: string;
    OPS_HEALTH_TOKEN?: string;
    OPS_ALERT_WEBHOOK_URL?: string;
    EXPO_ACCESS_TOKEN?: string;
    APPLE_APP_TEAM_ID?: string;
    ANDROID_APP_SHA256_CERT_FINGERPRINT?: string;
    MOBILE_APP_BUNDLE_ID?: string;
    MOBILE_ANDROID_PACKAGE?: string;
    SECURITY_CONTACT_EMAIL?: string;
    SUPABASE_ACCESS_TOKEN?: string;
    SUPABASE_PROJECT_REF?: string;
    SAFETY_DETAIL_RETENTION_DAYS?: string;
    SAFETY_FIRST_REMINDER_MINUTES?: string;
    SAFETY_SECOND_REMINDER_MINUTES?: string;
    RESEND_API_KEY?: string;
    SAFETY_FROM_EMAIL?: string;
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
    TWILIO_SAFETY_FROM_NUMBER?: string;
    NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string;
    VAPID_PRIVATE_KEY?: string;
    VAPID_SUBJECT?: string;

    // OpenAI/Groq (server-side, do NOT prefix with NEXT_PUBLIC)
    OPENAI_API_KEY?: string;
    OPENAI_EMBEDDING_MODEL?: string;
    OPENAI_MULTIMODAL_MODEL?: string;
    OPENAI_TRANSCRIPTION_MODEL?: string;
    AI_FREE_TEST_MODE?: string;
    GROQ_API_KEY?: string;
  }
}
