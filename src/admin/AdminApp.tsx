import { useCallback, useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router";
import { ExternalLink, LogOut } from "lucide-react";
import { adminApi } from "@/admin/api";
import BrandsScreen from "@/admin/BrandsScreen";
import CatalogueScreen from "@/admin/CatalogueScreen";
import EnquiriesScreen from "@/admin/EnquiriesScreen";
import type { EnquiryCounts } from "@/lib/enquiries/types";
import { publicAsset } from "@/lib/publicAsset";
import { cn } from "@/lib/utils";

// Cloudflare Access ends the session at this address.
const SIGN_OUT = "/cdn-cgi/access/logout";

export default function AdminApp() {
  const [email, setEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    document.title = "Admin | Asiatic Engineering Co.";
    // Keep the admin out of search results.
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.append(robots);
    adminApi
      .me()
      .then((me) => {
        setEmail(me.email);
        // For the badge on the Enquiries tab; the inbox screen keeps it current after that.
        return adminApi.enquiries("new").then((list) => setNewCount(list.counts.new));
      })
      .catch((e: Error) => setAuthError(e.message));
    return () => robots.remove();
  }, []);
  const onCounts = useCallback((counts: EnquiryCounts) => setNewCount(counts.new), []);

  const tab = ({ isActive }: { isActive: boolean }) =>
    cn("type-label relative px-1 py-4", isActive ? "text-surface after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-signal" : "text-ink-muted hover:text-surface");

  return (
    <div className="flex min-h-svh flex-col bg-paper text-ink">
      <header className="sticky top-0 z-20 bg-ink text-surface">
        <div className="flex h-14 items-center gap-4 px-4 sm:gap-6 sm:px-6">
          <a href="/" className="flex shrink-0 items-center gap-2.5" aria-label="View the site">
            <img src={publicAsset("images/logo-mark-white-96.webp")} alt="" width={32} height={32} className="size-8" />
            <span className="type-label hidden sm:inline">AEC admin</span>
          </a>
          <nav aria-label="Admin" className="flex gap-3.5 sm:gap-5">
            <NavLink to="/admin" end className={tab}>
              Catalogue
            </NavLink>
            <NavLink to="/admin/brands" className={tab}>
              Brands
            </NavLink>
            <NavLink to="/admin/enquiries" className={tab} aria-label={newCount ? `Enquiries, ${newCount} new` : undefined}>
              Enquiries
              {newCount > 0 && (
                <span aria-hidden className="ml-1.5 inline-grid min-w-5 place-items-center rounded-full bg-coral px-1.5 text-[0.6875rem] leading-5 font-bold text-ink tabular-nums">
                  {newCount}
                </span>
              )}
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            {email && <span className="type-small hidden text-ink-muted md:inline">{email}</span>}
            <a href="/" target="_blank" rel="noreferrer" className="type-label hidden items-center gap-1.5 text-ink-muted hover:text-surface sm:inline-flex">
              View site <ExternalLink className="size-3.5" aria-hidden />
            </a>
            <a href={SIGN_OUT} className="type-label inline-flex items-center gap-1.5 whitespace-nowrap text-ink-muted hover:text-surface">
              <LogOut className="size-4" aria-hidden /> <span className="max-[359px]:sr-only">Sign out</span>
            </a>
          </div>
        </div>
      </header>

      {authError ? (
        <div className="p-8">
          <p className="type-subhead">You're not signed in to the admin</p>
          <p className="type-body mt-2 text-steel">{authError}</p>
        </div>
      ) : (
        <Routes>
          <Route index element={<CatalogueScreen />} />
          <Route path="brands" element={<BrandsScreen />} />
          <Route path="enquiries" element={<EnquiriesScreen onCounts={onCounts} />} />
        </Routes>
      )}
    </div>
  );
}
