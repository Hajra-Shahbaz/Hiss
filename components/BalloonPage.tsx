"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper } from "lucide-react";

interface Props {
  onComplete: () => void;
}

const TOTAL = 22;

interface Balloon {
  id: number;
  hue: "powder" | "pastel" | "ink";
  delay: number;
  duration: number;
  drift: number;
  leftPct: number;
  topPct: number;
}

const HUES: Record<Balloon["hue"], { body: string; tie: string; shine: string }> = {
  powder: { body: "#bfdbfe", tie: "#93c5fd", shine: "#eff6ff" },
  pastel: { body: "#dbeafe", tie: "#bfdbfe", shine: "#ffffff" },
  ink: { body: "#c7d6f5", tie: "#a4b8e8", shine: "#eff6ff" },
};

export default function BalloonPage({ onComplete }: Props) {
  const balloons = useMemo<Balloon[]>(() => {
    const arr: Balloon[] = [];
    for (let i = 0; i < TOTAL; i++) {
      // deterministic pseudo-random layout so SSR/CSR match
      const leftPct = (i * 137.508) % 100;
      const topPct = ((i * 61.803) % 70) + 8;
      arr.push({
        id: i,
        hue: i % 5 === 0 ? "ink" : i % 2 === 0 ? "powder" : "pastel",
        delay: (i % 6) * 0.35,
        duration: 5 + (i % 5),
        drift: i % 2 === 0 ? 12 : -12,
        leftPct,
        topPct,
      });
    }
    return arr;
  }, []);

  const [popped, setPopped] = useState<Set<number>>(new Set());
  const [justPopped, setJustPopped] = useState<number | null>(null);
  const count = popped.size;
  const done = count === TOTAL;

  function pop(id: number) {
    if (popped.has(id)) return;
    const s = new Set(popped);
    s.add(id);
    setPopped(s);
    setJustPopped(id);
    window.setTimeout(() => setJustPopped((curr) => (curr === id ? null : curr)), 450);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="pt-2 text-center">
        <h2 className="text-2xl font-medium text-slate-800 sm:text-3xl">
          Pop all 22 balloons
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          One for every year you&apos;ve made the world better.
        </p>
      </div>

      <div className="relative mt-4 h-[55vh] min-h-[340px] w-full overflow-hidden rounded-3xl border border-blue-100 bg-white/60">
        {balloons.map((b) => {
          const isPopped = popped.has(b.id);
          const showPopRing = justPopped === b.id;
          const hue = HUES[b.hue];

          return (
            <div
              key={b.id}
              className="absolute"
              style={{ left: `${b.leftPct}%`, top: `${b.topPct}%`, transform: "translate(-50%, 0)" }}
            >
              <AnimatePresence mode="wait">
                {!isPopped ? (
                  <motion.button
                    key="balloon"
                    type="button"
                    onClick={() => pop(b.id)}
                    aria-label={`Pop balloon ${b.id + 1}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.1 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="relative block"
                  >
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                        x: [0, b.drift, 0],
                      }}
                      transition={{
                        duration: b.duration,
                        delay: b.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <svg width="56" height="76" viewBox="0 0 56 76" aria-hidden="true">
                        <ellipse
                          cx="28"
                          cy="30"
                          rx="22"
                          ry="27"
                          fill={hue.body}
                          stroke={hue.tie}
                          strokeWidth="1.2"
                        />
                        <ellipse cx="20" cy="20" rx="5" ry="8" fill={hue.shine} opacity="0.7" />
                        <path
                          d="M28 57 L24 63 L32 63 Z"
                          fill={hue.tie}
                        />
                        <path
                          d="M28 63 C24 67, 32 70, 28 74"
                          fill="none"
                          stroke={hue.tie}
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </motion.div>
                  </motion.button>
                ) : (
                  <motion.div
                    key="pop"
                    initial={{ opacity: 0.9, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.8 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="h-14 w-14 rounded-full border-2"
                    style={{ borderColor: hue.tie }}
                  />
                )}
              </AnimatePresence>

              {showPopRing && (
                <motion.span
                  initial={{ opacity: 1, scale: 0.2 }}
                  animate={{ opacity: 0, scale: 2.2 }}
                  transition={{ duration: 0.5 }}
                  className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                  style={{ borderColor: hue.tie }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-blue-100">
          <motion.div
            className="h-full rounded-full bg-blue-500"
            animate={{ width: `${(count / TOTAL) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <p className="text-sm text-slate-500">
          <span className="font-medium text-slate-700">{count}</span> / {TOTAL} balloons popped
        </p>

        {done && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onComplete}
            className="btn-primary mt-1 inline-flex items-center gap-2"
          >
            <PartyPopper className="h-4 w-4" />
            Continue
          </motion.button>
        )}
      </div>
    </div>
  );
}