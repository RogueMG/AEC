import { MotionConfig } from "motion/react";
import { Outlet } from "react-router";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import ScrollManager from "@/components/layout/ScrollManager";

function SiteLayout() {
  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="type-label sr-only z-50 bg-signal px-4 py-3 text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <ScrollManager />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </MotionConfig>
  );
}

export default SiteLayout;
