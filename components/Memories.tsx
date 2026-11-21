"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  animate,
  useMotionValue,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  RotateCcw,
  Sparkles,
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

const INK = "#4a3560";
const INK_SOFT = "#8a7a9b";
const ROSE = "#c4607f";

/** How many pixels of dragging equal one photo */
const STEP = 190;

/* 3D layout: how a card looks at distance d from the centre */
const DIST = [-3, -2, -1, 0, 1, 2, 3];
const X = ["-128%", "-102%", "-66%", "0%", "66%", "102%", "128%"];
const ROT = [55, 55, 50, 0, -50, -55, -55];
const Z = [-320, -240, -140, 0, -140, -240, -320];
const SCALE = [0.7, 0.8, 0.9, 1, 0.9, 0.8, 0.7];
const OPACITY = [0, 0.5, 0.85, 1, 0.85, 0.5, 0];

const mod = (n: number, m: number) => ((n % m) + m) % m;

function wrapDistance(raw: number, total: number, loop: boolean) {
  if (!loop) return raw;
  const r = mod(raw, total);
  return r > total / 2 ? r - total : r;
}

/* ------------------------------------------------------------------ */
/*  One photo / video card in the 3D album                             */
/* ------------------------------------------------------------------ */
function AlbumCard({
  item,
  index,
  total,
  loop,
  pos,
  isActive,
  isNear,
  onSelect,
}: {
  item: Memory;
  index: number;
  total: number;
  loop: boolean;
  pos: MotionValue<number>;
  isActive: boolean;
  isNear: boolean;
  onSelect: () => void;
}) {
  const d = useTransform(pos, (p) => wrapDistance(index - p, total, loop));
  const x = useTransform(d, DIST, X);
  const rotateY = useTransform(d, DIST, ROT);
  const z = useTransform(d, DIST, Z);
  const scale = useTransform(d, DIST, SCALE);
  const opacity = useTransform(d, DIST, OPACITY);
  const filter = useTransform(
    d,
    (v) => `brightness(${1 - Math.min(Math.abs(v), 2) * 0.09}) saturate(${1 - Math.min(Math.abs(v), 2) * 0.12})`
  );
  const zIndex = useTransform(d, (v) => Math.round(100 - Math.abs(v) * 10));
  const pointerEvents = useTransform(d, (v) => (Math.abs(v) > 2.6 ? "none" : "auto"));

  return (
    <motion.div
      onTap={() => {
        if (!isActive) onSelect();
      }}
      className="absolute inset-0 m-auto h-[min(87.5vw,425px)] w-[min(70vw,340px)]"
      style={{ x, rotateY, z, scale, opacity, filter, zIndex, pointerEvents }}
    >
      {/* white photo frame */}
      <div
        className="relative h-full w-full rounded-[22px] bg-white p-2.5"
        style={{
          boxShadow:
            "0 30px 60px -20px rgba(120,80,150,0.45), 0 0 0 1px rgba(255,255,255,0.8)",
        }}
      >
        <div
          className="relative h-full w-full overflow-hidden rounded-[14px]"
          style={{ background: "linear-gradient(145deg,#f9d9e4,#e1d8f8,#d5e6f9)" }}
        >
          {item.mediaType === "image" ? (
            <>
              {/* blurred copy fills the empty space so the full photo can be shown uncropped */}
              {isNear && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.media}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl"
                />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.media}
                alt={item.description}
                draggable={false}
                decoding="async"
                className="relative h-full w-full select-none object-contain"
              />
            </>
          ) : isNear ? (
            <video
              key={isActive ? "active" : "idle"}
              src={item.media}
              controls={isActive}
              muted={!isActive}
              playsInline
              preload="metadata"
              // lets people use the video controls without rolling the album
              onPointerDown={(e) => e.stopPropagation()}
              className={`relative h-full w-full object-contain ${isActive ? "" : "pointer-events-none"}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Video className="h-10 w-10 text-white/80" />
            </div>
          )}

          {/* glossy sheen */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent" />

          {item.mediaType === "video" && (
            <div
              className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium backdrop-blur"
              style={{ color: INK }}
            >
              <Video className="h-3.5 w-3.5" />
              Video
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function Memories({ gateToken, onNext, onPrevious, onRestart }: Props) {
  const [items, setItems] = useState<Memory[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [target, setTarget] = useState(0); // integer the album is rolling to
  const [hinted, setHinted] = useState(false);

  const pos = useMotionValue(0); // live (fractional) position while dragging
  const startPos = useRef(0);
  const anim = useRef<ReturnType<typeof animate> | null>(null);

  /* ---------- data ---------- */
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
        const data = ((json.data as Memory[]) ?? []).slice();
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
      "https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const list = items ?? [];
  const total = list.length;
  // with only a few photos a looping ring would show cards jumping, so it only loops for 7+
  const loop = total > 6;
  const active = total ? (loop ? mod(target, total) : Math.min(Math.max(target, 0), total - 1)) : 0;
  const current = total ? list[active] : null;

  /* ---------- rolling ---------- */
  const settle = useCallback(
    (t: number) => {
      const clamped = loop ? t : Math.min(Math.max(t, 0), Math.max(total - 1, 0));
      setTarget(clamped);
      anim.current?.stop();
      anim.current = animate(pos, clamped, {
        type: "spring",
        stiffness: 160,
        damping: 24,
        mass: 0.9,
      });
    },
    [loop, total, pos]
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      if (total < 2) return;
      setHinted(true);
      settle(target + dir);
    },
    [settle, target, total]
  );

  const rollTo = useCallback(
    (i: number) => {
      if (total < 2) return;
      let diff = i - active;
      if (loop) {
        diff = mod(diff, total);
        if (diff > total / 2) diff -= total;
      }
      settle(target + diff);
    },
    [active, loop, settle, target, total]
  );

  const onPanStart = () => {
    anim.current?.stop();
    startPos.current = pos.get();
    setHinted(true);
  };

  const onPan = (_: PointerEvent, info: PanInfo) => {
    let next = startPos.current - info.offset.x / STEP;
    if (!loop) {
      const max = total - 1;
      if (next < 0) next *= 0.3;
      else if (next > max) next = max + (next - max) * 0.3;
    }
    pos.set(next);
  };

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    const projected = pos.get() - (info.velocity.x / STEP) * 0.2;
    settle(Math.round(projected));
  };

  /* keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const circDist = (i: number) => {
    const raw = Math.abs(i - active);
    return loop ? Math.min(raw, total - raw) : raw;
  };

  return (
    <div
      className="relative flex min-h-screen w-full flex-col overflow-x-hidden"
      style={{ background: "#fbf6fb", color: INK }}
    >
      {/* ---------------- soft background ---------------- */}
      <div
        className="fixed inset-0 z-0"
        style={{ background: "linear-gradient(165deg, #f8f1ff 0%, #fdeff4 50%, #eef5ff 100%)" }}
      />
      <motion.div
        aria-hidden
        className="fixed -left-[12%] top-[10%] z-0 h-[55vh] w-[50vw] rounded-full blur-[120px]"
        style={{ background: "#f9c6d6" }}
        animate={{ x: [0, 40, 0], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="fixed -right-[12%] top-[35%] z-0 h-[55vh] w-[50vw] rounded-full blur-[120px]"
        style={{ background: "#d5c8f5" }}
        animate={{ x: [0, -40, 0], opacity: [0.45, 0.65, 0.45] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <motion.div
        aria-hidden
        className="fixed -bottom-[15%] left-[25%] z-0 h-[45vh] w-[50vw] rounded-full blur-[120px]"
        style={{ background: "#c9e0f8" }}
        animate={{ x: [0, 30, 0], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 6 }}
      />

      {/* ---------------- content ---------------- */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-14 pt-12 sm:px-8 md:pt-16">
        <header className="mb-8 flex flex-col items-center text-center md:mb-10">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-1.5 text-sm backdrop-blur"
            style={{ color: INK_SOFT }}
          >
            <Sparkles className="h-4 w-4" style={{ color: ROSE }} />
            Memories
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="mt-5 text-4xl font-medium leading-[1.15] sm:text-5xl"
            style={{ fontFamily: "'Fraunces', Georgia, serif", color: INK }}
          >
            Things I keep close
          </motion.h2>
        </header>

        {items === null ? (
          <div className="mx-auto h-[min(87.5vw,425px)] w-[min(70vw,340px)] animate-pulse rounded-[22px] bg-white/60" />
        ) : error ? (
          <p className="text-center text-rose-500">{error}</p>
        ) : total === 0 ? (
          <p className="text-center" style={{ color: INK_SOFT }}>
            No memories added yet.
          </p>
        ) : (
          <>
            {/* ---------------- 3D album ---------------- */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <motion.div
                onPanStart={onPanStart}
                onPan={onPan}
                onPanEnd={onPanEnd}
                className="relative h-[calc(min(87.5vw,425px)_+_70px)] w-full cursor-grab select-none active:cursor-grabbing"
                style={{ perspective: 1300, touchAction: "pan-y" }}
              >
                <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
                  {list.map((m, i) => (
                    <AlbumCard
                      key={m._id}
                      item={m}
                      index={i}
                      total={total}
                      loop={loop}
                      pos={pos}
                      isActive={i === active}
                      isNear={circDist(i) <= 1}
                      onSelect={() => rollTo(i)}
                    />
                  ))}
                </div>
              </motion.div>

              {/* floor shadow */}
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-1 left-1/2 h-7 w-[55%] max-w-md -translate-x-1/2 rounded-full blur-2xl"
                style={{ background: "rgba(123,100,196,0.28)" }}
              />
            </motion.div>

            {/* ---------------- controls ---------------- */}
            <div className="mt-6 flex flex-col items-center gap-3">
              {total > 1 && (
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    disabled={!loop && active === 0}
                    aria-label="Previous memory"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/70 shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-40"
                    style={{ color: INK }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <span className="min-w-14 text-center text-sm tabular-nums" style={{ color: INK_SOFT }}>
                    {active + 1} / {total}
                  </span>

                  <button
                    type="button"
                    onClick={() => step(1)}
                    disabled={!loop && active === total - 1}
                    aria-label="Next memory"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/70 shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-40"
                    style={{ color: INK }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}

              {total > 1 && total <= 12 && (
                <div className="flex items-center gap-1.5">
                  {list.map((m, i) => (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => rollTo(i)}
                      aria-label={`Go to memory ${i + 1}`}
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: i === active ? 24 : 6,
                        background: i === active ? ROSE : "#e6cfdb",
                      }}
                    />
                  ))}
                </div>
              )}

              <AnimatePresence>
                {total > 1 && !hinted && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 1 }}
                    className="text-sm"
                    style={{ color: INK_SOFT }}
                  >
                    Drag or swipe to roll the album
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* ---------------- the note ---------------- */}
            <div className="mx-auto mt-8 w-full max-w-2xl">
              <AnimatePresence mode="wait">
                {current && current.description?.trim() && (
                  <motion.div
                    key={current._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="relative rounded-2xl border border-white/90 px-7 pb-7 pt-9 text-center"
                    style={{
                      background: "rgba(255,253,252,0.85)",
                      boxShadow: "0 24px 50px -25px rgba(120,80,150,0.35)",
                    }}
                  >
                    <span
                      aria-hidden
                      className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-2 rounded-[3px] opacity-90"
                      style={{
                        background:
                          "repeating-linear-gradient(45deg,#f9c6d6 0 8px,#fbd9e4 8px 16px)",
                        boxShadow: "0 2px 6px rgba(120,80,150,0.15)",
                      }}
                    />
                    <div className="max-h-52 overflow-y-auto">
                      <p
                        className="whitespace-pre-line text-[22px] leading-[1.45] sm:text-[26px]"
                        style={{ fontFamily: "'Caveat', cursive", color: INK }}
                      >
                        {current.description}
                      </p>
                    </div>
                    <Heart
                      className="mx-auto mt-4 h-4 w-4"
                      style={{ color: "#e9a9bd" }}
                      fill="currentColor"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* ---------------- page navigation ---------------- */}
        <nav className="mt-14 flex flex-wrap items-center justify-center gap-3">
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
    </div>
  );
}
