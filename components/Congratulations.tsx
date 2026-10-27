"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ImageIcon, Video } from "lucide-react";

interface CongratsItem {
  _id: string;
  media: string;
  mediaType: "image" | "video";
  heading: string;
  description: string;
  order: number;
}

interface Props {
  items: CongratsItem[];
  loading: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

export default function Congratulations({ items, loading, onNext, onPrevious }: Props) {
  const [index, setIndex] = useState(0);
  const total = items.length;
  const current = items[index];

  function go(dir: 1 | -1) {
    if (total === 0) return;
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
          Congratulations
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-2 text-2xl font-medium text-slate-800 sm:text-3xl"
        >
          You made it, and I&apos;m proud
        </motion.h2>
      </header>

      <div className="mt-8 flex-1">
        {loading ? (
          <div className="card h-80 animate-pulse bg-blue-50/60" />
        ) : total === 0 ? (
          <div className="card flex h-64 flex-col items-center justify-center text-center text-sm text-slate-500">
            Congratulations haven&apos;t been added yet.
          </div>
        ) : (
          <div className="relative">
            <div className="card overflow-hidden">
              <div className="relative aspect-video w-full bg-slate-900">
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
                        alt={current.heading}
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
                <h3 className="text-lg font-medium text-slate-800">
                  {current.heading}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
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
                    aria-label={`Go to item ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-6 bg-blue-500" : "w-1.5 bg-blue-200"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}