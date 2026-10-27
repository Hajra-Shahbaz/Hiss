"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  RotateCcw,
  Video,
} from "lucide-react";

interface Memory {
  _id: string;
  media: string;
  mediaType: "image" | "video";
  description: string;
  order: number;
}

interface Props {
  gateToken: string | null;
  onNext: () => void;
  onPrevious: () => void;
  onRestart: () => void;
}

export default function Memories({ gateToken, onNext, onPrevious, onRestart }: Props) {
  const [items, setItems] = useState<Memory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!gateToken) return;
    let cancelled = false;
    fetch("/api/content?type=memories", {
      headers: { Authorization: `Bearer ${gateToken}` },
    })
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json?.success) {
          setError(json?.error ?? "Couldn't load memories.");
          setItems([]);
          return;
        }
        setItems((json.data as Memory[]) ?? []);
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

  const total = items?.length ?? 0;
  const current = items && total > 0 ? items[index] : null;

  function go(dir: 1 | -1) {
    if (!total) return;
    setIndex((i) => (i + dir + total) % total);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="text-center">
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs uppercase tracking-[0.25em] text-blue-500"
        >
          Memories
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-2 text-2xl font-medium text-slate-800 sm:text-3xl"
        >
          Things I keep close
        </motion.h2>
      </header>

      <div className="mt-8 flex-1">
        {items === null ? (
          <div className="card h-80 animate-pulse bg-blue-50/60" />
        ) : error ? (
          <div className="card flex h-40 items-center justify-center text-sm text-rose-500">
            {error}
          </div>
        ) : total === 0 ? (
          <div className="card flex h-40 items-center justify-center text-sm text-slate-500">
            No memories added yet.
          </div>
        ) : (
          current && (
            <div className="relative">
              <div className="card overflow-hidden">
                <div className="relative aspect-square w-full bg-slate-900 sm:aspect-video">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={current._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="absolute inset-0"
                    >
                      {current.mediaType === "video" ? (
                        <video
                          src={current.media}
                          controls
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={current.media}
                          alt={current.description}
                          className="h-full w-full object-contain"
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>

                  <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-blue-700">
                    {current.mediaType === "video" ? (
                      <Video className="h-3 w-3" />
                    ) : (
                      <ImageIcon className="h-3 w-3" />
                    )}
                    {current.mediaType}
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm leading-relaxed text-slate-600">
                    {current.description}
                  </p>
                </div>
              </div>

              {total > 1 && (
                <>
                  <button
                    onClick={() => go(-1)}
                    aria-label="Previous"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-blue-100 bg-white/90 p-2 text-blue-700 hover:bg-blue-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => go(1)}
                    aria-label="Next"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-blue-100 bg-white/90 p-2 text-blue-700 hover:bg-blue-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {total > 1 && (
                <div className="mt-4 flex items-center justify-center gap-1.5">
                  {items.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      aria-label={`Go to memory ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        i === index ? "w-6 bg-blue-500" : "w-1.5 bg-blue-200"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )
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