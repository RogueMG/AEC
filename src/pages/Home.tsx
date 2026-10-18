import About from "@/sections/home/About";
import Brands from "@/sections/home/Brands";
import Catalogue from "@/sections/home/Catalogue";
import Contact from "@/sections/home/Contact";
import Hero from "@/sections/home/Hero";
import Industries from "@/sections/home/Industries";
import ProductCategories from "@/sections/home/ProductCategories";

function Home() {
  return (
    <>
      <Hero />
      <ProductCategories />
      <About />
      <Industries />
      <Brands />
      <Catalogue />
      <Contact />
    </>
  );
}

export default Home;
