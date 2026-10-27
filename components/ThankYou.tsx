"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, RotateCcw } from "lucide-react";

interface ThankYouItem {
  _id: string;
  emoji: string;
  notes: string;
  order: number;
}

interface Props {
  gateToken: string | null;
  onPrevious: () => void;
  onRestart: () => void;
}

export default function ThankYou({ gateToken, onPrevious, onRestart }: Props) {
  const [items, setItems] = useState<ThankYouItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gateToken) return;
    let cancelled = false;
    fetch("/api/content?type=thankyou", {
      headers: { Authorization: `Bearer ${gateToken}` },
    })
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json?.success) {
          setError(json?.error ?? "Couldn't load this section.");
          setItems([]);
          return;
        }
        setItems((json.data as ThankYouItem[]) ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Network error.");
        setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [gateToken]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-blue-500">Thank You</p>
        <h2 className="mt-2 text-2xl font-medium text-slate-800 sm:text-3xl">
          For being you
        </h2>
      </header>

      <div className="mt-8 flex-1">
        {items === null ? (
          <div className="card h-40 animate-pulse bg-blue-50/60" />
        ) : error ? (
          <div className="card flex h-40 items-center justify-center text-sm text-rose-500">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="card flex h-40 items-center justify-center text-sm text-slate-500">
            Nothing added yet.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((t, i) => (
              <motion.div
                key={t._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="card flex items-start gap-4 p-6"
              >
                <span className="text-3xl leading-none">{t.emoji}</span>
                <p className="whitespace-pre-line pt-1 text-sm leading-relaxed text-slate-700">
                  {t.notes}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-10 flex flex-col items-center gap-4"
      >
        <div className="flex items-center gap-2 text-blue-400">
          <span className="h-px w-10 bg-blue-200" />
          <Heart className="h-4 w-4" />
          <span className="h-px w-10 bg-blue-200" />
        </div>
        <p className="text-center text-sm italic text-slate-500">
          That&apos;s everything. Happy birthday, Umer. 💙
        </p>
      </motion.div>

      <div className="mt-8 flex items-center justify-between gap-2">
        <button onClick={onPrevious} className="btn-secondary inline-flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Start over
        </button>
        <span className="w-[76px]" aria-hidden="true" />
      </div>
    </div>
  );
}