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



const STAR = "M12 2.5 L14.7 9 L21.8 9.6 L16.4 14.2 L18.1 21.2 L12 17.4 L5.9 21.2 L7.6 14.2 L2.2 9.6 L9.3 9 Z";
const HEART =
  "M12 20.5 C5.5 15.2 2.5 11.5 2.5 8 C2.5 4.6 6.8 3.2 9.2 5.3 C10.5 6.4 11.4 7.3 12 8.4 C12.6 7.3 13.5 6.4 14.8 5.3 C17.2 3.2 21.5 4.6 21.5 8 C21.5 11.5 18.5 15.2 12 20.5 Z";



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
      "https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600&display=swap";
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
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-6 pt-6 sm:px-8 md:pt-8">
        <header className="mb-3 flex flex-col items-center text-center md:mb-4">
       
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="mt-3 text-4xl font-medium leading-[1.15] sm:text-5xl"
            style={{ fontFamily: "'Fraunces', Georgia, serif", color: INK }}
          >
            Things I keep close
          </motion.h2>

          {/* doodle underline */}
          <motion.svg
            aria-hidden
            viewBox="0 0 180 14"
            fill="none"
            className="mt-1 h-3 w-40sm:w-48"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
          >
            <motion.path
              d="M3 8 C30 2 55 12 90 6 S150 3 177 8"
              stroke={ROSE}
              strokeWidth="2.2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
            />
          </motion.svg>
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
              className="relative 
               "
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

         
            {/* ---------------- the note (always shown in full) ---------------- */}
            <div className="mx-auto mt-1 w-full max-w-2xl">
              <AnimatePresence mode="wait">
                {current && current.description?.trim() && (
                  <motion.div
                    key={current._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="relative rounded-2xl border border-white/90 px-6 pb-5 pt-8 text-center"
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

                    {/* little doodles on the note */}
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#e0829f"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="pointer-events-none absolute -bottom-3 -right-2 h-7 w-7 rotate-12"
                    >
                      <path d={STAR} />
                    </svg>
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9d86e0"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="pointer-events-none absolute -left-2 -top-2 h-6 w-6 -rotate-12"
                    >
                      <path d={HEART} />
                    </svg>

                    {/* full note, no scroll box, nothing cut off */}
                    <p
                      className="whitespace-pre-line break-words text-[20px] leading-[1.55] sm:text-[24px]"
                      style={{
                        fontFamily: "'Kalam', 'Segoe Print', cursive",
                        fontWeight: 400,
                        color: INK,
                        letterSpacing: "0.01em",
                      }}
                    >
                      {current.description}
                    </p>
                    <Heart
                      className="mx-auto mt-2 h-4 w-4"
                      style={{ color: "#e9a9bd" }}
                      fill="currentColor"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}


      </div>
    </div>
  );
}