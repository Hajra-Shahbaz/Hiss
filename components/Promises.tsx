"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Heart, RotateCcw } from "lucide-react";

interface PromiseItem {
  _id: string;
  heading: string;
  emoji: string;
  detail: string;
  order: number;
}

interface Props {
  gateToken: string | null;
  onNext: () => void;
  onPrevious: () => void;
  onRestart: () => void;
}

export default function Promises({ gateToken, onNext, onPrevious, onRestart }: Props) {
  const [items, setItems] = useState<PromiseItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gateToken) return;
    let cancelled = false;
    fetch("/api/content?type=promises", {
      headers: { Authorization: `Bearer ${gateToken}` },
    })
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json?.success) {
          setError(json?.error ?? "Couldn't load promises.");
          setItems([]);
          return;
        }
        setItems((json.data as PromiseItem[]) ?? []);
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
        <p className="text-xs uppercase tracking-[0.25em] text-blue-500">Promises</p>
        <h2 className="mt-2 text-2xl font-medium text-slate-800 sm:text-3xl">
          Things I mean with my whole chest
        </h2>
      </header>

      <div className="mt-8 flex-1">
        {items === null ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card h-32 animate-pulse bg-blue-50/60" />
            ))}
          </div>
        ) : error ? (
          <div className="card flex h-40 items-center justify-center text-sm text-rose-500">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="card flex h-40 items-center justify-center text-sm text-slate-500">
            No promises added yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="card relative overflow-hidden p-5"
              >
                <div className="absolute right-3 top-3 text-blue-200">
                  <Heart className="h-4 w-4" />
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none">{p.emoji}</span>
                  <div>
                    <h3 className="text-base font-medium text-slate-800">
                      {p.heading}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                      {p.detail}
                    </p>
                  </div>
                </div>
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
        <button
          onClick={onRestart}
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