CREATE TABLE IF NOT EXISTS public.usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" text NOT NULL,
  month text NOT NULL,
  "tokensUsed" integer NOT NULL DEFAULT 0,
  CONSTRAINT userId_month UNIQUE ("userId", month)
);
