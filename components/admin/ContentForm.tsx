"use client";

import { FormEvent, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { CategoryDef, ContentDoc } from "./types";
import { Modal, UI } from "./ui";

export default function ContentForm({
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
      <form onSubmit={submit} className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            {isNew ? `Add ${category.label}` : `Edit ${category.label}`}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">{category.description}</p>
        </div>

        <div className="space-y-4">
          {category.fields.map((f) => (
            <div key={f.name}>
              <label className={UI.label}>
                {f.label}
                {f.required && <span className="text-rose-500"> *</span>}
              </label>

              {f.kind === "media" ? (
                <div className="space-y-2">
                  {values.media ? (
                    <div className="overflow-hidden rounded-xl border border-pink-100 bg-pink-50">
                      {mediaType === "video" ? (
                        <video
                          src={values.media}
                          controls
                          className="h-44 w-full object-contain"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={values.media}
                          alt=""
                          className="h-44 w-full object-contain"
                        />
                      )}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
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
                      className={UI.secondaryBtn}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {values.media ? "Replace" : "Upload"}
                    </button>
                    {values.media && (
                      <button
                        type="button"
                        onClick={() => {
                          setField("media", "");
                          setPublicId("");
                        }}
                        className="text-xs font-medium text-rose-500 hover:underline"
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
                    className={`${UI.input} text-xs`}
                  />
                </div>
              ) : f.kind === "textarea" ? (
                <textarea
                  value={values[f.name]}
                  onChange={(e) => setField(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  rows={3}
                  className={`${UI.input} resize-none`}
                />
              ) : (
                <input
                  type="text"
                  value={values[f.name]}
                  onChange={(e) => setField(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  className={UI.input}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-pink-100 pt-4">
          <button type="button" onClick={onClose} className={UI.secondaryBtn}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className={UI.primaryBtn}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isNew ? "Create" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}