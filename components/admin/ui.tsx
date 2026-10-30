"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

// ── Theme tokens ────────────────────────────────────────────────────────────
export const UI = {
  card: "rounded-2xl border border-pink-100 bg-white shadow-sm shadow-pink-100/40",
  primaryBtn:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-pink-200 transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50",
  secondaryBtn:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium text-pink-700 transition hover:bg-pink-50 disabled:opacity-50",
  iconBtn:
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-pink-100 bg-white text-pink-600 transition hover:border-pink-300 hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-40",
  input:
    "w-full rounded-xl border border-pink-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-pink-300 transition focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200",
  label: "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-pink-700",
  badge:
    "inline-flex items-center gap-1 rounded-full border border-pink-100 bg-pink-50 px-2 py-0.5 text-[11px] font-medium text-pink-700",
};

// ── Field wrapper ───────────────────────────────────────────────────────────
export function Field({
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
      <label className={UI.label}>
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

// ── Modal ───────────────────────────────────────────────────────────────────
export function Modal({
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
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className={`${UI.card} my-8 w-full max-w-lg p-6`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Confirm dialog ──────────────────────────────────────────────────────────
export function ConfirmDialog({
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
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onCancel} className={UI.secondaryBtn}>
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${
            danger
              ? "bg-rose-500 shadow-rose-200 hover:bg-rose-600"
              : "bg-pink-500 shadow-pink-200 hover:bg-pink-600"
          }`}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ── Toast ───────────────────────────────────────────────────────────────────
export function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2.5 text-sm text-white shadow-xl"
        >
          <span className="inline-flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Skeleton list ───────────────────────────────────────────────────────────
export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-pink-100/60" />
      ))}
    </div>
  );
}