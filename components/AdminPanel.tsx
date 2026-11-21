"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Edit3,
  Loader2,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
  Video as VideoIcon,
  X,
} from "lucide-react";

// ─────────────────────────────────────────────
// Token persistence
// ─────────────────────────────────────────────

const TOKEN_KEY = "umer_admin_token";

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore quota / privacy errors */
  }
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ContentSlug =
  | "wishes"
  | "congratulations"
  | "memories"
  | "moments"
  | "promises"
  | "sorry"
  | "thankyou";

interface ContentDoc {
  _id: string;
  order: number;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  emoji?: string;
  description?: string;
  media?: string;
  mediaType?: "image" | "video";
  heading?: string;
  note?: string;
  notes?: string;
  detail?: string;
  publicId?: string;
}

interface VideoDoc {
  _id?: string;
  media: string;
  description: string;
  publicId?: string;
}

interface CategoryDef {
  slug: ContentSlug;
  label: string;
  fields: FieldDef[];
}

type FieldKind = "text" | "textarea" | "emoji" | "media";

interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  placeholder?: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    slug: "wishes",
    label: "Wishes",
    fields: [
      { name: "emoji", label: "Emoji", kind: "emoji", required: true, placeholder: "💙" },
      { name: "description", label: "Description", kind: "textarea", required: true },
    ],
  },
  {
    slug: "congratulations",
    label: "Congratulations",
    fields: [
      { name: "media", label: "Media", kind: "media", required: true },
      { name: "heading", label: "Heading", kind: "text", required: true },
      { name: "description", label: "Description", kind: "textarea", required: true },
    ],
  },
  {
    slug: "memories",
    label: "Memories",
    fields: [
      { name: "media", label: "Media", kind: "media", required: true },
      { name: "description", label: "Description", kind: "textarea", required: true },
    ],
  },
  {
    slug: "moments",
    label: "Moments",
    fields: [
      { name: "media", label: "Media", kind: "media", required: true },
      { name: "heading", label: "Heading", kind: "text", required: true },
      { name: "note", label: "Note", kind: "textarea", required: true },
    ],
  },
  {
    slug: "promises",
    label: "Promises",
    fields: [
      { name: "emoji", label: "Emoji", kind: "emoji", required: true },
      { name: "heading", label: "Heading", kind: "text", required: true },
      { name: "detail", label: "Detail", kind: "textarea", required: true },
    ],
  },
  {
    slug: "sorry",
    label: "Sorry",
    fields: [{ name: "note", label: "Note", kind: "textarea", required: true }],
  },
  {
    slug: "thankyou",
    label: "Thank You",
    fields: [
      { name: "emoji", label: "Emoji", kind: "emoji", required: true },
      { name: "notes", label: "Notes", kind: "textarea", required: true },
    ],
  },
];

// ─────────────────────────────────────────────
// 🩵 Shared soft-blue theme styles
// ─────────────────────────────────────────────

const BLUE = {
  card:
    "rounded-3xl border border-sky-100/80 bg-white/80 backdrop-blur-sm shadow-[0_8px_30px_-12px_rgba(56,189,248,0.25)] shadow-sky-200/50",
  cardHover:
    "transition-all duration-300 hover:shadow-[0_12px_40px_-12px_rgba(56,189,248,0.35)] hover:-translate-y-0.5",
  primaryBtn:
    "inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-sky-200/60 transition-all duration-200 hover:shadow-lg hover:shadow-sky-300/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none",
  secondaryBtn:
    "inline-flex items-center justify-center gap-1.5 rounded-full border border-sky-200 bg-white/90 px-4 py-2 text-xs font-semibold text-sky-600 shadow-sm shadow-sky-100/60 transition-all duration-200 hover:bg-sky-50 hover:border-sky-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50",
  input:
    "w-full rounded-2xl border border-sky-200 bg-sky-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-sky-300 transition-all duration-200 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-200/60",
  label: "mb-1.5 block text-xs font-semibold text-sky-700 tracking-wide",
};

// ─────────────────────────────────────────────
// Top-level component
// ─────────────────────────────────────────────

export default function AdminPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);

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
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative min-h-dvh w-full overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
        {/* soft ambient blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute top-1/3 -right-32 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
          {restoring ? (
            <div className="mt-24 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
            </div>
          ) : !token ? (
            <LoginScreen onLoggedIn={handleLogin} />
          ) : (
            <Dashboard token={token} onLogout={handleLogout} />
          )}
        </div>
      </main>
    </MotionConfig>
  );
}

// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────

function LoginScreen({ onLoggedIn }: { onLoggedIn: (token: string) => void }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setError(json?.error ?? "Login failed.");
        return;
      }
      onLoggedIn(json.data.token as string);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-20 max-w-sm">
      <div className={`${BLUE.card} relative overflow-hidden p-8`}>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 via-blue-300 to-indigo-300 shadow-lg shadow-sky-200/60">
          <span className="text-2xl">🫧</span>
        </div>
        <h1 className="text-center text-2xl font-bold tracking-tight text-sky-700">
          Hi, lovely admin
        </h1>
        <p className="mt-1.5 text-center text-sm text-sky-500">
          Pop in your secret PIN ✨
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <input
            type="password"
            autoComplete="off"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="• • • •"
            className={`${BLUE.input} text-center text-lg tracking-[0.5em]`}
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !pin}
            className={`${BLUE.primaryBtn} w-full py-2.5 text-sm`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>💙</span>}
            {busy ? "Opening…" : "Let me in"}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-center text-sm font-medium text-rose-500">
            {error}
          </p>
        )}
      </div>
      <p className="mt-6 text-center text-xs text-sky-400">
        Made with 💙 for the birthday magic
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────

type Tab =
  | { kind: "category"; slug: ContentSlug }
  | { kind: "video" }
  | { kind: "email" };

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>({ kind: "category", slug: "wishes" });
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [countsError, setCountsError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadCounts = useCallback(async () => {
    setCountsError(null);
    try {
      const results = await Promise.all(
        CATEGORIES.map(async (c) => {
          const res = await fetch(`/api/content?type=${c.slug}&admin=1`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json();
          return [c.slug, Array.isArray(json?.data) ? json.data.length : 0] as const;
        }),
      );
      setCounts(Object.fromEntries(results));
    } catch {
      setCountsError("Couldn't load counts.");
    }
  }, [token]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts, refreshKey]);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="bg-gradient-to-r from-sky-600 to-indigo-500 bg-clip-text text-2xl font-bold text-transparent">
            Admin Dashboard
          </h1>
          <p className="mt-0.5 text-xs text-sky-500">
            💫 Manage the birthday experience
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className={BLUE.secondaryBtn}
            title="Refresh counts"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button onClick={onLogout} className={BLUE.secondaryBtn}>
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </div>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const active = tab.kind === "category" && tab.slug === c.slug;
          const count = counts?.[c.slug];
          return (
            <button
              key={c.slug}
              onClick={() => setTab({ kind: "category", slug: c.slug })}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                active
                  ? "border-sky-400 bg-gradient-to-r from-sky-400 to-blue-400 text-white shadow-md shadow-sky-200/60 -translate-y-0.5"
                  : "border-sky-200 bg-white/80 text-sky-600 hover:bg-sky-50 hover:-translate-y-0.5"
              }`}
            >
              {c.label}
              {typeof count === "number" && (
                <span
                  className={`rounded-full px-1.5 text-[10px] ${
                    active ? "bg-white/25" : "bg-sky-100 text-sky-700"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={() => setTab({ kind: "video" })}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
            tab.kind === "video"
              ? "border-sky-400 bg-gradient-to-r from-sky-400 to-blue-400 text-white shadow-md shadow-sky-200/60 -translate-y-0.5"
              : "border-sky-200 bg-white/80 text-sky-600 hover:bg-sky-50 hover:-translate-y-0.5"
          }`}
        >
          <VideoIcon className="h-3.5 w-3.5" />
          Video
        </button>
        <button
          onClick={() => setTab({ kind: "email" })}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
            tab.kind === "email"
              ? "border-sky-400 bg-gradient-to-r from-sky-400 to-blue-400 text-white shadow-md shadow-sky-200/60 -translate-y-0.5"
              : "border-sky-200 bg-white/80 text-sky-600 hover:bg-sky-50 hover:-translate-y-0.5"
          }`}
        >
          <Mail className="h-3.5 w-3.5" />
          Email
        </button>
      </nav>

      {countsError && (
        <p className="mb-4 text-sm text-rose-500">{countsError}</p>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={tab.kind === "category" ? tab.slug : tab.kind}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
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
  );
}

// ─────────────────────────────────────────────
// Generic content tab
// ─────────────────────────────────────────────

function ContentTab({
  token,
  category,
  onChanged,
}: {
  token: string;
  category: CategoryDef;
  onChanged: () => void;
}) {
  const [items, setItems] = useState<ContentDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ContentDoc | "new" | null>(null);
  const [toDeleteHard, setToDeleteHard] = useState<ContentDoc | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/content?type=${category.slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setError(json?.error ?? "Failed to load.");
        setItems([]);
        return;
      }
      setItems(json.data as ContentDoc[]);
    } catch {
      setError("Network error.");
      setItems([]);
    }
  }, [category.slug, token]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    if (!items) return [];
    return showDeleted
      ? items.filter((i) => i.isDeleted)
      : items.filter((i) => !i.isDeleted);
  }, [items, showDeleted]);

  const activeItems = useMemo(
    () => (items ?? []).filter((i) => !i.isDeleted),
    [items],
  );

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  async function softDelete(doc: ContentDoc) {
    if (!confirm("Soft delete this item?")) return;
    setBusyId(doc._id);
    try {
      const res = await fetch(
        `/api/content?type=${category.slug}&id=${doc._id}&mode=soft`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? "Failed");
      await load();
      onChanged();
      flash("Soft deleted.");
    } catch (e) {
      flash((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function restore(doc: ContentDoc) {
    setBusyId(doc._id);
    try {
      const res = await fetch(
        `/api/content?type=${category.slug}&id=${doc._id}&action=restore`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? "Failed");
      await load();
      onChanged();
      flash("Restored.");
    } catch (e) {
      flash((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function hardDelete(doc: ContentDoc) {
    setBusyId(doc._id);
    try {
      const res = await fetch(
        `/api/content?type=${category.slug}&id=${doc._id}&mode=hard`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? "Failed");
      setToDeleteHard(null);
      await load();
      onChanged();
      flash("Permanently deleted.");
    } catch (e) {
      flash((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function move(doc: ContentDoc, dir: -1 | 1) {
    if (!items) return;
    const list = [...activeItems];
    const idx = list.findIndex((i) => i._id === doc._id);
    if (idx < 0) return;
    const swap = idx + dir;
    if (swap < 0 || swap >= list.length) return;

    const reordered = [...list];
    [reordered[idx], reordered[swap]] = [reordered[swap], reordered[idx]];

    setBusyId(doc._id);
    try {
      const res = await fetch(
        `/api/content?type=${category.slug}&action=reorder`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: reordered.map((i) => i._id) }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error ?? "Failed");
      await load();
    } catch (e) {
      flash((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-xs text-sky-600">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            className="h-3.5 w-3.5 accent-sky-500"
          />
          Show deleted
        </label>
        <button onClick={() => setEditing("new")} className={BLUE.primaryBtn}>
          <Plus className="h-3.5 w-3.5" />
          Add {category.label}
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}

      {items === null ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-3xl bg-sky-100" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className={`${BLUE.card} flex h-32 flex-col items-center justify-center gap-1 text-sm text-sky-500`}>
          <span className="text-2xl">🫧</span>
          <span>Nothing here yet — add your first one!</span>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((doc, i) => (
            <div
              key={doc._id}
              className={`${BLUE.card} ${BLUE.cardHover} flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between ${
                doc.isDeleted ? "opacity-70" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <PreviewLine category={category} doc={doc} />
                <p className="mt-1 text-[11px] text-sky-400">
                  order {doc.order} · id {doc._id.slice(-6)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {!doc.isDeleted && (
                  <>
                    <IconBtn
                      title="Move up"
                      disabled={i === 0 || busyId === doc._id}
                      onClick={() => move(doc, -1)}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      title="Move down"
                      disabled={i === visible.length - 1 || busyId === doc._id}
                      onClick={() => move(doc, 1)}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      title="Edit"
                      disabled={busyId === doc._id}
                      onClick={() => setEditing(doc)}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      title="Soft delete"
                      disabled={busyId === doc._id}
                      onClick={() => softDelete(doc)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </>
                )}
                {doc.isDeleted && (
                  <>
                    <IconBtn
                      title="Restore"
                      disabled={busyId === doc._id}
                      onClick={() => restore(doc)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      title="Delete permanently"
                      disabled={busyId === doc._id}
                      onClick={() => setToDeleteHard(doc)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <ContentForm
          token={token}
          category={category}
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
            onChanged();
            flash(editing === "new" ? "Created." : "Updated.");
          }}
        />
      )}

      {toDeleteHard && (
        <ConfirmDialog
          title="Delete permanently?"
          message="This removes the record and its Cloudinary asset. It cannot be undone."
          confirmLabel="Delete forever"
          danger
          busy={busyId === toDeleteHard._id}
          onCancel={() => setToDeleteHard(null)}
          onConfirm={() => hardDelete(toDeleteHard)}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-600 transition-all duration-200 hover:bg-sky-50 hover:border-sky-300 hover:-translate-y-0.5 active:scale-90 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function PreviewLine({ category, doc }: { category: CategoryDef; doc: ContentDoc }) {
  if (category.slug === "wishes") {
    return (
      <p className="truncate text-sm text-slate-700">
        <span className="mr-1">{doc.emoji}</span>
        {doc.description}
      </p>
    );
  }
  if (category.slug === "sorry") {
    return <p className="truncate text-sm text-slate-700">{doc.note}</p>;
  }
  if (category.slug === "thankyou") {
    return (
      <p className="truncate text-sm text-slate-700">
        <span className="mr-1">{doc.emoji}</span>
        {doc.notes}
      </p>
    );
  }
  if (category.slug === "promises") {
    return (
      <p className="truncate text-sm text-slate-700">
        <span className="mr-1">{doc.emoji}</span>
        <span className="font-medium">{doc.heading}</span> — {doc.detail}
      </p>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {doc.media && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={doc.media}
          alt=""
          className="h-10 w-14 rounded-md border border-sky-100 object-cover"
        />
      )}
      <p className="truncate text-sm text-slate-700">
        <span className="font-medium">
          {doc.heading ?? (doc.mediaType === "video" ? "Video" : "Image")}
        </span>
        {doc.description || doc.note
          ? ` — ${doc.description ?? doc.note}`
          : ""}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Content form (add/edit)
// ─────────────────────────────────────────────

function ContentForm({
  token,
  category,
  initial,
  onClose,
  onSaved,
}: {
  token: string;
  category: CategoryDef;
  initial: ContentDoc | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = initial === null;
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const f of category.fields) {
      const raw = initial
        ? (initial as unknown as Record<string, unknown>)[f.name]
        : "";
      v[f.name] = typeof raw === "string" ? raw : "";
    }
    return v;
  });
  const [mediaType, setMediaType] = useState<"image" | "video">(
    (initial?.mediaType as "image" | "video") ?? "image",
  );
  const [publicId, setPublicId] = useState<string>(initial?.publicId ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const hasMediaField = category.fields.some((f) => f.kind === "media");

  function setField(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setError(json?.error ?? "Upload failed");
        return;
      }
      setField("media", json.data.url as string);
      setMediaType(json.data.mediaType as "image" | "video");
      setPublicId((json.data.publicId as string) ?? "");
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {};
    for (const f of category.fields) {
      const v = values[f.name]?.trim() ?? "";
      if (f.required && !v) {
        setError(`${f.label} is required.`);
        setSaving(false);
        return;
      }
      if (v) payload[f.name] = v;
    }
    if (hasMediaField) {
      payload.mediaType = mediaType;
      if (publicId) payload.publicId = publicId;
    }

    try {
      const url = isNew
        ? `/api/content?type=${category.slug}`
        : `/api/content?type=${category.slug}&id=${initial!._id}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setError(json?.error ?? "Save failed");
        return;
      }
      onSaved();
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <h2 className="text-lg font-bold text-sky-700">
          {isNew ? `Add ${category.label}` : `Edit ${category.label}`}
        </h2>

        {category.fields.map((f) => (
          <div key={f.name}>
            <label className={BLUE.label}>
              {f.label}
              {f.required && <span className="text-rose-500"> *</span>}
            </label>

            {f.kind === "media" ? (
              <div className="space-y-2">
                {values.media ? (
                  <div className="relative overflow-hidden rounded-xl border border-sky-200">
                    {mediaType === "video" ? (
                      <video
                        src={values.media}
                        controls
                        className="h-40 w-full bg-slate-900 object-contain"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={values.media}
                        alt=""
                        className="h-40 w-full bg-sky-50 object-contain"
                      />
                    )}
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className={BLUE.secondaryBtn}
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {values.media ? "Replace media" : "Upload media"}
                  </button>
                  {values.media && (
                    <button
                      type="button"
                      onClick={() => {
                        setField("media", "");
                        setPublicId("");
                      }}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={values.media}
                  onChange={(e) => setField("media", e.target.value)}
                  placeholder="…or paste a URL"
                  className={`${BLUE.input} text-xs`}
                />
              </div>
            ) : f.kind === "textarea" ? (
              <textarea
                value={values[f.name]}
                onChange={(e) => setField(f.name, e.target.value)}
                placeholder={f.placeholder}
                rows={3}
                className={`${BLUE.input} resize-none`}
              />
            ) : (
              <input
                type="text"
                value={values[f.name]}
                onChange={(e) => setField(f.name, e.target.value)}
                placeholder={f.placeholder}
                className={BLUE.input}
              />
            )}
          </div>
        ))}

        {error && <p className="text-sm text-rose-500">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={BLUE.secondaryBtn}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className={BLUE.primaryBtn}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isNew ? "Create" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Video tab
// ─────────────────────────────────────────────

function VideoTab({ token }: { token: string }) {
  const [doc, setDoc] = useState<VideoDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/video")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setDoc(j?.data ?? { media: "", description: "" });
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load video");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !doc) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setError(json?.error ?? "Upload failed");
        return;
      }
      setDoc({
        ...doc,
        media: json.data.url as string,
        publicId: json.data.publicId as string,
      });
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!doc || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(doc),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setError(json?.error ?? "Save failed");
        return;
      }
      setToast("Saved.");
      window.setTimeout(() => setToast(null), 2000);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !doc) {
    return <div className="h-40 animate-pulse rounded-3xl bg-sky-100" />;
  }

  return (
    <form onSubmit={save} className={`${BLUE.card} space-y-4 p-5`}>
      <h2 className="text-lg font-bold text-sky-700">Main Video</h2>
      <p className="text-xs text-sky-500">
        This is the video shown right after the balloons.
      </p>

      {doc.media && (
        <video
          src={doc.media}
          controls
          className="aspect-video w-full rounded-xl bg-slate-900"
        />
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={BLUE.secondaryBtn}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {doc.media ? "Replace video" : "Upload video"}
        </button>
      </div>

      <div>
        <label className={BLUE.label}>Description</label>
        <textarea
          value={doc.description}
          onChange={(e) => setDoc({ ...doc, description: e.target.value })}
          rows={3}
          className={`${BLUE.input} resize-none`}
          placeholder="A short note shown below the video"
        />
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || uploading}
          className={BLUE.primaryBtn}
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save
        </button>
      </div>

      <Toast message={toast} />
    </form>
  );
}

// ─────────────────────────────────────────────
// Email tab
// ─────────────────────────────────────────────

function EmailTab({ token }: { token: string }) {
  const [form, setForm] = useState({
    to: "",
    recipientName: "",
    subject: "",
    heading: "",
    message: "",
    imageUrl: "",
    buttonText: "",
    buttonUrl: "",
    closing: "",
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const payload = {
        to: form.to.trim(),
        recipientName: form.recipientName.trim(),
        subject: form.subject.trim(),
        heading: form.heading.trim(),
        message: form.message.trim(),
        imageUrl: form.imageUrl.trim() || undefined,
        buttonText: form.buttonText.trim() || undefined,
        buttonUrl: form.buttonUrl.trim() || undefined,
        closing: form.closing.trim() || undefined,
      };
      const res = await fetch("/api/email", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setError(json?.error ?? "Send failed");
        return;
      }
      setToast("Email sent.");
      window.setTimeout(() => setToast(null), 2500);
    } catch {
      setError("Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className={`${BLUE.card} space-y-4 p-5`}>
      <h2 className="text-lg font-bold text-sky-700">Send an Email</h2>
      <p className="text-xs text-sky-500">
        Uses the reusable HTML template in <code>lib/email.ts</code>.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="To" required>
          <input
            type="email"
            value={form.to}
            onChange={(e) => set("to", e.target.value)}
            placeholder="someone@example.com"
            className={BLUE.input}
            required
          />
        </Field>
        <Field label="Recipient name" required>
          <input
            type="text"
            value={form.recipientName}
            onChange={(e) => set("recipientName", e.target.value)}
            placeholder="Their name"
            className={BLUE.input}
            required
          />
        </Field>
        <Field label="Subject" required>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => set("subject", e.target.value)}
            className={BLUE.input}
            required
          />
        </Field>
        <Field label="Heading" required>
          <input
            type="text"
            value={form.heading}
            onChange={(e) => set("heading", e.target.value)}
            className={BLUE.input}
            required
          />
        </Field>
      </div>

      <Field label="Message" required>
        <textarea
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          rows={5}
          className={`${BLUE.input} resize-none`}
          required
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Image URL (optional)">
          <input
            type="url"
            value={form.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
            placeholder="https://…"
            className={BLUE.input}
          />
        </Field>
        <Field label="Button text (optional)">
          <input
            type="text"
            value={form.buttonText}
            onChange={(e) => set("buttonText", e.target.value)}
            className={BLUE.input}
          />
        </Field>
        <Field label="Button URL (optional)">
          <input
            type="url"
            value={form.buttonUrl}
            onChange={(e) => set("buttonUrl", e.target.value)}
            className={BLUE.input}
          />
        </Field>
        <Field label="Closing (optional)">
          <input
            type="text"
            value={form.closing}
            onChange={(e) => set("closing", e.target.value)}
            className={BLUE.input}
          />
        </Field>
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={sending} className={BLUE.primaryBtn}>
          {sending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Mail className="h-3.5 w-3.5" />
          )}
          {sending ? "Sending…" : "Send email"}
        </button>
      </div>

      <Toast message={toast} />
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={BLUE.label}>
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal, ConfirmDialog, Toast
// ─────────────────────────────────────────────

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-sky-950/30 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.22, type: "spring", stiffness: 260, damping: 22 }}
          className={`${BLUE.card} my-8 w-full max-w-md p-5`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="float-right -mr-1 -mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-sky-400 transition hover:bg-sky-100 hover:text-sky-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal onClose={onCancel}>
      <h2 className="text-lg font-bold text-sky-700">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className={BLUE.secondaryBtn}>
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
            danger
              ? "bg-gradient-to-r from-rose-400 to-rose-500 shadow-md shadow-rose-200/60 hover:shadow-lg hover:shadow-rose-300/60"
              : "bg-gradient-to-r from-sky-400 to-blue-400 shadow-md shadow-sky-200/60 hover:shadow-lg hover:shadow-sky-300/60"
          } disabled:opacity-50`}
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-300/50"
        >
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-white" />
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}