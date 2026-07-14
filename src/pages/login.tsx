import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "../lib/supabaseClient";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import styles from "./Login.module.css";

const Auth = dynamic(
  () => import("@supabase/auth-ui-react").then((mod) => mod.Auth),
  { ssr: false }
);

export default function LoginPage() {
  const user = useUser();
  const router = useRouter();

  const next =
    typeof router.query.next === "string"
      ? router.query.next
      : "/dashboard";

  useEffect(() => {
    if (user) {
      router.replace(next);
    }
  }, [user, router, next]);

  return (
    <>
      <Head>
        <title>Login | StudySmart</title>
      </Head>

      <div className={styles.page}><section className={styles.card}>
        <span className={styles.eyebrow}>Secure learner access</span>
        <h1>Enter your workspace</h1>
        <p className={styles.intro}>Your learning memory, mastery map, and next best step are ready.</p>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#168bff",
                  brandAccent: "#2563eb",
                  inputBackground: "#030d1f",
                  inputBorder: "rgba(125,211,252,.2)",
                  inputText: "#ffffff",
                  inputLabelText: "#ffffff",
                  inputPlaceholder: "#cccccc",
                  messageText: "#ffffff",
                  anchorTextColor: "#cccccc",
                },
              },
            },
          }}
          providers={["google"]}
          redirectTo={
            typeof window !== "undefined"
              ? window.location.origin
              : undefined
          }
          localization={{
            variables: {
              sign_up: {
                confirmation_text:
                  "Account created! Check your email and click the confirmation link before signing in.",
              },
            },
          }}
        />
      </section></div>
    </>
  );
}

/* prevents static prerender during build */
export async function getServerSideProps() {
  return {
    props: {},
  };
}
