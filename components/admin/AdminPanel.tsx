"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Loader2, Menu, X, Heart } from "lucide-react";
import { readToken, writeToken } from "./auth";
import { CATEGORIES, ContentSlug, Tab } from "./types";
import LoginScreen from "./LoginScreen";
import Sidebar from "./Sidebar";
import ContentTab from "./ContentTab";
import VideoTab from "./VideoTab";
import EmailTab from "./EmailTab";

// ─────────────────────────────────────────────
// Tab ⇄ URL serialization
// ─────────────────────────────────────────────

type TabKey = `category:${ContentSlug}` | "video" | "email";

function tabToKey(tab: Tab): TabKey {
  return tab.kind === "category" ? `category:${tab.slug}` : tab.kind;
}

function keyToTab(key: string | null | undefined): Tab {
  if (!key) return { kind: "category", slug: "wishes" };
  if (key === "video") return { kind: "video" };
  if (key === "email") return { kind: "email" };
  if (key.startsWith("category:")) {
    const slug = key.slice("category:".length) as ContentSlug;
    const valid = CATEGORIES.some((c) => c.slug === slug);
    if (valid) return { kind: "category", slug };
  }
  return { kind: "category", slug: "wishes" };
}

// ─────────────────────────────────────────────
// AdminPanel
// ─────────────────────────────────────────────

export default function AdminPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const tab = keyToTab(searchParams.get("tab"));

  useEffect(() => {
    const saved = readToken();
    if (saved) setToken(saved);
    setRestoring(false);
  }, []);

  const handleLogin = useCallback((t: string) => {
    writeToken(t);
    setToken(t);
  }, []);

  const handleLogout = useCallback(() => {
    writeToken(null);
    setToken(null);
    setMobileOpen(false);
    router.replace("/admin");
  }, [router]);

  const handleSelectTab = useCallback(
    (next: Tab) => {
      const key = tabToKey(next);
      setMobileOpen(false);
      router.replace(`/admin?tab=${encodeURIComponent(key)}`, {
        scroll: false,
      });
    },
    [router],
  );

  const loadCounts = useCallback(async () => {
    if (!token) return;
    try {
      const results = await Promise.all(
        CATEGORIES.map(async (c) => {
          const res = await fetch(`/api/content?type=${c.slug}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json();
          return [
            c.slug,
            Array.isArray(json?.data) ? json.data.length : 0,
          ] as const;
        }),
      );
      setCounts(Object.fromEntries(results));
    } catch {
      /* non-fatal */
    }
  }, [token]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts, refreshKey]);

  return (
    <MotionConfig reducedMotion="user">
      {restoring ? (
        <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-pink-50 via-white to-blue-50">
          <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
        </div>
      ) : !token ? (
        <LoginScreen onLoggedIn={handleLogin} />
      ) : (
        <div className="flex h-dvh overflow-hidden bg-gradient-to-br from-pink-50 via-white to-blue-50">
          {/* Desktop Sidebar */}
          <div className="hidden w-72 shrink-0 lg:block">
            <Sidebar
              categories={CATEGORIES}
              counts={counts}
              activeTab={tab}
              onSelect={handleSelectTab}
              onLogout={handleLogout}
            />
          </div>

          {/* Mobile top bar */}
          <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-pink-100 bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-blue-400 shadow-sm shadow-pink-200">
                <Heart className="h-4 w-4 fill-white text-white" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight text-slate-800">
                  Admin Panel
                </p>
                <p className="text-[10px] font-medium text-pink-500">
                  Birthday experience
                </p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-pink-100 bg-white text-slate-600 active:scale-95"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile drawer */}
          <AnimatePresence>
            {mobileOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] lg:hidden"
                  onClick={() => setMobileOpen(false)}
                />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-xs lg:hidden"
                >
                  <div className="relative h-full">
                    <Sidebar
                      categories={CATEGORIES}
                      counts={counts}
                      activeTab={tab}
                      onSelect={handleSelectTab}
                      onLogout={handleLogout}
                      onClose={() => setMobileOpen(false)}
                    />
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-slate-500 shadow-sm backdrop-blur active:scale-95"
                      aria-label="Close menu"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tabToKey(tab)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.kind === "category" && (
                    <ContentTab
                      token={token}
                      category={CATEGORIES.find((c) => c.slug === tab.slug)!}
                      onChanged={() => setRefreshKey((k) => k + 1)}
                    />
                  )}
                  {tab.kind === "video" && <VideoTab token={token} />}
                  {tab.kind === "email" && <EmailTab token={token} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      )}
    </MotionConfig>
  );
}