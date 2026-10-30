"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Video as VideoIcon,
} from "lucide-react";
import { CategoryDef, ContentDoc } from "./types";
import { ConfirmDialog, SkeletonList, Toast, UI } from "./ui";
import ContentForm from "./ContentForm";

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{category.label}</h1>
          <p className="mt-1 text-sm text-slate-500">{category.description}</p>
        </div>
        <button onClick={() => setEditing("new")} className={UI.primaryBtn}>
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
            {showDeleted ? "Trash is empty." : `No ${category.label.toLowerCase()} yet.`}
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
        <ul className="space-y-2.5">
          {visible.map((doc, i) => (
            <li
              key={doc._id}
              className={`${UI.card} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                doc.isDeleted ? "opacity-70" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <PreviewLine category={category} doc={doc} />
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span>order {doc.order}</span>
                  <span>·</span>
                  <span>id {doc._id.slice(-6)}</span>
                  {doc.isDeleted && (
                    <>
                      <span>·</span>
                      <span className="font-medium text-rose-500">in trash</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
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
      className={UI.iconBtn}
    >
      {children}
    </button>
  );
}

function PreviewLine({
  category,
  doc,
}: {
  category: CategoryDef;
  doc: ContentDoc;
}) {
  if (category.slug === "wishes") {
    return (
      <p className="truncate text-sm text-slate-700">
        <span className="mr-1.5 text-base">{doc.emoji}</span>
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
        <span className="mr-1.5 text-base">{doc.emoji}</span>
        {doc.notes}
      </p>
    );
  }
  if (category.slug === "promises") {
    return (
      <p className="truncate text-sm text-slate-700">
        <span className="mr-1.5 text-base">{doc.emoji}</span>
        <span className="font-medium">{doc.heading}</span>
        <span className="text-slate-400"> — {doc.detail}</span>
      </p>
    );
  }
  // media-based categories
  return (
    <div className="flex items-center gap-3">
      {doc.media && (
        <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg border border-pink-100 bg-pink-50">
          {doc.mediaType === "video" ? (
            <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
              <VideoIcon className="h-4 w-4" />
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
        <p className="truncate text-sm font-medium text-slate-800">
          {doc.heading ?? (doc.mediaType === "video" ? "Video" : "Image")}
        </p>
        {(doc.description || doc.note) && (
          <p className="truncate text-xs text-slate-500">
            {doc.description ?? doc.note}
          </p>
        )}
      </div>
      <span className="hidden shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:inline-flex">
        {doc.mediaType === "video" ? (
          <VideoIcon className="h-3 w-3" />
        ) : (
          <ImageIcon className="h-3 w-3" />
        )}
        {doc.mediaType ?? "image"}
      </span>
    </div>
  );
}