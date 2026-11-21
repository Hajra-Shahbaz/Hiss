"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  Sparkles,
  Heart,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Check,
} from "lucide-react";

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

/* ------------------------------------------------------------------ */
/*  Soft palette — each envelope cycles through one of these           */
/* ------------------------------------------------------------------ */
const PALETTES = [
  { body: "#fbdde6", back: "#f4c5d3", flap: "#f7d0dc", seal: "#c4607f" }, // rose
  { body: "#e6dffa", back: "#d4c9f2", flap: "#dcd2f6", seal: "#7b64c4" }, // lavender
  { body: "#dcebfa", back: "#c6dcf3", flap: "#d0e3f6", seal: "#5b8cc4" }, // sky
  { body: "#fee6d6", back: "#f9d2b9", flap: "#fcdcc8", seal: "#d08560" }, // peach
  { body: "#dbf1e5", back: "#c3e6d3", flap: "#cfecdc", seal: "#58a883" }, // mint
  { body: "#fcf1cf", back: "#f6e5ab", flap: "#f9ebbf", seal: "#c9a23e" }, // butter
];

const TILTS = [-3, 2, -1.5, 3, -2.5, 1.5];

const INK = "#4a3560"; // deep plum – main text
const INK_SOFT = "#8a7a9b"; // muted plum – secondary text

const pageIn: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};
const cardIn: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.94 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 180, damping: 20 },
  },
};

/* ------------------------------------------------------------------ */
/*  Envelope (used in both the grid and the opening animation)         */
/* ------------------------------------------------------------------ */
function Envelope({
  palette,
  emoji,
  open = false,
  read = false,
  hoverLift = false,
  children,
}: {
  palette: (typeof PALETTES)[number];
  emoji: string;
  open?: boolean;
  read?: boolean;
  hoverLift?: boolean;
  /** Content that sits inside the envelope (the peeking letter) */
  children?: React.ReactNode;
}) {
  return (
    <div
      className="relative aspect-[4/3] w-full"
      style={{
        perspective: 900,
        filter: "drop-shadow(0 18px 22px rgba(120, 90, 150, 0.22))",
      }}
    >
      {/* back of the envelope */}
      <div
        className="absolute inset-0 rounded-[10px]"
        style={{ background: palette.back }}
      />

      {/* letter that peeks out */}
      {children}

      {/* front pocket: left, right, bottom */}
      <div
        className="absolute inset-0 z-20 rounded-[10px]"
        style={{
          background: palette.body,
          clipPath: "polygon(0 0, 50% 56%, 100% 0, 100% 100%, 0 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background: "rgba(255,255,255,0.35)",
          clipPath: "polygon(0 100%, 50% 46%, 100% 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background: "rgba(0,0,0,0.035)",
          clipPath: "polygon(0 0, 50% 56%, 0 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background: "rgba(0,0,0,0.035)",
          clipPath: "polygon(100% 0, 50% 56%, 100% 100%)",
        }}
      />

      {/* top flap */}
      <motion.div
        className={`absolute inset-x-0 top-0 h-[58%] ${
          hoverLift ? "transition-transform duration-300 group-hover:[transform:rotateX(-22deg)]" : ""
        }`}
        style={{
          transformOrigin: "top",
          background: palette.flap,
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
          zIndex: open ? 5 : 30,
        }}
        animate={{ rotateX: open ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* wax seal */}
      <motion.div
        className="absolute left-1/2 top-[58%] z-40 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-lg sm:h-12 sm:w-12 sm:text-xl"
        style={{
          background: `radial-gradient(circle at 30% 28%, ${palette.seal}cc, ${palette.seal})`,
          boxShadow: "inset 0 -3px 5px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.18)",
        }}
        animate={{ opacity: open ? 0 : 1, scale: open ? 0.6 : 1 }}
        transition={{ duration: 0.25 }}
      >
        {read ? <Check className="h-5 w-5 text-white/90" /> : <span className="drop-shadow">{emoji}</span>}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function Promises({ gateToken, onNext, onPrevious, onRestart }: Props) {
  const [items, setItems] = useState<PromiseItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [index, setIndex] = useState<number | null>(null);
  const [stage, setStage] = useState<0 | 1 | 2>(0); // 0 closed · 1 flap open · 2 letter
  const [opened, setOpened] = useState<Set<string>>(new Set());

  const reduceMotion = useReducedMotion();
  const timers = useRef<number[]>([]);

  const list = items ?? [];
  const selected = index !== null ? list[index] : null;

  /* ---------- data ---------- */
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
        const data = ((json.data as PromiseItem[]) ?? []).slice();
        data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setItems(data);
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

  /* ---------- fonts ---------- */
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  /* ---------- open / close ---------- */
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const openAt = useCallback(
    (i: number, withAnimation: boolean) => {
      clearTimers();
      setIndex(i);
      const id = items?.[i]?._id;
      if (id) setOpened((prev) => new Set(prev).add(id));

      if (!withAnimation || reduceMotion) {
        setStage(2);
        return;
      }
      setStage(0);
      timers.current.push(
        window.setTimeout(() => setStage(1), 450),
        window.setTimeout(() => setStage(2), 1450)
      );
    },
    [items, reduceMotion]
  );

  const close = useCallback(() => {
    clearTimers();
    setIndex(null);
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (index === null || list.length === 0) return;
      openAt((index + dir + list.length) % list.length, false);
    },
    [index, list.length, openAt]
  );

  useEffect(() => () => clearTimers(), []);

  /* keyboard + scroll lock while a promise is open */
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, close, go]);

  const palette = (i: number) => PALETTES[i % PALETTES.length];

  return (
    <div
      className="relative flex min-h-screen w-full flex-col overflow-x-hidden"
      style={{ background: "#fbf6fb", color: INK }}
    >
      {/* ---------------- soft background ---------------- */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(160deg, #f7f0ff 0%, #fdeff4 45%, #eef5ff 100%)",
        }}
      />
      <motion.div
        aria-hidden
        className="fixed -left-[10%] -top-[10%] z-0 h-[55vh] w-[55vw] rounded-full blur-[120px]"
        style={{ background: "#f9c6d6" }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0], opacity: [0.55, 0.75, 0.55] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="fixed -right-[10%] top-[20%] z-0 h-[50vh] w-[50vw] rounded-full blur-[120px]"
        style={{ background: "#d5c8f5" }}
        animate={{ x: [0, -40, 0], y: [0, 40, 0], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <motion.div
        aria-hidden
        className="fixed -bottom-[15%] left-[20%] z-0 h-[45vh] w-[50vw] rounded-full blur-[120px]"
        style={{ background: "#c9e0f8" }}
        animate={{ x: [0, 30, 0], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 6 }}
      />

      {/* ---------------- content ---------------- */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 pt-14 sm:px-8 md:pt-20">
        <header className="mb-12 flex flex-col items-center text-center md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-1.5 text-sm backdrop-blur"
            style={{ color: INK_SOFT }}
          >
            <Sparkles className="h-4 w-4" style={{ color: "#c4607f" }} />
            Promises
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="mt-6 max-w-2xl text-4xl font-medium leading-[1.15] sm:text-5xl md:text-6xl"
            style={{ fontFamily: "'Fraunces', Georgia, serif", color: INK }}
          >
            Things I mean with my whole chest
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-base"
            style={{ color: INK_SOFT }}
          >
            Pick an envelope. Each one holds a promise.
          </motion.p>

          {list.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 flex w-56 flex-col items-center gap-2"
            >
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/70">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg,#f09db5,#a995e6)" }}
                  animate={{ width: `${(opened.size / list.length) * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
              <span className="text-xs" style={{ color: INK_SOFT }}>
                {opened.size} of {list.length} opened
              </span>
            </motion.div>
          )}
        </header>

        {/* ---------------- states ---------------- */}
        {items === null ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:gap-10 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] animate-pulse rounded-xl bg-white/60"
              />
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-rose-500">{error}</p>
        ) : list.length === 0 ? (
          <p className="text-center" style={{ color: INK_SOFT }}>
            No promises added yet.
          </p>
        ) : (
          <motion.div
            variants={pageIn}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:gap-x-10 md:gap-y-14 lg:grid-cols-4"
          >
            {list.map((p, i) => (
              <motion.button
                key={p._id}
                variants={cardIn}
                type="button"
                onClick={() => openAt(i, true)}
                aria-label={`Open promise ${i + 1} of ${list.length}`}
                className="group relative mx-auto w-full max-w-[250px] cursor-pointer rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-[#c4607f]/60 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
                style={{ rotate: TILTS[i % TILTS.length] }}
                whileHover={{ y: -8, rotate: 0, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Envelope
                  palette={palette(i)}
                  emoji={p.emoji}
                  read={opened.has(p._id)}
                  hoverLift
                />
                <span
                  className="pointer-events-none absolute bottom-2.5 left-4 z-40 text-lg"
                  style={{ fontFamily: "'Caveat', cursive", color: INK_SOFT }}
                >
                  {opened.has(p._id) ? "read" : "for you"}
                </span>
                <Heart
                  className="pointer-events-none absolute bottom-3 right-4 z-40 h-4 w-4"
                  style={{ color: palette(i).seal, opacity: 0.7 }}
                  fill="currentColor"
                />
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* ---------------- page navigation ---------------- */}
        <nav className="mt-20 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onPrevious}
            className="flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-5 py-2.5 text-sm backdrop-blur transition hover:bg-white"
            style={{ color: INK }}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-5 py-2.5 text-sm backdrop-blur transition hover:bg-white"
            style={{ color: INK_SOFT }}
          >
            <RotateCcw className="h-4 w-4" /> Start over
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#c4607f]/25 transition hover:brightness-105"
            style={{ background: "linear-gradient(135deg,#e0829f,#9d86e0)" }}
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </nav>
      </div>

      {/* ---------------- opened promise overlay ---------------- */}
      <AnimatePresence>
        {selected && index !== null && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={selected.heading}
          >
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-[#4a3560]/25 backdrop-blur-md"
              onClick={close}
            />

            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur transition hover:bg-white sm:right-8 sm:top-8"
              style={{ color: INK }}
            >
              <X className="h-5 w-5" />
            </button>

            <AnimatePresence mode="wait">
              {stage < 2 ? (
                /* ---- envelope opening scene ---- */
                <motion.div
                  key={`env-${selected._id}`}
                  className="relative z-10 w-[min(86vw,420px)]"
                  initial={{ opacity: 0, scale: 0.8, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 60 }}
                  transition={{ type: "spring", stiffness: 160, damping: 18 }}
                >
                  <Envelope
                    palette={palette(index)}
                    emoji={selected.emoji}
                    open={stage === 1}
                  >
                    <motion.div
                      className="absolute inset-x-[7%] top-[6%] z-10 h-[88%] rounded-md bg-[#fffdfb] shadow-md"
                      initial={{ y: 0 }}
                      animate={{ y: stage === 1 ? "-42%" : 0 }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
                    >
                      <div className="mx-auto mt-6 h-1.5 w-1/2 rounded-full bg-[#f3dce5]" />
                      <div className="mx-auto mt-3 h-1.5 w-2/3 rounded-full bg-[#f3dce5]" />
                      <div className="mx-auto mt-3 h-1.5 w-1/3 rounded-full bg-[#f3dce5]" />
                    </motion.div>
                  </Envelope>
                </motion.div>
              ) : (
                /* ---- the letter ---- */
                <motion.div
                  key={`letter-${selected._id}`}
                  className="relative z-10 flex w-full max-w-2xl flex-col items-center"
                  initial={{ opacity: 0, y: 50, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: "spring", stiffness: 150, damping: 20 }}
                >
                  <div
                    className="relative max-h-[78vh] w-full overflow-y-auto rounded-2xl border border-white/80 px-7 py-10 shadow-[0_30px_80px_-20px_rgba(120,80,150,0.45)] sm:px-14 sm:py-14"
                    style={{
                      background:
                        "repeating-linear-gradient(to bottom, transparent 0, transparent 39px, rgba(240,157,181,0.18) 39px, rgba(240,157,181,0.18) 40px), #fffdfc",
                    }}
                  >
                    {/* soft accent strip in the palette colour */}
                    <div
                      className="absolute inset-x-0 top-0 h-2 rounded-t-2xl"
                      style={{
                        background: `linear-gradient(90deg, ${palette(index).back}, ${palette(index).seal}88, ${palette(index).back})`,
                      }}
                    />

                    <div className="flex flex-col items-center text-center">
                      <motion.span
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 }}
                        className="flex h-16 w-16 items-center justify-center rounded-full text-4xl"
                        style={{ background: palette(index).body }}
                      >
                        {selected.emoji}
                      </motion.span>

                      <h3
                        className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl"
                        style={{ fontFamily: "'Fraunces', Georgia, serif", color: INK }}
                      >
                        {selected.heading}
                      </h3>

                      <div className="my-6 flex items-center gap-3">
                        <span className="h-px w-12 bg-[#e8c9d6]" />
                        <Heart className="h-4 w-4" style={{ color: palette(index).seal }} fill="currentColor" />
                        <span className="h-px w-12 bg-[#e8c9d6]" />
                      </div>

                      <p
                        className="whitespace-pre-line text-[22px] leading-[40px] sm:text-[26px]"
                        style={{ fontFamily: "'Caveat', cursive", color: INK }}
                      >
                        {selected.detail}
                      </p>
                    </div>

                    {/* optional sticker – hides itself if the image is missing */}
                    <motion.img
                      src={`/welcome${(index % 6) + 1}`}
                      alt=""
                      initial={{ opacity: 0, scale: 0, rotate: -20 }}
                      animate={{ opacity: 1, scale: 1, rotate: 8 }}
                      transition={{ delay: 0.45, type: "spring", stiffness: 200 }}
                      className="pointer-events-none absolute right-3 top-5 h-20 w-20 object-contain drop-shadow-lg sm:right-6 sm:h-28 sm:w-28"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  {/* previous / next promise */}
                  {list.length > 1 && (
                    <div className="mt-6 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => go(-1)}
                        aria-label="Previous promise"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 shadow-md transition hover:bg-white"
                        style={{ color: INK }}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <span className="min-w-16 text-center text-sm" style={{ color: "#fff", textShadow: "0 1px 6px rgba(74,53,96,0.5)" }}>
                        {index + 1} / {list.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => go(1)}
                        aria-label="Next promise"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 shadow-md transition hover:bg-white"
                        style={{ color: INK }}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
