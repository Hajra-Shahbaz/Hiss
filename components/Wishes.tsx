"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Eye, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

/* ------------------------------------------------------------------ */
/*  Design tokens — soft light theme                                   */
/*  Powder blue + ivory canvas, deep navy ink, muted gold accents      */
/* ------------------------------------------------------------------ */
const GOLD = "#b8893a";
const GOLD_LIGHT = "#e6c37a";
const LINE = "#d9e4f6";

/* Sequential typewriter (supports show-all + replay) */
function useSoftTypewriter(
  items: { id: string; text: string }[],
  enabled: boolean,
  runKey: number
) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [typedText, setTypedText] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRevealedCount(0);
    setTypedText("");
    if (!enabled || items.length === 0) return;

    let wishIdx = 0;
    let charIdx = 0;
    let currentText = "";

    const step = () => {
      const current = items[wishIdx];
      if (!current) return;

      if (charIdx === 0) currentText = current.text;

      if (charIdx < currentText.length) {
        const ch = currentText[charIdx];
        charIdx++;
        setTypedText(currentText.slice(0, charIdx));

        let delay = 40;
        if (ch === "," || ch === ";" || ch === ":") delay = 140;
        if (ch === "." || ch === "!" || ch === "?") delay = 300;
        timeoutRef.current = setTimeout(step, delay);
      } else {
        wishIdx++;
        setRevealedCount(wishIdx);
        setTypedText("");
        charIdx = 0;

        if (wishIdx < items.length) {
          timeoutRef.current = setTimeout(step, 1200);
        }
      }
    };

    timeoutRef.current = setTimeout(step, 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [items, enabled, runKey]);

  const revealAll = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTypedText("");
    setRevealedCount(items.length);
  }, [items.length]);

  return { revealedCount, typedText, setRevealedCount, revealAll };
}

export default function Wishes({ wishes, loading, onNext, onPrevious }: Props) {
  const sorted = useMemo(
    () => wishes.slice().sort((a, b) => a.order - b.order),
    [wishes]
  );

  const items = useMemo(
    () => sorted.map((w) => ({ id: w._id, text: w.description })),
    [sorted]
  );

  const [isAlreadyFinished, setIsAlreadyFinished] = useState(false);
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    if (loading || items.length === 0) return;
    try {
      const typedIdsString = sessionStorage.getItem("typed_wishes_ids");
      if (typedIdsString) {
        const typedIds: string[] = JSON.parse(typedIdsString);
        if (items.every((item) => typedIds.includes(item.id))) {
          setIsAlreadyFinished(true);
        }
      }
    } catch {
      /* ignore storage errors */
    }
  }, [items, loading]);

  const { revealedCount, typedText, setRevealedCount, revealAll } =
    useSoftTypewriter(
      items,
      !loading && sorted.length > 0 && !isAlreadyFinished,
      runKey
    );

  const allShown = sorted.length > 0 && revealedCount >= sorted.length;

  useEffect(() => {
    if (items.length > 0 && revealedCount === items.length) {
      try {
        sessionStorage.setItem(
          "typed_wishes_ids",
          JSON.stringify(items.map((i) => i.id))
        );
      } catch {
        /* ignore storage errors */
      }
    }
  }, [revealedCount, items]);

  useEffect(() => {
    if (isAlreadyFinished) setRevealedCount(items.length);
  }, [isAlreadyFinished, items.length, setRevealedCount]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrollingUp = useRef(false);

  const handleReplay = () => {
    try {
      sessionStorage.removeItem("typed_wishes_ids");
    } catch {
      /* ignore */
    }
    isUserScrollingUp.current = false;
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setIsAlreadyFinished(false);
    setRunKey((k) => k + 1);
  };

  // Smoothly auto-scroll wishes upward as new text appears
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isUserScrollingUp.current || isAlreadyFinished) return;
    requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [revealedCount, typedText, isAlreadyFinished]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isUserScrollingUp.current = distanceFromBottom > 60;
  };

  const progress =
    sorted.length > 0 ? Math.min(100, (revealedCount / sorted.length) * 100) : 0;

  return (
    <div className="wishes-root relative flex h-dvh w-full flex-col overflow-hidden bg-[#f4f8ff]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Manrope:wght@500;600;700&family=Noto+Nastaliq+Urdu:wght@600;700&display=swap');

        .f-ui { font-family: 'Manrope', system-ui, sans-serif; }
        .f-wish { font-family: 'Cormorant Garamond', Georgia, serif; }

        .f-urdu {
          font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;
          font-weight: 700;
          color: ${GOLD};
          line-height: 2;
          padding: 0.2em 0.35em 0.35em 0.35em;
          overflow: visible;
          display: inline-block;
        }

        /* Crisp fade-in without blur */
        .crisp-char {
          animation: crispIn 0.25s ease-out both;
        }
        @keyframes crispIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Scrollbar moved to the left */
        .wishes-scroll {
          direction: rtl;
          scrollbar-width: thin;
          scrollbar-color: ${GOLD_LIGHT} transparent;
        }
        .wishes-scroll > * {
          direction: ltr;
        }
        .wishes-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .wishes-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .wishes-scroll::-webkit-scrollbar-thumb {
          background: ${GOLD_LIGHT};
          border-radius: 9999px;
        }
        .wishes-scroll::-webkit-scrollbar-thumb:hover {
          background: ${GOLD};
        }

        @media (prefers-reduced-motion: reduce) {
          .crisp-char { animation: none; }
        }
      `}</style>

      {/* --- Soft light background --- */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#ffffff] via-[#f1f6ff] to-[#e6eefb]" />
      <div className="pointer-events-none fixed -top-[20%] -left-[10%] z-0 h-[60vh] w-[55vw] rounded-full bg-[#bcd6ff]/50 blur-[130px]" />
      <div className="pointer-events-none fixed bottom-[-15%] right-[-10%] z-0 h-[55vh] w-[50vw] rounded-full bg-[#fbe3b0]/45 blur-[130px]" />
      <div className="pointer-events-none fixed top-[35%] left-[40%] z-0 h-[35vh] w-[35vw] rounded-full bg-[#d9d4ff]/40 blur-[120px]" />

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(${LINE} 1px, transparent 1px)`,
          backgroundSize: "26px 26px",
        }}
      />

      <AmbientDust />

      {/* Main 100% viewport container */}
      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col px-4 py-3 sm:px-6 md:px-8 md:py-5">
        {/* ---------------- Header ---------------- */}
        <header className="w-full shrink-0">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center border border-[#b8893a]/40 bg-white/80 shadow-[0_6px_16px_-8px_rgba(184,137,58,0.5)] md:h-10 md:w-10">
                <Sparkles className="h-4 w-4 text-[#b8893a] md:h-[18px] md:w-[18px]" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="f-wish text-xl font-bold text-[#1b2a4e] md:text-3xl">
                  Wishes
                </span>
                <span className="f-ui text-[11px] font-medium text-[#5a6a8f] md:text-xs">
                  Kind words, just for you
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {sorted.length > 0 && (
                <span className="f-ui text-xs font-semibold text-[#5a6a8f] md:text-sm">
                  <span className="text-[#1b2a4e]">{revealedCount}</span> of{" "}
                  {sorted.length}
                </span>
              )}

              {allShown ? (
                <button
                  type="button"
                  onClick={handleReplay}
                  title="Replay wishes"
                  aria-label="Replay wishes"
                  className="flex h-9 w-9 items-center justify-center border border-[#d9e4f6] bg-white/80 text-[#1b2a4e] shadow-sm transition hover:border-[#b8893a]/60 hover:text-[#b8893a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8893a] md:h-10 md:w-10"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={revealAll}
                  disabled={loading || sorted.length === 0}
                  title="Show all wishes"
                  aria-label="Show all wishes"
                  className="flex h-9 w-9 items-center justify-center border border-[#d9e4f6] bg-white/80 text-[#1b2a4e] shadow-sm transition hover:border-[#b8893a]/60 hover:text-[#b8893a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8893a] disabled:cursor-not-allowed disabled:opacity-40 md:h-10 md:w-10"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress line */}
          <div className="relative mt-3 h-px w-full bg-[#d9e4f6] md:mt-4">
            <motion.div
              className="absolute left-0 top-0 h-[2px] -translate-y-[0.5px] bg-gradient-to-r from-[#e6c37a] to-[#b8893a]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </header>

        {/* ---------------- Body (100% remaining height) ---------------- */}
        <div className="mt-3 flex min-h-0 w-full flex-1 flex-col gap-4 md:mt-5 md:flex-row md:items-center md:justify-between md:gap-12 lg:gap-16">
          {/* STILL IMAGE & COMPLETE GOLD URDU AMEEN */}
          <div className="order-1 flex shrink-0 flex-col items-center justify-center md:order-2 md:h-full md:w-[44%] md:max-w-md">
            <div className="relative flex w-full max-w-[175px] items-center justify-center sm:max-w-[210px] md:max-w-[330px]">
              {/* Soft ambient glow */}
              <div className="pointer-events-none absolute -inset-4 -z-10 bg-gradient-to-bl from-[#fbe3b0]/60 via-[#bcd6ff]/50 to-transparent blur-2xl" />

              {/* Offset gold frame */}
              <span className="pointer-events-none absolute left-2.5 top-2.5 h-full w-full border border-[#b8893a]/40 md:left-3.5 md:top-3.5" />

              <div className="relative border border-[#e6c37a] bg-white p-1.5 shadow-[0_20px_45px_-24px_rgba(27,42,78,0.45)] md:p-2.5">
                <div className="relative overflow-hidden ring-1 ring-[#d9e4f6]">
                  <img
                    src="/his.jpeg"
                    alt="A special wish"
                    className="block max-h-[22vh] w-auto object-contain sm:max-h-[25vh] md:max-h-[48vh]"
                  />
                </div>

                {/* Corner brackets */}
                <span className="pointer-events-none absolute -left-1.5 -top-1.5 h-4 w-4 border-l-2 border-t-2 border-[#b8893a]" />
                <span className="pointer-events-none absolute -right-1.5 -top-1.5 h-4 w-4 border-r-2 border-t-2 border-[#b8893a]" />
                <span className="pointer-events-none absolute -bottom-1.5 -left-1.5 h-4 w-4 border-b-2 border-l-2 border-[#b8893a]" />
                <span className="pointer-events-none absolute -bottom-1.5 -right-1.5 h-4 w-4 border-b-2 border-r-2 border-[#b8893a]" />
              </div>
            </div>

            {/* Complete, unclipped GOLD URDU AMEEN */}
            <div className="mt-2 flex w-full flex-col items-center overflow-visible md:mt-5">
              <div className="flex w-full items-center justify-center gap-3">
                <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#b8893a]/60 md:w-20" />
                <span className="h-2 w-2 rotate-45 bg-[#b8893a]" />
                <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#b8893a]/60 md:w-20" />
              </div>

              <div className="flex items-center justify-center overflow-visible px-4">
                <span
                  dir="rtl"
                  lang="ur"
                  className="f-urdu text-[2.1rem] sm:text-[2.4rem] md:text-[3.1rem]"
                >
                  آمین
                </span>
              </div>

              <div className="flex w-full items-center justify-center gap-3">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#b8893a]/40" />
                <span className="h-1 w-1 bg-[#b8893a]" />
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#b8893a]/40" />
              </div>
            </div>
          </div>

          {/* AUTO-SCROLLING WISHES LIST */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="wishes-scroll order-2 min-h-0 w-full flex-1 overflow-y-auto pl-2 md:order-1 md:h-full md:w-[56%] md:pl-4"
          >
            {loading ? (
              <LoadingStage />
            ) : sorted.length === 0 ? (
              <EmptyStage />
            ) : (
              <div className="flex flex-col gap-3 pb-6 md:gap-4 md:pb-10">
                <AnimatePresence initial={false}>
                  {sorted.map((wish, i) => {
                    const isDone = i < revealedCount;
                    const isCurrent = i === revealedCount;
                    if (!isDone && !isCurrent) return null;

                    const chars = typedText.split("");

                    return (
                      <motion.article
                        key={wish._id}
                        layout="position"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                        className="relative shrink-0 overflow-hidden border border-[#d9e4f6] bg-white/80 p-3.5 shadow-[0_14px_34px_-22px_rgba(27,42,78,0.3)] backdrop-blur-md md:p-5"
                      >
                        <span className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-[#e6c37a] to-[#b8893a]" />

                        <div className="flex items-start gap-3.5 md:gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#e6c37a]/70 bg-gradient-to-br from-[#fff9ea] to-[#eaf2ff] md:h-12 md:w-12">
                            <span
                              className="text-xl leading-none md:text-2xl"
                              aria-hidden="true"
                            >
                              {wish.emoji}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex items-center gap-2.5">
                              <p className="f-ui text-[11px] font-bold text-[#b8893a] md:text-xs">
                                Wish {i + 1}
                              </p>
                              <span className="h-px flex-1 bg-gradient-to-r from-[#e6c37a]/70 to-transparent" />
                            </div>

                            <div className="f-wish text-[19px] font-semibold leading-[1.55] text-[#1b2a4e] sm:text-[21px] lg:text-[23px]">
                              {isDone && <span>{wish.description}</span>}

                              {isCurrent && (
                                <span>
                                  {chars.map((c, k) => (
                                    <span key={k} className="crisp-char">
                                      {c}
                                    </span>
                                  ))}
                                  <motion.span
                                    animate={{ opacity: [0.9, 0.15, 0.9] }}
                                    transition={{
                                      duration: 1.2,
                                      repeat: Infinity,
                                      ease: "easeInOut",
                                    }}
                                    className="ml-1 inline-block h-[0.9em] w-[2px] translate-y-[0.12em] bg-[#b8893a]"
                                  />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Gentle floating light specks (client-only to avoid hydration mismatch) */
function AmbientDust() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dots = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 3 + Math.random() * 3,
        delay: Math.random() * 5,
        duration: 12 + Math.random() * 10,
        drift: 8 + Math.random() * 14,
      })),
    []
  );

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full bg-[#e6c37a]"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
          }}
          animate={{
            y: [-d.drift, d.drift, -d.drift],
            opacity: [0.15, 0.5, 0.15],
          }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function LoadingStage() {
  return (
    <div className="w-full space-y-3 md:space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="border border-[#d9e4f6] bg-white/60 p-4">
          <div className="mb-3 h-3 w-1/4 animate-pulse bg-[#dbe6fa]" />
          <div className="mb-2 h-5 w-full animate-pulse bg-[#e6eefb]" />
          <div className="h-5 w-4/5 animate-pulse bg-[#e6eefb]" />
        </div>
      ))}
    </div>
  );
}

function EmptyStage() {
  return (
    <div className="f-wish flex h-44 items-center justify-center border border-dashed border-[#c5d5f0] bg-white/50 text-center text-lg italic text-[#5a6a8f]">
      Wishes haven&apos;t been added yet.
    </div>
  );
}