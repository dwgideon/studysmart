import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser();
  const router = useRouter();
  const [hasRecoveredSession, setHasRecoveredSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [checkingLock, setCheckingLock] = useState(true);
  const [redirectingToLock, setRedirectingToLock] = useState(false);

  useEffect(() => {
    if (user === undefined) {return;}
    if (user) {
      setHasRecoveredSession(false);
      setCheckingSession(false);
      return;
    }
    let active = true;
    setCheckingSession(true);
    void supabase.auth.getSession()
      .then(({ data }) => {
        if (!active) {return;}
        if (data.session?.user) {
          setHasRecoveredSession(true);
          return;
        }
        setHasRecoveredSession(false);
        void router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
      })
      .catch(() => {
        if (active) {
          void router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
        }
      })
      .finally(() => {
        if (active) {setCheckingSession(false);}
      });
    return () => {active = false;};
  }, [user, router]);

  const authenticated = Boolean(user) || hasRecoveredSession;

  useEffect(() => {
    if (!authenticated) {
      setCheckingLock(user === undefined || checkingSession);
      return;
    }
    const controller = new AbortController();
    setCheckingLock(true);
    fetch("/api/safety/status", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((status) => {
        const safeDuringLock = ["/community", "/safety-lock", "/trust"].includes(
          router.pathname
        );
        if (status.locked && !safeDuringLock) {
          setRedirectingToLock(true);
          void router.replace("/safety-lock");
        } else {
          setRedirectingToLock(false);
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {return;}
        console.error("Could not check learning-lock status:", error);
      })
      .finally(() => {
        if (!controller.signal.aborted) {setCheckingLock(false);}
      });
    return () => controller.abort();
  }, [authenticated, checkingSession, router, router.pathname, user]);

  if (user === undefined || checkingSession || checkingLock || redirectingToLock) {
    return (
      <div role="status" style={{ padding: "3rem", textAlign: "center" }}>
        {redirectingToLock ? "Opening safety notice…" : "Loading…"}
      </div>
    );
  }

  if (!authenticated) {return null;}

  return <>{children}</>;
}
