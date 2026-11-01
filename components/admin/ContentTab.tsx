"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Eye,
  Image as ImageIcon,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Trash2,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CategoryDef, ContentDoc } from "./types";
import { ConfirmDialog, Field, SkeletonList, Toast, UI } from "./ui";
import ContentForm from "./ContentForm";

// ─────────────────────────────────────────────
// Map a content doc → the email payload shape
// that /api/email expects (see EmailTab.tsx).
// ─────────────────────────────────────────────

function docToEmailFields(
  category: CategoryDef,
  doc: ContentDoc,
): {
  recipientName: string;
  subject: string;
  heading: string;
  message: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  closing?: string;
} {
  const base = {
    recipientName: "",
    subject: category.label,
    heading: doc.heading ?? category.label,
    message: "",
    imageUrl: doc.media && doc.mediaType === "image" ? doc.media : undefined,
    buttonText: undefined as string | undefined,
    buttonUrl: undefined as string | undefined,
    closing: undefined as string | undefined,
  };

  switch (category.slug) {
    case "wishes":
      return {
        ...base,
        heading: `${doc.emoji ?? ""} ${category.label}`.trim(),
        message: doc.description ?? "",
      };
    case "congratulations":
    case "memories":
    case "moments":
      return {
        ...base,
        message: doc.description ?? doc.note ?? "",
      };
    case "promises":
      return {
        ...base,
        heading: `${doc.emoji ?? ""} ${doc.heading ?? category.label}`.trim(),
        message: doc.detail ?? "",
      };
    case "sorry":
      return {
        ...base,
        heading: `Sorry — ${category.label}`,
        message: doc.note ?? "",
      };
    case "thankyou":
      return {
        ...base,
        heading: `${doc.emoji ?? ""} Thank you`,
        message: doc.notes ?? "",
      };
    default:
      return {
        ...base,
        message: doc.description ?? doc.note ?? "",
      };
  }
}

export default function ContentTab({
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

  // Email preview state
  const [previewDoc, setPreviewDoc] = useState<ContentDoc | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

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

  async function softDelete(doc: ContentDoc) {
    if (!confirm("Move this item to trash?")) return;
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
      flash("Moved to trash.");
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
      flash("Deleted permanently.");
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-800">{category.label}</h1>
          <p className="mt-1 text-sm text-slate-500">{category.description}</p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className={`${UI.primaryBtn} shrink-0 self-start`}
        >
          <Plus className="h-4 w-4" />
          Add {category.label}
        </button>
      </div>

      {/* Toolbar */}
      <div
        className={`${UI.card} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}
      >
        <div className="flex items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="h-4 w-4 rounded accent-pink-500"
            />
            Show trash
          </label>
          <span className={UI.badge}>{activeItems.length} active</span>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-pink-600 hover:underline"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reload
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}

      {/* List */}
      {items === null ? (
        <SkeletonList />
      ) : visible.length === 0 ? (
        <div
          className={`${UI.card} flex h-48 flex-col items-center justify-center gap-2 text-center`}
        >
          <p className="text-sm font-medium text-slate-600">
            {showDeleted
              ? "Trash is empty."
              : `No ${category.label.toLowerCase()} yet.`}
          </p>
          {!showDeleted && (
            <button
              onClick={() => setEditing("new")}
              className="text-sm font-medium text-pink-600 hover:underline"
            >
              Create the first one →
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((doc, i) => (
            <li
              key={doc._id}
              className={`${UI.card} overflow-hidden p-4 ${
                doc.isDeleted ? "opacity-70" : ""
              }`}
            >
              <div className="min-w-0">
                <PreviewBlock category={category} doc={doc} />
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-500">
                    order {doc.order}
                  </span>
                  <span className="rounded-full bg-pink-50 px-2 py-0.5 font-medium text-pink-500">
                    id {doc._id.slice(-6)}
                  </span>
                  {doc.isDeleted && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-500">
                      in trash
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5 border-t border-pink-50 pt-3 sm:mt-0 sm:justify-end sm:border-0 sm:pt-0">
                {!doc.isDeleted && (
                  <>
                    <IconBtn
                      title="Preview email"
                      disabled={busyId === doc._id}
                      onClick={() => setPreviewDoc(doc)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </IconBtn>
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
                      title="Move to trash"
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
            </li>
          ))}
        </ul>
      )}

      {editing !== null && (
        <ContentForm
          token={token}
          category={category}
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            const wasNew = editing === "new";
            setEditing(null);
            await load();
            onChanged();
            flash(wasNew ? "Created." : "Updated.");
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

      {/* Email preview modal */}
      <AnimatePresence>
        {previewDoc && (
          <EmailPreviewModal
            token={token}
            category={category}
            doc={previewDoc}
            onClose={() => setPreviewDoc(null)}
            onSent={() => flash("Email sent.")}
          />
        )}
      </AnimatePresence>

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
      className={`${UI.iconBtn} flex-1 justify-center sm:flex-none`}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────
// Email Preview Modal
// ─────────────────────────────────────────────

function EmailPreviewModal({
  token,
  category,
  doc,
  onClose,
  onSent,
}: {
  token: string;
  category: CategoryDef;
  doc: ContentDoc;
  onClose: () => void;
  onSent: () => void;
}) {
  // Prefill from the content doc
  const initial = useMemo(() => docToEmailFields(category, doc), [category, doc]);

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState(initial.subject);
  const [heading, setHeading] = useState(initial.heading);
  const [message, setMessage] = useState(initial.message);
  const [recipientName, setRecipientName] = useState(initial.recipientName);
  const [imageUrl, setImageUrl] = useState(initial.imageUrl ?? "");
  const [buttonText, setButtonText] = useState(initial.buttonText ?? "");
  const [buttonUrl, setButtonUrl] = useState(initial.buttonUrl ?? "");
  const [closing, setClosing] = useState(initial.closing ?? "");

  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const buildPayload = useCallback(
    () => ({
      to: to.trim() || "preview@example.com",
      recipientName: recipientName.trim() || "Friend",
      subject: subject.trim() || category.label,
      heading: heading.trim() || category.label,
      message: message.trim(),
      imageUrl: imageUrl.trim() || undefined,
      buttonText: buttonText.trim() || undefined,
      buttonUrl: buttonUrl.trim() || undefined,
      closing: closing.trim() || undefined,
    }),
    [
      to,
      recipientName,
      subject,
      heading,
      message,
      imageUrl,
      buttonText,
      buttonUrl,
      closing,
      category.label,
    ],
  );

  // Fetch rendered preview whenever fields change (debounced-ish)
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/email/preview", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildPayload()),
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.error ?? "Failed to build preview.");
        }
        if (!cancelled) {
          // Supports both `ok({ html })` response shapes:
          //   { success: true, data: { html } }   ← wrapped
          //   { success: true, html }              ← spread
          const html =
            (json as { data?: { html?: string }; html?: string }).data?.html ??
            (json as { html?: string }).html ??
            "";
          setHtml(html);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [token, buildPayload]);

  async function handleSend() {
    setSending(true);
    setSendError(null);
    try {
      const payload = buildPayload();
      if (!payload.to || !payload.recipientName || !payload.message) {
        throw new Error("Please fill recipient, name, and message.");
      }
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
        throw new Error(json?.error ?? "Send failed");
      }
      onSent();
      onClose();
    } catch (e) {
      setSendError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
              <Mail className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">
                Email preview
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {category.label} · id {doc._id.slice(-6)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-pink-50 hover:text-pink-600"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body: two-column on desktop (form + iframe) */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          {/* Editable fields */}
          <div className="w-full shrink-0 space-y-3 overflow-y-auto border-b border-pink-100 bg-white p-4 md:w-80 md:border-b-0 md:border-r">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Fields
            </p>

            <Field label="To">
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="someone@example.com"
                className={UI.input}
              />
            </Field>

            <Field label="Recipient name">
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Their name"
                className={UI.input}
              />
            </Field>

            <Field label="Subject">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={UI.input}
              />
            </Field>

            <Field label="Heading">
              <input
                type="text"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                className={UI.input}
              />
            </Field>

            <Field label="Message">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className={`${UI.input} resize-none`}
              />
            </Field>

            <Field label="Image URL (optional)">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className={UI.input}
              />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Button text">
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className={UI.input}
                />
              </Field>
              <Field label="Button URL">
                <input
                  type="url"
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  className={UI.input}
                />
              </Field>
            </div>

            <Field label="Closing (optional)">
              <input
                type="text"
                value={closing}
                onChange={(e) => setClosing(e.target.value)}
                className={UI.input}
              />
            </Field>
          </div>

          {/* Rendered email */}
          <div className="relative flex-1 overflow-y-auto bg-blue-50/40 p-4">
            {loading && (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-pink-400" />
                <p className="text-xs font-medium">Building preview…</p>
              </div>
            )}

            {!loading && error && (
              <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="text-sm font-medium text-rose-600">
                  Couldn't load preview
                </p>
                <p className="text-xs text-slate-500">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <div className="overflow-hidden rounded-xl border border-pink-100 bg-white">
                <iframe
                  title="Email preview"
                  srcDoc={html}
                  className="h-[62vh] w-full border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-pink-100 bg-white px-4 py-3">
          {sendError ? (
            <p className="text-xs font-medium text-rose-600">{sendError}</p>
          ) : (
            <p className="hidden text-[11px] text-slate-400 sm:block">
              Preview updates as you type.
            </p>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-pink-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-pink-50 active:scale-95"
            >
              Close
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-400 to-blue-400 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-pink-500 hover:to-blue-500 active:scale-95 disabled:opacity-60"
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {sending ? "Sending…" : "Send email"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// PreviewBlock — full text, no truncation
// ─────────────────────────────────────────────

function PreviewBlock({
  category,
  doc,
}: {
  category: CategoryDef;
  doc: ContentDoc;
}) {
  if (category.slug === "wishes") {
    return (
      <div className="flex items-start gap-2.5">
        <span className="text-lg leading-none">{doc.emoji}</span>
        <p className="min-w-0 break-words text-sm leading-relaxed text-slate-700">
          {doc.description}
        </p>
      </div>
    );
  }

  if (category.slug === "sorry") {
    return (
      <p className="break-words text-sm leading-relaxed text-slate-700">
        {doc.note}
      </p>
    );
  }

  if (category.slug === "thankyou") {
    return (
      <div className="flex items-start gap-2.5">
        <span className="text-lg leading-none">{doc.emoji}</span>
        <p className="min-w-0 break-words text-sm leading-relaxed text-slate-700">
          {doc.notes}
        </p>
      </div>
    );
  }

  if (category.slug === "promises") {
    return (
      <div className="flex items-start gap-2.5">
        <span className="text-lg leading-none">{doc.emoji}</span>
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-slate-800">
            {doc.heading}
          </p>
          <p className="mt-0.5 break-words text-xs leading-relaxed text-slate-500">
            {doc.detail}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      {doc.media && (
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-pink-100 bg-pink-50">
          {doc.mediaType === "video" ? (
            <div className="flex h-full w-full items-center justify-center bg-slate-800 text-white">
              <VideoIcon className="h-5 w-5" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.media}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="break-words text-sm font-semibold text-slate-800">
            {doc.heading ?? (doc.mediaType === "video" ? "Video" : "Image")}
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-blue-500">
            {doc.mediaType === "video" ? (
              <VideoIcon className="h-2.5 w-2.5" />
            ) : (
              <ImageIcon className="h-2.5 w-2.5" />
            )}
            {doc.mediaType ?? "image"}
          </span>
        </div>
        {(doc.description || doc.note) && (
          <p className="mt-1 break-words text-xs leading-relaxed text-slate-500">
            {doc.description ?? doc.note}
          </p>
        )}
      </div>
    </div>
  );
}