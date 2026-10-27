"use client";

import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Loader2, ArrowLeft, Unlock } from "lucide-react";

interface Props {
  alreadyVerified: boolean;
  onVerified: (token: string) => void;
  onSkip: () => void;
  onBack: () => void;
}

export default function SecretGate({ alreadyVerified, onVerified, onSkip, onBack }: Props) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const secret = value.trim();
    if (!secret) {
      setError("Please enter the secret.");
      setShake((s) => s + 1);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setError(json?.error ?? "That doesn't look right.");
        setShake((s) => s + 1);
        return;
      }
      const token = json.data?.token as string | undefined;
      if (!token) {
        setError("Something went wrong. Try again.");
        return;
      }
      onVerified(token);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (alreadyVerified) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600"
        >
          <Unlock className="h-6 w-6" />
        </motion.div>
        <p className="text-sm text-slate-600">You&apos;re already unlocked.</p>
        <div className="mt-6 flex gap-3">
          <button onClick={onBack} className="btn-secondary">Back</button>
          <button onClick={onSkip} className="btn-primary">Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600"
      >
        <KeyRound className="h-5 w-5" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="text-2xl font-medium text-slate-800 sm:text-3xl"
      >
        One small secret
      </motion.h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Enter the date only you and I know, and the rest opens up.
      </p>

      <form onSubmit={submit} className="mt-8 w-full max-w-xs">
        <motion.input
          key={shake}
          initial={{ x: 0 }}
          animate={{ x: [0, -8, 8, -6, 6, 0] }}
          transition={{ duration: 0.35 }}
          type="password"
          inputMode="text"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="The secret"
          className="input-field text-center tracking-widest"
          autoFocus
          disabled={submitting}
        />

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking…
            </>
          ) : (
            "Unlock"
          )}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Go back
        </button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.p
            key={error}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-5 max-w-sm text-sm text-rose-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}