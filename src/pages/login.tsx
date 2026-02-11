import dynamic from "next/dynamic";
import Head from "next/head";
import AppLayout from "../components/layout/AppLayout";
import { supabase } from "../lib/supabaseClient";
import { ThemeSupa } from "@supabase/auth-ui-shared";

const Auth = dynamic(
  () => import("@supabase/auth-ui-react").then((mod) => mod.Auth),
  { ssr: false }
);

export default function LoginPage() {
  return (
    <AppLayout>
      <Head>
        <title>Login | StudySmart</title>
      </Head>

      <section style={{ maxWidth: 420, margin: "4rem auto" }}>
        <h1 style={{ marginBottom: "1rem" }}>Login to StudySmart</h1>

        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["google"]}
          redirectTo={
            typeof window !== "undefined" ? window.location.origin : undefined
          }
        />
      </section>
    </AppLayout>
  );
}

/* prevents static prerender during build */
export async function getServerSideProps() {
  return { props: {} };
}
