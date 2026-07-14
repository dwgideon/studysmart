import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@supabase/auth-helpers-react";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser();
  const router = useRouter();
  const [checkingLock, setCheckingLock] = useState(true);
  const [redirectingToLock, setRedirectingToLock] = useState(false);

  useEffect(() => {
    if (user === undefined) {return;}
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) {
      setCheckingLock(user === undefined);
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
  }, [router, router.pathname, user]);

  if (user === undefined || checkingLock || redirectingToLock) {
    return (
      <div role="status" style={{ padding: "3rem", textAlign: "center" }}>
        {redirectingToLock ? "Opening safety notice…" : "Loading…"}
      </div>
    );
  }

  if (!user) {return null;}

  return <>{children}</>;
}
