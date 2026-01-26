import dynamic from "next/dynamic";
import Head from "next/head";
import Layout from "../components/Layout";
import { supabase } from "@/lib/supabaseClient";
import { ThemeSupa } from "@supabase/auth-ui-shared";

// ✅ Only Auth is dynamically imported (client-side only)
const Auth = dynamic(
  () => import("@supabase/auth-ui-react").then((mod) => mod.Auth),
  { ssr: false }
);

export default function LoginPage() {
  return (
    <Layout>
      <Head>
        <title>Login | StudySmart</title>
      </Head>

      <div style={{ maxWidth: 420, margin: "4rem auto" }}>
        <h1 style={{ marginBottom: "1rem" }}>Login to StudySmart</h1>

        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["google"]}
          redirectTo={
            typeof window !== "undefined" ? window.location.origin : undefined
          }
        />
      </div>
    </Layout>
  );
}
