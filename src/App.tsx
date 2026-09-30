import { Suspense, lazy, useEffect, type ComponentType } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Providers from "@/providers";
import AppNav from "@/components/ui/AppNav";
import AdminLayout from "@/pages/admin/_layout";

/**
 * File-based routing: every file under src/pages becomes a lazily loaded route.
 *   pages/index.tsx            -> /
 *   pages/article/[id].tsx     -> /article/:id
 *   pages/admin/ai/models.tsx  -> /admin/ai/models
 *   pages/admin.tsx            -> /admin   (nested files live in pages/admin/…)
 */
const modules = import.meta.glob<{ default: ComponentType }>("./pages/**/*.tsx");

function toPath(file: string) {
  let p = file.replace("./pages", "").replace(/\.tsx$/, "");
  p = p.replace(/\/index$/, "") || "/";
  return p.replace(/\[([^\]]+)\]/g, ":$1");
}

const routes = Object.entries(modules)
  .filter(([f]) => !f.includes("/_"))
  .map(([file, loader]) => ({ path: toPath(file), admin: file.startsWith("./pages/admin"), Component: lazy(loader) }));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Loading() {
  return <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-4)", fontSize: 13 }}>Loading…</div>;
}

function NotFound() {
  return (
    <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-3)" }}>
      <h1 style={{ fontFamily: "Outfit,sans-serif", fontSize: 48, fontWeight: 900, color: "var(--text)" }}>404</h1>
      <p>That page doesn’t exist.</p>
      <a href="/" className="btn btn-primary btn-sm">Go home</a>
    </div>
  );
}

export default function App() {
  return (
    <Providers>
      <ScrollToTop />
      <AppNav />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<AdminLayout />}>
            {routes.filter((r) => r.admin).map((r) => (
              <Route key={r.path} path={r.path} element={<r.Component />} />
            ))}
          </Route>
          {routes.filter((r) => !r.admin).map((r) => (
            <Route key={r.path} path={r.path} element={<r.Component />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Providers>
  );
}
