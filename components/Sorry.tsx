"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

interface SorryItem {
  _id: string;
  note: string;
  order: number;
}

interface Props {
  gateToken: string | null;
  onNext: () => void;
  onPrevious: () => void;
  onRestart: () => void;
}

export default function Sorry({ gateToken, onNext, onPrevious, onRestart }: Props) {
  const [items, setItems] = useState<SorryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gateToken) return;
    let cancelled = false;
    fetch("/api/content?type=sorry", {
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
        setItems((json.data as SorryItem[]) ?? []);
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
        <p className="text-xs uppercase tracking-[0.25em] text-blue-500">Sorry</p>
        <h2 className="mt-2 text-2xl font-medium text-slate-800 sm:text-3xl">
          The parts I&apos;d take back
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
            No notes added yet.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((s, i) => (
              <motion.div
                key={s._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="card p-6"
              >
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {s.note}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-2">
        <button onClick={onPrevious} className="btn-secondary inline-flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button          onClick={onRestart}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restart
        </button>
        <button onClick={onNext} className="btn-primary inline-flex items-center gap-1.5">
          Next
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}