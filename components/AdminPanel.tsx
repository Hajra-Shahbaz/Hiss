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
// Shared pink theme styles
// ─────────────────────────────────────────────

const PINK = {
  card: "rounded-2xl border border-pink-100 bg-white shadow-sm shadow-pink-100/60",
  primaryBtn:
    "inline-flex items-center justify-center gap-1.5 rounded-full bg-pink-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-pink-600 disabled:opacity-50",
  secondaryBtn:
    "inline-flex items-center justify-center gap-1.5 rounded-full border border-pink-200 bg-white px-4 py-2 text-xs font-medium text-pink-600 transition hover:bg-pink-50 disabled:opacity-50",
  input:
    "w-full rounded-xl border border-pink-200 bg-pink-50/40 px-3 py-2 text-sm text-slate-800 placeholder:text-pink-300 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200",
  label: "mb-1 block text-xs font-medium text-pink-700",
};

// ─────────────────────────────────────────────
// Top-level component
// ─────────────────────────────────────────────

export default function AdminPanel() {
  const [token, setToken] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);

  // Restore session on mount so refresh keeps you logged in.
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
      <main className="min-h-dvh w-full bg-pink-50">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
          {restoring ? (
            <div className="mt-24 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
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
    <div className="mx-auto mt-24 max-w-sm">
      <div className={`${PINK.card} p-8`}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pink-100">
          <ChevronRight className="h-6 w-6 text-pink-500" />
        </div>
        <h1 className="text-center text-xl font-semibold text-pink-700">Admin</h1>
        <p className="mt-1 text-center text-sm text-pink-500">
          Enter the admin PIN to continue.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="password"
            autoComplete="off"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="• • • •"
            className={`${PINK.input} text-center tracking-[0.4em]`}
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !pin}
            className={`${PINK.primaryBtn} w-full`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-center text-sm text-rose-500">{error}</p>
        )}
      </div>
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
          <h1 className="text-xl font-semibold text-pink-700">Admin Dashboard</h1>
          <p className="text-xs text-pink-500">Manage the birthday experience</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className={PINK.secondaryBtn}
            title="Refresh counts"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button onClick={onLogout} className={PINK.secondaryBtn}>
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
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-pink-500 bg-pink-500 text-white"
                  : "border-pink-200 bg-white text-pink-600 hover:bg-pink-50"
              }`}
            >
              {c.label}
              {typeof count === "number" && (
                <span
                  className={`rounded-full px-1.5 text-[10px] ${
                    active ? "bg-white/25" : "bg-pink-100 text-pink-700"
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
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            tab.kind === "video"
              ? "border-pink-500 bg-pink-500 text-white"
              : "border-pink-200 bg-white text-pink-600 hover:bg-pink-50"
          }`}
        >
          <VideoIcon className="h-3.5 w-3.5" />
          Video
        </button>
        <button
          onClick={() => setTab({ kind: "email" })}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            tab.kind === "email"
              ? "border-pink-500 bg-pink-500 text-white"
              : "border-pink-200 bg-white text-pink-600 hover:bg-pink-50"
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
        <label className="inline-flex items-center gap-2 text-xs text-pink-600">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            className="h-3.5 w-3.5 accent-pink-500"
          />
          Show deleted
        </label>
        <button onClick={() => setEditing("new")} className={PINK.primaryBtn}>
          <Plus className="h-3.5 w-3.5" />
          Add {category.label}
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}

      {items === null ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-pink-100" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className={`${PINK.card} flex h-32 items-center justify-center text-sm text-pink-500`}>
          Nothing here yet.
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((doc, i) => (
            <div
              key={doc._id}
              className={`${PINK.card} flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between ${
                doc.isDeleted ? "opacity-70" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <PreviewLine category={category} doc={doc} />
                <p className="mt-1 text-[11px] text-pink-400">
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
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-pink-200 bg-white text-pink-600 transition hover:bg-pink-50 disabled:opacity-40"
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
          className="h-10 w-14 rounded-md border border-pink-100 object-cover"
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
        <h2 className="text-lg font-semibold text-pink-700">
          {isNew ? `Add ${category.label}` : `Edit ${category.label}`}
        </h2>

        {category.fields.map((f) => (
          <div key={f.name}>
            <label className={PINK.label}>
              {f.label}
              {f.required && <span className="text-rose-500"> *</span>}
            </label>

            {f.kind === "media" ? (
              <div className="space-y-2">
                {values.media ? (
                  <div className="relative overflow-hidden rounded-xl border border-pink-200">
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
                        className="h-40 w-full bg-pink-50 object-contain"
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
                    className={PINK.secondaryBtn}
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
                  className={`${PINK.input} text-xs`}
                />
              </div>
            ) : f.kind === "textarea" ? (
              <textarea
                value={values[f.name]}
                onChange={(e) => setField(f.name, e.target.value)}
                placeholder={f.placeholder}
                rows={3}
                className={`${PINK.input} resize-none`}
              />
            ) : (
              <input
                type="text"
                value={values[f.name]}
                onChange={(e) => setField(f.name, e.target.value)}
                placeholder={f.placeholder}
                className={PINK.input}
              />
            )}
          </div>
        ))}

        {error && <p className="text-sm text-rose-500">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={PINK.secondaryBtn}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className={PINK.primaryBtn}
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
    return <div className={`${PINK.card} h-40 animate-pulse bg-pink-100`} />;
  }

  return (
    <form onSubmit={save} className={`${PINK.card} space-y-4 p-5`}>
      <h2 className="text-lg font-semibold text-pink-700">Main Video</h2>
      <p className="text-xs text-pink-500">
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
          className={PINK.secondaryBtn}
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
        <label className={PINK.label}>Description</label>
        <textarea
          value={doc.description}
          onChange={(e) => setDoc({ ...doc, description: e.target.value })}
          rows={3}
          className={`${PINK.input} resize-none`}
          placeholder="A short note shown below the video"
        />
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || uploading}
          className={PINK.primaryBtn}
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
    <form onSubmit={submit} className={`${PINK.card} space-y-4 p-5`}>
      <h2 className="text-lg font-semibold text-pink-700">Send an Email</h2>
      <p className="text-xs text-pink-500">
        Uses the reusable HTML template in <code>lib/email.ts</code>.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="To" required>
          <input
            type="email"
            value={form.to}
            onChange={(e) => set("to", e.target.value)}
            placeholder="someone@example.com"
            className={PINK.input}
            required
          />
        </Field>
        <Field label="Recipient name" required>
          <input
            type="text"
            value={form.recipientName}
            onChange={(e) => set("recipientName", e.target.value)}
            placeholder="Their name"
            className={PINK.input}
            required
          />
        </Field>
        <Field label="Subject" required>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => set("subject", e.target.value)}
            className={PINK.input}
            required
          />
        </Field>
        <Field label="Heading" required>
          <input
            type="text"
            value={form.heading}
            onChange={(e) => set("heading", e.target.value)}
            className={PINK.input}
            required
          />
        </Field>
      </div>

      <Field label="Message" required>
        <textarea
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          rows={5}
          className={`${PINK.input} resize-none`}
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
            className={PINK.input}
          />
        </Field>
        <Field label="Button text (optional)">
          <input
            type="text"
            value={form.buttonText}
            onChange={(e) => set("buttonText", e.target.value)}
            className={PINK.input}
          />
        </Field>
        <Field label="Button URL (optional)">
          <input
            type="url"
            value={form.buttonUrl}
            onChange={(e) => set("buttonUrl", e.target.value)}
            className={PINK.input}
          />
        </Field>
        <Field label="Closing (optional)">
          <input
            type="text"
            value={form.closing}
            onChange={(e) => set("closing", e.target.value)}
            className={PINK.input}
          />
        </Field>
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={sending} className={PINK.primaryBtn}>
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
      <label className={PINK.label}>
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
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-pink-950/30 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className={`${PINK.card} my-8 w-full max-w-md p-5`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="float-right -mr-1 -mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-pink-400 hover:bg-pink-100 hover:text-pink-600"
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
      <h2 className="text-lg font-semibold text-pink-700">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className={PINK.secondaryBtn}>
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-white ${
            danger
              ? "bg-rose-500 hover:bg-rose-600"
              : "bg-pink-500 hover:bg-pink-600"
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-pink-600 px-4 py-2 text-xs text-white shadow-lg shadow-pink-300/50"
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