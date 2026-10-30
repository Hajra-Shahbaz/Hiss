"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Loader2 } from "lucide-react";
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

  // Tab is derived from URL. Defaults to wishes if none.
  const tab = keyToTab(searchParams.get("tab"));

  // Restore session from localStorage on mount
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
    // Clear URL state on logout so next login starts fresh
    router.replace("/admin");
  }, [router]);

  // Navigate by writing the tab to the URL
  const handleSelectTab = useCallback(
    (next: Tab) => {
      const key = tabToKey(next);
      router.replace(`/admin?tab=${encodeURIComponent(key)}`, {
        scroll: false,
      });
    },
    [router],
  );

  // Load counts when logged in
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
        <div className="flex min-h-dvh items-center justify-center bg-pink-50">
          <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
        </div>
      ) : !token ? (
        <LoginScreen onLoggedIn={handleLogin} />
      ) : (
        <div className="flex h-dvh overflow-hidden bg-pink-50">
          {/* Sidebar — hidden on small screens, shown on lg+ */}
          <div className="hidden w-64 shrink-0 lg:block">
            <Sidebar
              categories={CATEGORIES}
              counts={counts}
              activeTab={tab}
              onSelect={handleSelectTab}
              onLogout={handleLogout}
            />
          </div>

          {/* Mobile nav strip */}
          <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 border-b border-pink-100 bg-white px-3 py-2 lg:hidden">
            <select
              value={tabToKey(tab)}
              onChange={(e) => {
                const key = e.target.value;
                handleSelectTab(keyToTab(key));
              }}
              className="flex-1 rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
            >
              <optgroup label="Content">
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={`category:${c.slug}`}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Tools">
                <option value="video">Main Video</option>
                <option value="email">Send Email</option>
              </optgroup>
            </select>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-xs font-medium text-rose-600"
            >
              Log out
            </button>
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
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