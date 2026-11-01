"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Mail, RefreshCw } from "lucide-react";
import { Field, Toast, UI } from "./ui";

const EMPTY_FORM = {
  to: "",
  recipientName: "",
  subject: "",
  heading: "",
  message: "",
  imageUrl: "",
  buttonText: "",
  buttonUrl: "",
  closing: "",
};

type FormState = typeof EMPTY_FORM;

export default function EmailTab({ token }: { token: string }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Preview state
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  function set<K extends keyof FormState>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // ── Payload builder (shared by preview + send) ──────────
  const buildPayload = useCallback(
    () => ({
      to: form.to.trim() || "preview@example.com",
      recipientName: form.recipientName.trim() || "Friend",
      subject: form.subject.trim() || "A little message",
      heading: form.heading.trim() || "A little message",
      message: form.message.trim(),
      imageUrl: form.imageUrl.trim() || undefined,
      buttonText: form.buttonText.trim() || undefined,
      buttonUrl: form.buttonUrl.trim() || undefined,
      closing: form.closing.trim() || undefined,
    }),
    [form],
  );

  // ── Live preview (debounced) ────────────────────────────
  const previewKey = useMemo(
    () =>
      JSON.stringify({
        h: form.heading,
        m: form.message,
        i: form.imageUrl,
        bt: form.buttonText,
        bu: form.buttonUrl,
        c: form.closing,
        rn: form.recipientName,
      }),
    [
      form.heading,
      form.message,
      form.imageUrl,
      form.buttonText,
      form.buttonUrl,
      form.closing,
      form.recipientName,
    ],
  );

  useEffect(() => {
    // Nothing to preview yet
    if (!form.heading.trim() && !form.message.trim()) {
      setPreviewHtml("");
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);

    const timer = window.setTimeout(async () => {
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
          // Supports both `ok({ html })` shapes:
          //   { success: true, data: { html } }   ← wrapped
          //   { success: true, html }              ← spread
          const html =
            (json as { data?: { html?: string }; html?: string }).data?.html ??
            (json as { html?: string }).html ??
            "";
          setPreviewHtml(html);
        }
      } catch (e) {
        if (!cancelled) setPreviewError((e as Error).message);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, previewKey]);

  // ── Send ───────────────────────────────────────────────
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
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Send an Email</h1>
        <p className="mt-1 text-sm text-slate-500">
          Uses the reusable HTML template in{" "}
          <code className="rounded bg-pink-50 px-1 py-0.5 text-xs text-pink-700">
            lib/email.ts
          </code>
          .
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        {/* ── Form column ─────────────────────────────── */}
        <form
          onSubmit={submit}
          className={`${UI.card} space-y-5 p-6 xl:col-span-3`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="To" required>
              <input
                type="email"
                value={form.to}
                onChange={(e) => set("to", e.target.value)}
                placeholder="someone@example.com"
                className={UI.input}
                required
              />
            </Field>
            <Field label="Recipient name" required>
              <input
                type="text"
                value={form.recipientName}
                onChange={(e) => set("recipientName", e.target.value)}
                placeholder="Their name"
                className={UI.input}
                required
              />
            </Field>
            <Field label="Subject" required>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
                className={UI.input}
                required
              />
            </Field>
            <Field label="Heading" required>
              <input
                type="text"
                value={form.heading}
                onChange={(e) => set("heading", e.target.value)}
                className={UI.input}
                required
              />
            </Field>
          </div>

          <Field label="Message" required>
            <textarea
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              rows={6}
              className={`${UI.input} resize-none`}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Image URL (optional)">
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                placeholder="https://…"
                className={UI.input}
              />
            </Field>
            <Field label="Button text (optional)">
              <input
                type="text"
                value={form.buttonText}
                onChange={(e) => set("buttonText", e.target.value)}
                className={UI.input}
              />
            </Field>
            <Field label="Button URL (optional)">
              <input
                type="url"
                value={form.buttonUrl}
                onChange={(e) => set("buttonUrl", e.target.value)}
                className={UI.input}
              />
            </Field>
            <Field label="Closing (optional)">
              <input
                type="text"
                value={form.closing}
                onChange={(e) => set("closing", e.target.value)}
                className={UI.input}
              />
            </Field>
          </div>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-pink-100 pt-4">
            <a
              href="#email-preview"
              className="inline-flex items-center gap-1.5 rounded-xl border border-pink-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-pink-50 xl:hidden"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </a>
            <button
              type="submit"
              disabled={sending}
              className={UI.primaryBtn}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {sending ? "Sending…" : "Send email"}
            </button>
          </div>
        </form>

        {/* ── Preview column ──────────────────────────── */}
        <div
          id="email-preview"
          className={`${UI.card} flex flex-col overflow-hidden p-0 xl:col-span-2`}
        >
          <div className="flex items-center justify-between border-b border-pink-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                <Eye className="h-3.5 w-3.5" />
              </span>
              <p className="text-sm font-bold text-slate-800">Live preview</p>
            </div>
            {previewLoading && (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-pink-400" />
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-blue-50/40 p-3">
            {!form.heading.trim() && !form.message.trim() ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center">
                <Mail className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">
                  Start typing a heading or message
                </p>
                <p className="text-xs text-slate-400">
                  The email will appear here.
                </p>
              </div>
            ) : previewError ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="text-sm font-medium text-rose-600">
                  Couldn't load preview
                </p>
                <p className="text-xs text-slate-500">{previewError}</p>
              </div>
            ) : previewLoading && !previewHtml ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-pink-400" />
                <p className="text-xs font-medium">Building preview…</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-pink-100 bg-white">
                <iframe
                  title="Email preview"
                  srcDoc={previewHtml}
                  className="h-[70vh] w-full border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast message={toast} />
    </div>
  );
}