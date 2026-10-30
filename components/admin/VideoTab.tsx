"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, Upload, Video as VideoIcon } from "lucide-react";
import { VideoDoc } from "./types";
import { Field, Toast, UI } from "./ui";

export default function VideoTab({ token }: { token: string }) {
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
    return <div className={`${UI.card} h-64 animate-pulse bg-pink-100/60`} />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Main Video</h1>
        <p className="mt-1 text-sm text-slate-500">
          This is the video shown right after the balloons.
        </p>
      </div>

      <form onSubmit={save} className={`${UI.card} space-y-5 p-6`}>
        {doc.media ? (
          <div className="overflow-hidden rounded-xl bg-slate-900">
            <video
              src={doc.media}
              controls
              className="aspect-video w-full"
            />
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-pink-200 bg-pink-50/50 text-center">
            <VideoIcon className="h-8 w-8 text-pink-300" />
            <p className="text-sm text-slate-500">No video uploaded yet.</p>
          </div>
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
            className={UI.secondaryBtn}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {doc.media ? "Replace video" : "Upload video"}
          </button>
        </div>

        <Field label="Description">
          <textarea
            value={doc.description}
            onChange={(e) => setDoc({ ...doc, description: e.target.value })}
            rows={3}
            className={`${UI.input} resize-none`}
            placeholder="A short note shown below the video"
          />
        </Field>

        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        )}

        <div className="flex justify-end border-t border-pink-100 pt-4">
          <button
            type="submit"
            disabled={saving || uploading}
            className={UI.primaryBtn}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </form>

      <Toast message={toast} />
    </div>
  );
}