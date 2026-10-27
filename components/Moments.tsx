"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  RotateCcw,
  Video,
} from "lucide-react";

interface Moment {
  _id: string;
  media: string;
  mediaType: "image" | "video";
  heading: string;
  note: string;
  order: number;
}

interface Props {
  gateToken: string | null;
  onNext: () => void;
  onPrevious: () => void;
  onRestart: () => void;
}

export default function Moments({ gateToken, onNext, onPrevious, onRestart }: Props) {
  const [items, setItems] = useState<Moment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gateToken) return;
    let cancelled = false;
    fetch("/api/content?type=moments", {
      headers: { Authorization: `Bearer ${gateToken}` },
    })
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json?.success) {
          setError(json?.error ?? "Couldn't load moments.");
          setItems([]);
          return;
        }
        setItems((json.data as Moment[]) ?? []);
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
        <p className="text-xs uppercase tracking-[0.25em] text-blue-500">Moments</p>
        <h2 className="mt-2 text-2xl font-medium text-slate-800 sm:text-3xl">
          Little pockets of time
        </h2>
      </header>

      <div className="mt-8 flex-1">
        {items === null ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card h-64 animate-pulse bg-blue-50/60" />
            ))}
          </div>
        ) : error ? (
          <div className="card flex h-40 items-center justify-center text-sm text-rose-500">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="card flex h-40 items-center justify-center text-sm text-slate-500">
            No moments added yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {items.map((m, i) => (
              <motion.article
                key={m._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="card overflow-hidden"
              >
                <div className="relative aspect-video bg-slate-900">
                  {m.mediaType === "video" ? (
                    <video
                      src={m.media}
                      controls
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.media}
                      alt={m.heading}
                      className="h-full w-full object-contain"
                    />
                  )}
                  <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-blue-700">
                    {m.mediaType === "video" ? (
                      <Video className="h-3 w-3" />
                    ) : (
                      <ImageIcon className="h-3 w-3" />
                    )}
                    {m.mediaType}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-medium text-slate-800">{m.heading}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {m.note}
                  </p>
                </div>
              </motion.article>
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