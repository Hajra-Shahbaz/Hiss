"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import {
  Sparkles,
  Heart,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Mic,
  Play,
  Pause,
  X,
  Star,
  Volume2,
  Lock,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  /** Optional: override the voice note file (default: /voice-note.mp3 in /public) */
  voiceNoteUrl?: string;
}

/* ---------- Edit these to personalise ---------- */
const SALUTATION = "Dear you,";
const SIGN_OFF = "I mean every word.";
const POSTMARK_LABEL = "FROM THE HEART";
const VOICE_NOTE_URL = "/voice.aac";

const INK = "#3f2b54";
const BODY = "#524163";
const INK_SOFT = "#867399";
const ROSE = "#d15880";
const ROSE_DEEP = "#b8436a";
const ROSE_SOFT = "#f6a9c0";
const LAV = "#9d82e3";
const GRAD = "linear-gradient(135deg, #ee82a7 0%, #9d82e3 100%)";

const FONT_SERIF = "'Fraunces', Georgia, serif";
const FONT_HAND = "'Caveat', cursive";

/* Floating decorations (deterministic so SSR and client match) */
const FLOATERS = [
  { left: "6%", size: 16, dur: 26, delay: 0, kind: "heart", color: "#f7b7cd" },
  { left: "16%", size: 12, dur: 32, delay: 6, kind: "star", color: "#f6d299" },
  { left: "27%", size: 20, dur: 29, delay: 12, kind: "heart", color: "#dfd0fa" },
  { left: "38%", size: 14, dur: 34, delay: 3, kind: "spark", color: "#c5eadc" },
  { left: "49%", size: 15, dur: 27, delay: 9, kind: "heart", color: "#f7b7cd" },
  { left: "61%", size: 12, dur: 31, delay: 15, kind: "star", color: "#f6d299" },
  { left: "72%", size: 18, dur: 28, delay: 5, kind: "heart", color: "#dfd0fa" },
  { left: "83%", size: 14, dur: 35, delay: 11, kind: "spark", color: "#c5eadc" },
  { left: "93%", size: 16, dur: 30, delay: 2, kind: "heart", color: "#f7b7cd" },
] as const;

function Floater({
  kind,
  size,
  color,
}: {
  kind: "heart" | "star" | "spark";
  size: number;
  color: string;
}) {
  const common = { width: size, height: size, color };
  if (kind === "heart")
    return <Heart style={common} fill="currentColor" strokeWidth={0} />;
  if (kind === "star")
    return <Star style={common} fill="currentColor" strokeWidth={0} />;
  return <Sparkles style={common} strokeWidth={2} />;
}

const WAVE = Array.from({ length: 42 }, (_, i) =>
  Math.round(
    12 +
      Math.abs(Math.sin(i * 1.25) * Math.cos(i * 0.52)) * 34 +
      (i % 5) * 2.5
  )
);

function fmt(t: number) {
  if (!isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Voice-note popup                                                   */
/* ------------------------------------------------------------------ */
function VoiceNoteModal({
  open,
  onClose,
  src,
  reduce,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  reduce: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);
  const [finished, setFinished] = useState(false);

  const progress = duration > 0 ? Math.min(current / duration, 1) : 0;

  /* reset + stop whenever the popup closes */
  useEffect(() => {
    if (open) return;
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setPlaying(false);
    setCurrent(0);
    setFinished(false);
    setFailed(false);
  }, [open]);

  /* scroll lock, Escape, initial focus */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  const toggle = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    try {
      if (a.paused) {
        if (finished) {
          a.currentTime = 0;
          setFinished(false);
        }
        await a.play();
      } else {
        a.pause();
      }
    } catch {
      setFailed(true);
    }
  }, [finished]);

  function seek(v: number) {
    const a = audioRef.current;
    if (!a || !duration) return;
    a.currentTime = v;
    setCurrent(v);
    setFinished(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* backdrop */}
          <div
            aria-hidden
            onClick={onClose}
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgba(252,220,234,0.62), rgba(75,52,102,0.52))",
              backdropFilter: "blur(12px)",
            }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vn-title"
            initial={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, y: 36, scale: 0.93, rotate: -1 }
            }
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 230, damping: 25 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[34px] border border-white/90 px-6 pb-8 pt-10 text-center sm:px-9"
            style={{
              background:
                "linear-gradient(168deg, #fffcfd 0%, #fff0f6 48%, #f3ecff 100%)",
              boxShadow:
                "0 44px 96px -28px rgba(120,60,120,0.55), 0 2px 0 rgba(255,255,255,0.95) inset",
            }}
          >
            {/* rising hearts while playing */}
            {!reduce && playing && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                {[12, 28, 46, 64, 80, 92].map((l, i) => (
                  <motion.span
                    key={l}
                    className="absolute bottom-0"
                    style={{
                      left: `${l}%`,
                      color: i % 2 ? "#e3d3fb" : "#f9bdd1",
                    }}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{
                      y: -340,
                      opacity: [0, 0.85, 0],
                      x: [0, i % 2 ? 12 : -12, 0],
                    }}
                    transition={{
                      duration: 4.5 + (i % 3),
                      repeat: Infinity,
                      delay: i * 0.65,
                      ease: "easeOut",
                    }}
                  >
                    <Heart
                      className="h-4 w-4"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  </motion.span>
                ))}
              </div>
            )}

            {/* soft corner glows */}
            <span
              aria-hidden
              className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full blur-3xl"
              style={{ background: "#ffd0e0", opacity: 0.65 }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full blur-3xl"
              style={{ background: "#dccdfb", opacity: 0.65 }}
            />

            {/* close */}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close voice note"
              className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white bg-white/85 shadow-sm transition hover:scale-105 hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[#f08fb0]/30"
              style={{ color: INK_SOFT }}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-10">
              {/* animated vinyl/heart badge */}
              <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
                {playing && !reduce && (
                  <motion.div
                    aria-hidden
                    className="absolute inset-0 rounded-full border border-dashed border-[#f08fb0]/60"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#ffe1ec] to-[#ece1ff] shadow-md">
                  <motion.span
                    animate={
                      reduce
                        ? undefined
                        : playing
                        ? { scale: [1, 1.2, 1] }
                        : { scale: [1, 1.08, 1] }
                    }
                    transition={{
                      duration: playing ? 1.1 : 2.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Heart
                      className="h-7 w-7"
                      style={{ color: ROSE }}
                      fill="currentColor"
                    />
                  </motion.span>
                </div>
              </div>

              <h3
                id="vn-title"
                className="text-2xl font-medium tracking-tight sm:text-[28px]"
                style={{ fontFamily: FONT_SERIF, color: INK }}
              >
                A little voice note
              </h3>
              <p
                className="mt-1 text-2xl leading-none"
                style={{ fontFamily: FONT_HAND, color: ROSE }}
              >
sakoun se sunain              </p>
              <p
                className="mx-auto mt-3.5 max-w-xs text-sm leading-relaxed"
                style={{ color: INK_SOFT }}
              >
                Take a breath, get comfy, maybe put your headphones on. I recorded
                this with a great courage, and too much drama.
              </p>

              {/* player card */}
              <div className="mt-6 rounded-[26px] border border-white bg-white/80 px-4 py-4 shadow-[0_16px_36px_-18px_rgba(140,80,140,0.45)] backdrop-blur-sm">
                <div className="flex items-center gap-3.5">
                  {/* play button */}
                  <div className="relative shrink-0">
                    {playing && !reduce && (
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 rounded-full"
                        style={{ background: ROSE_SOFT }}
                        animate={{ scale: [1, 1.5], opacity: [0.55, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={toggle}
                      disabled={failed}
                      aria-label={
                        playing
                          ? "Pause voice note"
                          : finished
                          ? "Play again"
                          : "Play voice note"
                      }
                      className="relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg shadow-[#c4607f]/35 transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#f08fb0]/35 active:scale-95 disabled:opacity-50"
                      style={{ background: GRAD }}
                    >
                      {finished && !playing ? (
                        <RotateCcw className="h-5 w-5" />
                      ) : playing ? (
                        <Pause className="h-5 w-5" fill="currentColor" />
                      ) : (
                        <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                      )}
                    </button>
                  </div>

                  {/* waveform + seek */}
                  <div className="min-w-0 flex-1">
                    <div className="relative h-12">
                      <div className="absolute inset-0 flex items-center justify-between gap-[2px]">
                        {WAVE.map((h, i) => {
                          const done = (i + 0.5) / WAVE.length <= progress;
                          return (
                            <motion.span
                              key={i}
                              className="block w-full max-w-[3.5px] rounded-full"
                              style={{
                                height: h,
                                background: done
                                  ? "linear-gradient(180deg, #ee82a7, #9d82e3)"
                                  : "#e7daf0",
                                transformOrigin: "center",
                              }}
                              animate={
                                playing && !reduce
                                  ? { scaleY: [1, 1.24, 0.88, 1] }
                                  : { scaleY: 1 }
                              }
                              transition={
                                playing && !reduce
                                  ? {
                                      duration: 0.85,
                                      repeat: Infinity,
                                      delay: (i % 8) * 0.07,
                                    }
                                  : { duration: 0.2 }
                              }
                            />
                          );
                        })}
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        step={0.1}
                        value={current}
                        onChange={(e) => seek(parseFloat(e.target.value))}
                        disabled={!duration || failed}
                        aria-label="Seek voice note"
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
                      />
                    </div>
                    <div
                      className="mt-1 flex items-center justify-between text-[11px] font-medium tabular-nums"
                      style={{ color: INK_SOFT }}
                    >
                      <span>{fmt(current)}</span>
                      <span className="inline-flex items-center gap-1 opacity-70">
                        <Volume2 className="h-3 w-3" />
                        {duration ? fmt(duration) : "--:--"}
                      </span>
                    </div>
                  </div>
                </div>

                <audio
                  ref={audioRef}
                  src={src}
                  preload="metadata"
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  onDurationChange={(e) => setDuration(e.currentTarget.duration)}
                  onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onEnded={() => {
                    setPlaying(false);
                    setFinished(true);
                  }}
                  onError={() => setFailed(true)}
                />
              </div>

              <div
                className="mt-4 flex min-h-[2.25rem] items-center justify-center"
                aria-live="polite"
              >
                {failed ? (
                  <p className="text-sm text-rose-500">
                    I couldn&apos;t load the voice note just now. Please close
                    this and try once more.
                  </p>
                ) : finished ? (
                  <p
                    className="text-2xl leading-none"
                    style={{ fontFamily: FONT_HAND, color: ROSE }}
                  >
                    I love you. Always have, always will.
                  </p>
                ) : (
                  <p
                    className="text-2xl leading-none"
                    style={{ fontFamily: FONT_HAND, color: INK_SOFT }}
                  >
                    {playing
                      ? "I'm right here with you…"
                      : "Press play whenever you're ready."}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white bg-white/85 px-5 py-2.5 text-sm font-medium shadow-sm transition hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[#f08fb0]/30 active:scale-95"
                style={{ color: INK }}
              >
                <Heart
                  className="h-4 w-4"
                  style={{ color: ROSE }}
                  fill="currentColor"
                />
                Back to the notes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Movable Note Card Deck                                             */
/* ------------------------------------------------------------------ */
function MovableNoteDeck({
  notes,
  activeIndex,
  readIds,
  onChangeIndex,
  reduceMotion,
}: {
  notes: SorryItem[];
  activeIndex: number;
  readIds: Set<string>;
  onChangeIndex: (nextIdx: number) => void;
  reduceMotion: boolean;
}) {
  const [exitDir, setExitDir] = useState<-1 | 1>(1);
  const total = notes.length;
  const current = notes[activeIndex];

  const goTo = useCallback(
    (nextIdx: number, dir?: -1 | 1) => {
      if (total <= 0) return;
      const clamped = Math.max(0, Math.min(total - 1, nextIdx));
      if (clamped === activeIndex) return;
      setExitDir(dir ?? (clamped > activeIndex ? 1 : -1));
      onChangeIndex(clamped);
    },
    [activeIndex, onChangeIndex, total]
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 70;
      if (info.offset.x < -threshold || info.velocity.x < -450) {
        if (activeIndex < total - 1) {
          goTo(activeIndex + 1, 1);
        }
      } else if (info.offset.x > threshold || info.velocity.x > 450) {
        if (activeIndex > 0) {
          goTo(activeIndex - 1, -1);
        }
      }
    },
    [activeIndex, goTo, total]
  );

  if (!current) return null;

  const canPrev = activeIndex > 0;
  const canNext = activeIndex < total - 1;
  const isCurrentRead = readIds.has(current._id);

  return (
    <div className="relative mx-auto w-full">
      {/* top deck status & dot progress */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/80 px-3.5 py-1 text-xs font-semibold shadow-xs backdrop-blur"
            style={{ color: INK }}
          >
            <span style={{ color: ROSE }}>Note {activeIndex + 1}</span>
            <span className="opacity-40">/</span>
            <span>{total}</span>
          </span>

          {isCurrentRead && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50/90 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200/80">
              <Check className="h-3 w-3" /> Read
            </span>
          )}
        </div>

        {/* clickable note pills / dots */}
        <div
          role="tablist"
          aria-label="Jump to a note"
          className="flex items-center gap-1.5"
        >
          {notes.map((item, idx) => {
            const isActive = idx === activeIndex;
            const seen = readIds.has(item._id);
            return (
              <button
                key={item._id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to note ${idx + 1} of ${total}`}
                onClick={() => goTo(idx)}
                className="h-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d15880]"
                style={{
                  width: isActive ? 22 : 10,
                  background: isActive
                    ? GRAD
                    : seen
                    ? "#e8b4c7"
                    : "#e6dcf2",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* stacked cards stage */}
      <div className="relative min-h-[370px] sm:min-h-[390px]">
        {/* background stacked cards (next 2 notes) */}
        {[2, 1].map((depth) => {
          const stackIdx = activeIndex + depth;
          if (stackIdx >= total) return null;
          return (
            <div
              key={notes[stackIdx]._id}
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 rounded-[30px] border border-white/85 transition-transform duration-300"
              style={{
                height: "100%",
                transform: `translateY(${depth * 11}px) scale(${
                  1 - depth * 0.032
                }) rotate(${depth % 2 === 0 ? "-1.2deg" : "1.2deg"})`,
                zIndex: 10 - depth,
                background:
                  depth === 1
                    ? "linear-gradient(180deg, #fff9fc 0%, #f9f0ff 100%)"
                    : "linear-gradient(180deg, #fff4f8 0%, #f3eaff 100%)",
                boxShadow: "0 20px 45px -24px rgba(140,80,140,0.25)",
              }}
            />
          );
        })}

        {/* active movable note card */}
        <AnimatePresence mode="popLayout" custom={exitDir}>
          <motion.div
            key={current._id}
            custom={exitDir}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.45}
            onDragEnd={handleDragEnd}
            whileDrag={{
              scale: 1.015,
              rotate: 1.5,
              cursor: "grabbing",
            }}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    x: exitDir * 60,
                    rotate: exitDir * 3,
                    scale: 0.97,
                  }
            }
            animate={{
              opacity: 1,
              x: 0,
              rotate: 0,
              scale: 1,
            }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : {
                    opacity: 0,
                    x: exitDir * -150,
                    rotate: exitDir * -6,
                    scale: 0.95,
                  }
            }
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 24,
            }}
            style={{
              zIndex: 20,
              touchAction: "pan-y",
              background:
                "linear-gradient(180deg, #fffefd 0%, #fff9fc 62%, #fcf8ff 100%)",
              boxShadow:
                "0 36px 84px -28px rgba(160,85,145,0.38), 0 2px 0 rgba(255,255,255,0.98) inset",
            }}
            className="relative cursor-grab overflow-hidden rounded-[30px] border border-white px-7 pb-10 pt-12 select-none sm:px-12 sm:pt-14 lg:px-16"
          >
            {/* translucent washi tape */}
            <span
              aria-hidden
              className="pointer-events-none absolute -top-3 left-7 z-20 h-6 w-20 -rotate-6 rounded-[3px] sm:left-12"
              style={{
                background:
                  "repeating-linear-gradient(45deg, rgba(251,201,218,0.9) 0 8px, rgba(253,224,234,0.9) 8px 16px)",
                boxShadow: "0 2px 6px rgba(150,90,150,0.14)",
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -top-3 right-7 z-20 h-6 w-20 rotate-6 rounded-[3px] sm:right-12"
              style={{
                background:
                  "repeating-linear-gradient(-45deg, rgba(217,204,247,0.9) 0 8px, rgba(233,225,251,0.9) 8px 16px)",
                boxShadow: "0 2px 6px rgba(150,90,150,0.14)",
              }}
            />

            {/* top scalloped edge */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-10 top-0 h-2 opacity-75"
              style={{
                background:
                  "radial-gradient(circle at 8px 0, #fbd2e0 7px, transparent 8px) 0 0 / 16px 8px repeat-x",
              }}
            />

            {/* mini postage stamp on first note */}
            {activeIndex === 0 && (
              <div
                aria-hidden
                className="pointer-events-none absolute right-6 top-6 hidden h-16 w-14 rotate-3 flex-col items-center justify-center rounded-[6px] border-2 border-dashed border-[#f1b2c8] bg-[#fff2f7] sm:flex"
              >
                <Heart
                  className="h-5 w-5"
                  style={{ color: ROSE }}
                  fill="currentColor"
                />
                <span
                  className="mt-0.5 text-[10px] font-semibold"
                  style={{ color: ROSE_DEEP, fontFamily: FONT_HAND }}
                >
                  with love
                </span>
              </div>
            )}

            {/* salutation on first card, gentle header on subsequent cards */}
            {activeIndex === 0 ? (
              <p
                className="text-3xl sm:text-[36px]"
                style={{ fontFamily: FONT_HAND, color: ROSE }}
              >
                {SALUTATION}
              </p>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#a792bd]">
                <Heart
                  className="h-3 w-3"
                  style={{ color: ROSE }}
                  fill="currentColor"
                  strokeWidth={0}
                />
                <span>{POSTMARK_LABEL}</span>
              </div>
            )}

            {/* note content */}
            <div className="mt-6">
              <p
                className={`whitespace-pre-line text-[17px] leading-[1.92] sm:text-[19px] ${
                  activeIndex === 0
                    ? "first-letter:float-left first-letter:mr-3.5 first-letter:mt-1 first-letter:text-[52px] first-letter:font-semibold first-letter:leading-[0.86] first-letter:text-[#d15880]"
                    : ""
                }`}
                style={{ fontFamily: FONT_SERIF, color: BODY }}
              >
                {current.note}
              </p>
            </div>

            {/* sign-off on the final card */}
            {activeIndex === total - 1 && (
              <div className="mt-10 flex flex-col items-end border-t border-[#f5e3ec] pt-6">
                <p
                  className="text-3xl sm:text-[34px]"
                  style={{ fontFamily: FONT_HAND, color: INK }}
                >
                  {SIGN_OFF}
                </p>
              </div>
            )}

            {/* subtle drag hint */}
            <div className="mt-8 flex items-center justify-between text-xs text-[#a592b8]">
              <span>Drag card or use arrows</span>
              <span className="inline-flex items-center gap-1">
                <Heart
                  className="h-3 w-3"
                  style={{ color: ROSE_SOFT }}
                  fill="currentColor"
                  strokeWidth={0}
                />
                {activeIndex + 1} of {total}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* previous / next note controls */}
      <div className="mt-7 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1, -1)}
          disabled={!canPrev}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/80 px-5 py-2.5 text-sm font-medium shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          style={{ color: INK }}
        >
          <ChevronLeft className="h-4 w-4" /> Previous note
        </button>

        <button
          type="button"
          onClick={() => goTo(activeIndex + 1, 1)}
          disabled={!canNext}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/90 px-6 py-2.5 text-sm font-semibold shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          style={{ color: canNext ? ROSE_DEEP : INK_SOFT }}
        >
          Next note <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function Sorry({
  gateToken,
  onNext,
  onPrevious,
  onRestart,
  voiceNoteUrl = VOICE_NOTE_URL,
}: Props) {
  const [items, setItems] = useState<SorryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [voiceOpen, setVoiceOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const reduceMotion = !!useReducedMotion();

  /* ---------- data ---------- */
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
        const data = ((json.data as SorryItem[]) ?? []).slice();
        data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setItems(data);
        setActiveIndex(0);
        if (data.length > 0) {
          setReadIds(new Set([data[0]._id]));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError("Network error. Check your connection and try again.");
        setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [gateToken]);

  /* mark whichever card is currently active as read */
  useEffect(() => {
    if (!items || items.length === 0) return;
    const current = items[activeIndex];
    if (!current) return;
    setReadIds((prev) => {
      if (prev.has(current._id)) return prev;
      const next = new Set(prev);
      next.add(current._id);
      return next;
    });
  }, [activeIndex, items]);

  /* ---------- fonts ---------- */
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const closeVoice = useCallback(() => {
    setVoiceOpen(false);
    setTimeout(() => triggerRef.current?.focus(), 50);
  }, []);

  const list = useMemo(() => items ?? [], [items]);
  const totalNotes = list.length;
  const readCount = useMemo(
    () => list.filter((n) => readIds.has(n._id)).length,
    [list, readIds]
  );

  /* Voice note is locked until every single note card has been read */
  const voiceUnlocked = totalNotes > 0 && readCount >= totalNotes;
  const readingProgress = totalNotes > 0 ? readCount / totalNotes : 0;

  return (
    <div
      className="relative flex min-h-screen w-full flex-col overflow-x-hidden selection:bg-[#fbd2e0] selection:text-[#3f2b54]"
      style={{ background: "#fff5f9", color: INK }}
    >
      {/* reading progress bar based on notes read */}
      <div
        aria-hidden
        className="fixed left-0 right-0 top-0 z-50 h-1 bg-white/40"
      >
        <motion.div
          className="h-full origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: readingProgress }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
          style={{
            background: "linear-gradient(90deg, #f6a9c0, #9d82e3)",
          }}
        />
      </div>

      {/* ---------------- ambient pastel background ---------------- */}
      <div
        aria-hidden
        className="fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(160deg, #fff1f6 0%, #fcf0ff 38%, #edf2ff 72%, #fff4eb 100%)",
        }}
      />
      {/* delicate polka dots */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 opacity-65"
        style={{
          backgroundImage:
            "radial-gradient(rgba(238,130,167,0.16) 1.5px, transparent 1.6px), radial-gradient(rgba(157,130,227,0.13) 1.3px, transparent 1.4px)",
          backgroundSize: "36px 36px, 36px 36px",
          backgroundPosition: "0 0, 18px 18px",
        }}
      />
      {/* blurry pastel blobs */}
      {[
        {
          c: "#ffc7da",
          cls: "-left-[14%] top-[2%] h-[52vh] w-[48vw]",
          dx: 40,
          d: 20,
          delay: 0,
        },
        {
          c: "#dccdfb",
          cls: "-right-[14%] top-[30%] h-[50vh] w-[46vw]",
          dx: -40,
          d: 24,
          delay: 2,
        },
        {
          c: "#ffe2c8",
          cls: "left-[20%] -bottom-[14%] h-[44vh] w-[48vw]",
          dx: 30,
          d: 26,
          delay: 4,
        },
        {
          c: "#cdeee3",
          cls: "-right-[8%] -bottom-[10%] h-[34vh] w-[34vw]",
          dx: -25,
          d: 28,
          delay: 6,
        },
      ].map((b, i) => (
        <motion.div
          key={i}
          aria-hidden
          className={`pointer-events-none fixed z-0 transform-gpu rounded-full blur-[115px] ${b.cls}`}
          style={{ background: b.c }}
          animate={
            reduceMotion
              ? undefined
              : { x: [0, b.dx, 0], opacity: [0.48, 0.72, 0.48] }
          }
          transition={{
            duration: b.d,
            repeat: Infinity,
            ease: "easeInOut",
            delay: b.delay,
          }}
        />
      ))}

      {/* slowly rising hearts, stars and sparkles */}
      {!reduceMotion &&
        FLOATERS.map((f, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="pointer-events-none fixed bottom-[-40px] z-0"
            style={{ left: f.left }}
            animate={{
              y: ["0vh", "-115vh"],
              x: [0, i % 2 ? 20 : -20, 0],
              rotate: [0, i % 2 ? 16 : -16, 0],
              opacity: [0, 0.8, 0.8, 0],
            }}
            transition={{
              duration: f.dur,
              repeat: Infinity,
              delay: f.delay,
              ease: "linear",
            }}
          >
            <Floater kind={f.kind} size={f.size} color={f.color} />
          </motion.span>
        ))}

      {/* ---------------- main container ---------------- */}
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-20 pt-12 sm:px-8 md:pt-16">
        {/* Header */}
        <header className="mb-10 flex flex-col items-center text-center md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/75 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] shadow-sm backdrop-blur-md"
            style={{ color: INK_SOFT }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: ROSE }} />
            <span>Notes From Me</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="mt-4 text-4xl font-medium leading-[1.12] tracking-tight sm:text-5xl"
            style={{ fontFamily: FONT_SERIF, color: INK }}
          >
            The parts I&apos;d take back
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-2 text-2xl sm:text-[26px]"
            style={{ fontFamily: FONT_HAND, color: ROSE }}
          >
            slide through each note to unlock my voice message
          </motion.p>
        </header>

        {/* ---------------- movable cards deck ---------------- */}
        {items === null ? (
          <div className="mx-auto w-full rounded-[30px] border border-white bg-white/75 p-10 shadow-sm backdrop-blur">
            <div className="h-6 w-32 animate-pulse rounded-full bg-[#f5dce5]" />
            <div className="mt-8 space-y-4">
              <div className="h-4 w-full animate-pulse rounded-full bg-[#f3eaf8]" />
              <div className="h-4 w-11/12 animate-pulse rounded-full bg-[#f3eaf8]" />
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-[#f3eaf8]" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200/80 bg-white/85 px-6 py-8 text-center shadow-sm backdrop-blur">
            <p className="font-medium text-rose-500">{error}</p>
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-3xl border border-white bg-white/80 px-6 py-10 text-center shadow-sm backdrop-blur">
            <p style={{ color: INK_SOFT }}>No notes added yet.</p>
          </div>
        ) : (
          <MovableNoteDeck
            notes={list}
            activeIndex={activeIndex}
            readIds={readIds}
            onChangeIndex={setActiveIndex}
            reduceMotion={reduceMotion}
          />
        )}

        {/* ---------------- voice note callout (locked until all read) ---------------- */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-12 flex flex-col items-center text-center"
        >
          {voiceUnlocked ? (
            <p
              className="text-2xl sm:text-[26px]"
              style={{ fontFamily: FONT_HAND, color: ROSE }}
            >
bura mat manna kisi chz ka 👉🏻👈🏻            </p>
          ) : (
            <p
              className="text-xl sm:text-2xl"
              style={{ fontFamily: FONT_HAND, color: INK_SOFT }}
            >
              read all {totalNotes > 0 ? totalNotes : ""} notes to unlock the
              voice note ({readCount}/{totalNotes})
            </p>
          )}

          <button
            ref={triggerRef}
            type="button"
            disabled={!voiceUnlocked}
            aria-disabled={!voiceUnlocked}
            onClick={() => {
              if (voiceUnlocked) setVoiceOpen(true);
            }}
            className={`group relative mt-3 inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 text-[15px] font-medium transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#f08fb0]/40 ${
              voiceUnlocked
                ? "cursor-pointer text-white shadow-[0_16px_34px_-10px_rgba(196,96,127,0.55)] hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:scale-95"
                : "cursor-not-allowed border border-white/80 bg-white/60 text-[#9683aa] opacity-70 shadow-xs backdrop-blur"
            }`}
            style={voiceUnlocked ? { background: GRAD } : undefined}
          >
            {voiceUnlocked && !reduceMotion && (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{ background: ROSE_SOFT }}
                animate={{ scale: [1, 1.2], opacity: [0.45, 0] }}
                transition={{
                  duration: 2.1,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            )}

            {voiceUnlocked ? (
              <Mic className="relative h-4 w-4" />
            ) : (
              <Lock className="relative h-4 w-4" />
            )}

            <span className="relative">
              {voiceUnlocked
                ? "Ab sunain Ap meri bat"
                : `Voice note locked (${readCount}/${totalNotes})`}
            </span>

            <Heart
              className={`relative h-4 w-4 transition-transform ${
                voiceUnlocked ? "group-hover:scale-125" : "opacity-50"
              }`}
              fill="currentColor"
              strokeWidth={0}
            />
          </button>
        </motion.div>

      </div>

      <VoiceNoteModal
        open={voiceOpen}
        onClose={closeVoice}
        src={voiceNoteUrl}
        reduce={reduceMotion}
      />
    </div>
  );
}