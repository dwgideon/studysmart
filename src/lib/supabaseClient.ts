import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

// Use the Pages Router cookie adapter so browser sessions are available to
// createPagesServerClient in protected API routes. A localStorage-only client
// makes the UI appear signed in while every server request returns 401.
export const supabase = createPagesBrowserClient();
