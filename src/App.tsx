import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { Loading } from "./components/content/ContentState";
import SiteLayout from "./components/layout/SiteLayout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Product pages load on demand so the home page bundle stays small.
const ProductsIndex = lazy(() => import("./pages/ProductsIndex"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));

const pageFallback = (
  <div className="pt-(--spacing-header)">
    <Loading className="h-[30rem]" label="Loading page" />
  </div>
);

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={pageFallback}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<ProductsIndex />} />
            <Route path="products/:categorySlug" element={<CategoryPage />} />
            <Route path="products/:categorySlug/:productSlug" element={<ProductPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
