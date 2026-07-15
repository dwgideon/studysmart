import { useEffect } from "react";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import layout from "@/styles/layout.module.css";
import TestModeBanner from "@/components/TestModeBanner";

type Props = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: Props) {
  const router = useRouter();
  useEffect(() => {
    const focusMain = () => {
      window.requestAnimationFrame(() => {
        document.getElementById("main-content")?.focus({ preventScroll: true });
      });
    };
    router.events.on("routeChangeComplete", focusMain);
    return () => {router.events.off("routeChangeComplete", focusMain);};
  }, [router.events]);
  return (
    <div className={layout.appShell}>
      <div className={layout.ambient} aria-hidden="true" />
      <a className={layout.skipLink} href="#main-content">
        Skip to main content
      </a>
      <Header />
      <TestModeBanner />
      <main id="main-content" className={layout.mainContent} tabIndex={-1} aria-label="Main content">
        {children}
      </main>
    </div>
  );
}
