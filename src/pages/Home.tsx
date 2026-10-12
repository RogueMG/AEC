import { MotionConfig } from "motion/react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import About from "@/sections/home/About";
import Brands from "@/sections/home/Brands";
import Catalogue from "@/sections/home/Catalogue";
import Contact from "@/sections/home/Contact";
import Hero from "@/sections/home/Hero";
import Industries from "@/sections/home/Industries";
import ProductCategories from "@/sections/home/ProductCategories";

function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="type-label sr-only z-50 bg-signal px-4 py-3 text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <ProductCategories />
        <About />
        <Industries />
        <Brands />
        <Catalogue />
        <Contact />
      </main>
      <Footer />
    </MotionConfig>
  );
}

export default Home;
