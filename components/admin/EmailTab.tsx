"use client";

import { FormEvent, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Field, Toast, UI } from "./ui";

export default function EmailTab({ token }: { token: string }) {
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

      <form onSubmit={submit} className={`${UI.card} space-y-5 p-6`}>
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
            rows={5}
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

        <div className="flex justify-end border-t border-pink-100 pt-4">
          <button type="submit" disabled={sending} className={UI.primaryBtn}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {sending ? "Sending…" : "Send email"}
          </button>
        </div>
      </form>

      <Toast message={toast} />
    </div>
  );
}