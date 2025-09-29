// src/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;

    // Optional Stripe/env if you already added them:
    NEXT_PUBLIC_SITE_URL?: string;

    // OpenAI/Groq (server-side, do NOT prefix with NEXT_PUBLIC)
    OPENAI_API_KEY?: string;
    GROQ_API_KEY?: string;
  }
}

