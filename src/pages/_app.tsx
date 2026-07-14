import type { AppProps } from "next/app";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";
import AppLayout from "../components/layout/AppLayout";
import { K12ExperienceProvider } from "@/components/K12Experience";
import "../styles/globals.css";

export default function MyApp({
  Component,
  pageProps,
}: AppProps<{ initialSession: null }>) {
  return (
    <SessionContextProvider
      supabaseClient={supabase}
      initialSession={pageProps.initialSession}
    >
      <K12ExperienceProvider>
        <AppLayout>
          <Component {...pageProps} />
        </AppLayout>
      </K12ExperienceProvider>
    </SessionContextProvider>
  );
}
