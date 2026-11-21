"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Video,
} from "lucide-react";

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

const FONT_DISPLAY = "'Instrument Serif', Georgia, serif";
const FONT_BODY = "'Newsreader', Georgia, serif";
const FONT_UI = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

export default function Congratulations({ items, loading, onNext, onPrevious }: Props) {
  const [index, setIndex] = useState(0);
  const reduceMotion = !!useReducedMotion();
  const total = items.length;
  const safeIndex = total > 0 ? index % total : 0;
  const current = items[safeIndex];

  function go(dir: 1 | -1) {
    if (total === 0) return;
    setIndex((i) => (i + dir + total) % total);
  }

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, 15000);
    return () => clearInterval(timer);
  }, [total]);

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const isEven = safeIndex % 2 === 0;

  return (
    <div
      className="relative flex min-h-[100dvh] w-full flex-col justify-between overflow-hidden px-4 py-6 text-[#182033] sm:px-8 sm:py-8"
      style={{ fontFamily: FONT_UI }}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 15% 10%, #eef2ff 0%, transparent 45%), radial-gradient(circle at 88% 85%, #fdf2f6 0%, transparent 45%), linear-gradient(180deg, #fafbfe 0%, #f3f5fb 100%)",
        }}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-between gap-5">
        <header className="border-b border-[#e2e7f3] pb-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#475b9b]">
            Congratulations
          </p>
          <h2
            className="mt-1.5 text-[34px] font-normal leading-[1.08] tracking-tight text-[#161e31] sm:text-[46px]"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            You made it, and I&apos;m proud
          </h2>
          <p
            className="mx-auto mt-1 max-w-xl text-[15px] italic text-[#55617d]"
            style={{ fontFamily: FONT_BODY }}
          >
            A curated look back at the milestones and moments that brought you here.
          </p>
        </header>

        <div className="relative flex flex-1 items-center justify-center">
          {total > 1 && (
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous highlight"
              className="group absolute left-0 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#dce2f0] bg-white text-[#1e2942] shadow-xs transition hover:border-[#475b9b] hover:bg-[#f8faff] active:scale-95 md:flex"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </button>
          )}

          <div className="w-full max-w-5xl md:px-14">
            {loading ? (
              <div className="mx-auto grid max-w-4xl gap-6 rounded-2xl border border-[#e3e8f4] bg-white p-7 shadow-xs md:grid-cols-2">
                <div className="aspect-[16/10] animate-pulse rounded-xl bg-[#eef2f9]" />
                <div className="flex flex-col justify-center space-y-3">
                  <div className="h-3 w-20 animate-pulse rounded bg-[#eef2f9]" />
                  <div className="h-7 w-3/4 animate-pulse rounded bg-[#eef2f9]" />
                  <div className="h-4 w-full animate-pulse rounded bg-[#eef2f9]" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-[#eef2f9]" />
                </div>
              </div>
            ) : total === 0 ? (
              <div className="mx-auto max-w-lg rounded-2xl border border-[#e3e8f4] bg-white px-6 py-10 text-center shadow-xs">
                <p
                  className="text-[19px] text-[#182033]"
                  style={{ fontFamily: FONT_BODY }}
                >
                  No congratulations items have been published yet.
                </p>
                <p className="mt-1 text-[13px] text-[#64708c]">
                  Highlights will appear here once added.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={current._id}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  drag={total > 1 ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={(_e, { offset, velocity }) => {
                    if (offset.x < -50 || velocity.x < -500) {
                      go(1);
                    } else if (offset.x > 50 || velocity.x > 500) {
                      go(-1);
                    }
                  }}
                  className={`mx-auto flex w-full cursor-grab flex-col items-stretch gap-6 active:cursor-grabbing md:items-center md:gap-9 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* MEDIA CARD WITH HEADING BELOW */}
                  <div className="w-full max-w-xl shrink-0 md:w-[50%]">
                    <div className="overflow-hidden rounded-2xl border border-[#e2e7f3] bg-white p-3 shadow-[0_16px_38px_-22px_rgba(24,32,51,0.28)]">
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#f2f5fb]">
                        {current.mediaType === "video" ? (
                          <video
                            src={current.media}
                            controls
                            playsInline
                            preload="metadata"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <img
                            src={current.media}
                            alt={current.heading}
                            className="h-full w-full object-cover"
                          />
                        )}

                        <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md border border-[#e2e7f3] bg-white/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#334164] backdrop-blur-xs">
                          {current.mediaType === "video" ? (
                            <Video className="h-2.5 w-2.5 text-[#475b9b]" aria-hidden />
                          ) : (
                            <ImageIcon className="h-2.5 w-2.5 text-[#475b9b]" aria-hidden />
                          )}
                          {current.mediaType}
                        </span>
                      </div>

                      <div className="border-t border-[#eef2f9] px-3 pb-1.5 pt-3.5 text-center">
                        <h3
                          className="text-[26px] font-normal leading-tight text-[#161e31] sm:text-[30px]"
                          style={{ fontFamily: FONT_DISPLAY }}
                        >
                          {current.heading}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* DESCRIPTION CARD */}
                  <div className="w-full max-w-xl md:w-[50%]">
                    <div className="rounded-2xl border border-[#e2e7f3] bg-white p-7 shadow-[0_16px_38px_-24px_rgba(24,32,51,0.22)] sm:p-8">
                      <div className="flex items-center justify-between border-b border-[#eef2f9] pb-3.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#475b9b]">
                          Milestone {String(safeIndex + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[11px] font-medium tabular-nums text-[#74809b]">
                          {safeIndex + 1} of {total}
                        </span>
                      </div>

                      <p
                        className="mt-4 text-[17px] leading-[1.78] text-[#3f4a63] sm:text-[18.5px]"
                        style={{ fontFamily: FONT_BODY }}
                      >
                        {current.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {total > 1 && (
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next highlight"
              className="group absolute right-0 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#dce2f0] bg-white text-[#1e2942] shadow-xs transition hover:border-[#475b9b] hover:bg-[#f8faff] active:scale-95 md:flex"
            >
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>

        <footer className="flex flex-col items-center gap-3.5 border-t border-[#e2e7f3] pt-4 sm:flex-row sm:justify-between">
          {total > 1 ? (
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Highlight slides">
              {items.map((item, i) => (
                <button
                  key={item._id || i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`View highlight ${i + 1}`}
                  className={`relative h-1.5 overflow-hidden rounded-full transition-all duration-300 ${
                    i === safeIndex
                      ? "w-10 bg-[#dce3f4]"
                      : "w-2 bg-[#c7d1e8] hover:bg-[#a9b7d8]"
                  }`}
                >
                  {i === safeIndex && (
                    <motion.div
                      key={safeIndex}
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 15, ease: "linear" }}
                      className="absolute inset-y-0 left-0 bg-[#1e2d5a]"
                    />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="hidden sm:block" />
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onPrevious}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#d6ddec] bg-white px-5 text-[13px] font-semibold text-[#1e2942] transition hover:border-[#475b9b] hover:bg-[#f8faff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#475b9b] focus-visible:ring-offset-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={onNext}
              className="group inline-flex h-10 items-center gap-2 rounded-full bg-[#182447] px-6 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#243566] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#475b9b] focus-visible:ring-offset-2"
            >
              <span>Next</span>
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}