"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

interface Wish {
  _id: string;
  emoji: string;
  description: string;
  order: number;
}

interface Props {
  wishes: Wish[];
  loading: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

export default function Wishes({ wishes, loading, onNext, onPrevious }: Props) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 flex items-center justify-center gap-2 text-blue-300"
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-xs uppercase tracking-[0.25em] text-blue-500">
            Wishes
          </span>
          <Sparkles className="h-4 w-4" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-2xl font-medium text-slate-800 sm:text-3xl"
        >
          A few wishes for you
        </motion.h2>
      </header>

      <div className="mt-8 flex-1">
        {loading ? (
          <SkeletonGrid />
        ) : wishes.length === 0 ? (
          <EmptyState message="Wishes haven't been added yet." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {wishes.map((w, i) => (
              <motion.div
                key={w._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="card p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl leading-none" aria-hidden="true">
                    {w.emoji}
                  </span>
                  <p className="pt-1 text-sm leading-relaxed text-slate-700">
                    {w.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Nav onPrevious={onPrevious} onNext={onNext} />
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card h-24 animate-pulse bg-blue-50/60" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="card flex h-40 flex-col items-center justify-center text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function Nav({ onPrevious, onNext }: { onPrevious: () => void; onNext: () => void }) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      <button onClick={onPrevious} className="btn-secondary inline-flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <button onClick={onNext} className="btn-primary inline-flex items-center gap-2">
        Next
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}