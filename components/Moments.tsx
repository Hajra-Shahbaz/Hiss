"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Heart,
  ImageIcon,
  Play,
  RotateCcw,
  Sparkles,
  Video,
  Volume2,
  VolumeX,
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

const INK = "#43305c";
const INK_SOFT = "#85759a";
const ROSE = "#e0829f";
const LAV = "#9d86e0";
const SKY = "#7fb3e8";
const PEACH = "#f4b183";
const MINT = "#7fcfb0";
const GRAD = "linear-gradient(135deg,#e0829f,#9d86e0)";

const SIDE_TAGS = [
  "core memory",
  "favorite frame",
  "kept forever",
  "soft spot",
];

const SIDE_SUBLINES = [
  "golden hour energy",
  "worth replaying twice",
  "tiny piece of magic",
  "always brings a smile",
];

/* ------------------------------------------------------------------ */
/*  Doodles — hand-drawn shapes that draw themselves when scrolled in  */
/* ------------------------------------------------------------------ */
type DoodleKind =
  | "heart"
  | "star"
  | "sparkle"
  | "squiggle"
  | "arrow"
  | "flower"
  | "loop"
  | "ribbon"
  | "butterfly";

const PATHS: Record<DoodleKind, { d: string[]; closed?: boolean }> = {
  heart: {
    d: ["M32 54C10 38 6 24 14 15C21 8 30 12 32 20C34 12 43 8 50 15C58 24 54 38 32 54Z"],
    closed: true,
  },
  star: {
    d: ["M32 6L39 24L58 25L43 37L48 56L32 45L16 56L21 37L6 25L25 24Z"],
    closed: true,
  },
  sparkle: {
    d: ["M32 6C34 22 42 30 58 32C42 34 34 42 32 58C30 42 22 34 6 32C22 30 30 22 32 6Z"],
    closed: true,
  },
  squiggle: { d: ["M4 36C12 18 20 18 26 34C32 50 40 50 46 32C50 22 56 22 60 28"] },
  arrow: { d: ["M6 52C16 22 38 14 56 18", "M45 7L57 18L43 27"] },
  loop: { d: ["M4 42C18 8 42 10 38 28C34 44 14 34 26 24C38 14 54 28 60 12"] },
  ribbon: {
    d: [
      "M22 32C12 20 6 24 8 32C10 40 16 40 22 32Z",
      "M42 32C52 20 58 24 56 32C54 40 48 40 42 32Z",
      "M22 32C26 28 38 28 42 32C38 36 26 36 22 32Z",
      "M27 36L20 50M37 36L44 50",
    ],
    closed: true,
  },
  butterfly: {
    d: [
      "M32 22C22 10 8 14 12 28C14 34 24 34 32 32",
      "M32 22C42 10 56 14 52 28C50 34 40 34 32 32",
      "M32 32C20 34 14 44 22 50C27 53 31 44 32 32",
      "M32 32C44 34 50 44 42 50C37 53 33 44 32 32",
      "M32 18V48",
    ],
  },
  flower: { d: [], closed: true },
};

function Doodle({
  kind,
  color,
  className = "",
  delay = 0,
  float = true,
  rotate = 0,
}: {
  kind: DoodleKind;
  color: string;
  className?: string;
  delay?: number;
  float?: boolean;
  rotate?: number;
}) {
  const reduce = useReducedMotion();
  const spec = PATHS[kind];
  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    show: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.1, delay, ease: "easeInOut" as const },
    },
  };

  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 64 64"
      fill="none"
      className={`pointer-events-none absolute z-20 ${className}`}
      style={{ color, rotate }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      animate={reduce || !float ? undefined : { y: [0, -5, 0] }}
      transition={{ duration: 4 + delay * 2, repeat: Infinity, ease: "easeInOut" }}
    >
      {kind === "flower" ? (
        <>
          {[0, 72, 144, 216, 288].map((a) => (
            <motion.path
              key={a}
              d="M32 27C22 12 36 3 32 27Z"
              transform={`rotate(${a} 32 32)`}
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="currentColor"
              fillOpacity={0.18}
              variants={pathVariants}
            />
          ))}
          <motion.circle
            cx="32"
            cy="32"
            r="4.5"
            stroke="currentColor"
            strokeWidth="2.6"
            fill="currentColor"
            fillOpacity={0.35}
            variants={pathVariants}
          />
        </>
      ) : (
        spec.d.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={spec.closed ? "currentColor" : "none"}
            fillOpacity={spec.closed ? 0.16 : 0}
            variants={pathVariants}
          />
        ))
      )}
    </motion.svg>
  );
}

const PALETTES: [string, string, string][] = [
  [ROSE, LAV, SKY],
  [LAV, PEACH, ROSE],
  [SKY, MINT, LAV],
  [PEACH, ROSE, MINT],
];

/* ------------------------------------------------------------------ */
/*  Cute side charm card                                               */
/* ------------------------------------------------------------------ */
function SideCharm({
  label,
  subline,
  accent,
  align,
}: {
  label: string;
  subline: string;
  accent: string;
  align: "left" | "right";
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none hidden flex-col gap-2.5 xl:flex ${
        align === "left" ? "items-start" : "items-end"
      }`}
    >
      <div
        className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/80 px-3.5 py-1 text-[11px] font-medium shadow-sm backdrop-blur"
        style={{
          color: INK,
          transform: align === "left" ? "rotate(-3deg)" : "rotate(3deg)",
        }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <span>{label}</span>
      </div>

      <div
        className="flex flex-col gap-1 rounded-2xl border border-white/85 bg-white/70 px-3.5 py-2.5 text-left shadow-sm backdrop-blur"
        style={{
          transform: align === "left" ? "rotate(2deg)" : "rotate(-2deg)",
        }}
      >
        <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: INK }}>
          <Camera className="h-3.5 w-3.5" style={{ color: accent }} />
          <span>{subline}</span>
        </div>
        <div className="mt-1 flex items-center gap-1">
          {[0, 1, 2, 3].map((dot) => (
            <span
              key={dot}
              className="h-1.5 w-4 rounded-full opacity-70"
              style={{ backgroundColor: dot % 2 === 0 ? accent : LAV }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reel — wider horizontal player that autoplays when in view         */
/* ------------------------------------------------------------------ */
function Reel({
  m,
  soundOn,
  setSoundOn,
}: {
  m: Moment;
  soundOn: boolean;
  setSoundOn: (v: boolean) => void;
}) {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef(soundOn);
  const userPaused = useRef(false);
  const lastTap = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [near, setNear] = useState(false);
  const [portrait, setPortrait] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);

  const isVideo = m.mediaType === "video";

  useEffect(() => {
    soundRef.current = soundOn;
    if (videoRef.current) videoRef.current.muted = !soundOn;
  }, [soundOn]);

  const tryPlay = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.muted = !soundRef.current;
      await v.play();
    } catch {
      v.muted = true;
      setSoundOn(false);
      try {
        await v.play();
      } catch {
        /* needs a tap */
      }
    }
  }, [setSoundOn]);

  useEffect(() => {
    if (!isVideo) return;
    const el = wrapRef.current;
    if (!el) return;

    const playObs = new IntersectionObserver(
      ([e]) => {
        const v = videoRef.current;
        if (!v) return;
        if (e.isIntersecting && e.intersectionRatio >= 0.6) {
          if (!reduce && !userPaused.current) tryPlay();
        } else {
          v.pause();
          userPaused.current = false;
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    const nearObs = new IntersectionObserver(([e]) => setNear(e.isIntersecting), {
      rootMargin: "100% 0px",
    });
    playObs.observe(el);
    nearObs.observe(el);
    return () => {
      playObs.disconnect();
      nearObs.disconnect();
    };
  }, [isVideo, reduce, tryPlay]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      tryPlay();
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  const burst = (clientX: number, clientY: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const id = Date.now() + Math.random();
    setBursts((b) => [...b, { id, x: clientX - rect.left, y: clientY - rect.top }]);
    setLiked(true);
    setTimeout(() => setBursts((b) => b.filter((h) => h.id !== id)), 900);
  };

  const onSurfaceClick = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      lastTap.current = 0;
      burst(e.clientX, e.clientY);
      return;
    }
    lastTap.current = now;
    if (isVideo) {
      tapTimer.current = setTimeout(toggle, 260);
    }
  };

  useEffect(
    () => () => {
      if (tapTimer.current) clearTimeout(tapTimer.current);
    },
    []
  );

  const iconBtn =
    "flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md transition active:scale-90 hover:bg-black/45";

  return (
    <div
      className="relative rounded-[30px] bg-white p-2.5 sm:p-3"
      style={{
        width: "var(--rw)",
        boxShadow:
          "0 34px 60px -26px rgba(100,70,140,0.55), 0 0 0 1px rgba(255,255,255,0.9)",
      }}
    >
      <div
        ref={wrapRef}
        onClick={onSurfaceClick}
        className="relative aspect-[4/5] w-full cursor-pointer select-none overflow-hidden rounded-[22px]"
        style={{ background: "linear-gradient(160deg,#f9d9e4,#e1d8f8,#d5e6f9)" }}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={m.media}
            loop
            muted={!soundOn}
            playsInline
            preload={near ? "auto" : "metadata"}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              setPortrait(v.videoHeight >= v.videoWidth * 0.9);
            }}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (barRef.current && v.duration)
                barRef.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
            }}
            className={`absolute inset-0 h-full w-full ${portrait ? "object-cover" : "object-contain"}`}
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.media}
              alt=""
              aria-hidden
              draggable={false}
              className="absolute inset-0 h-full w-full scale-125 object-cover opacity-70 blur-2xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.media}
              alt={m.heading}
              draggable={false}
              decoding="async"
              loading="lazy"
              className="relative h-full w-full object-contain"
            />
          </>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/35 to-transparent" />

        <div
          className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium backdrop-blur"
          style={{ color: INK }}
        >
          {isVideo ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
          {isVideo ? "Reel" : "Photo"}
        </div>

        <AnimatePresence>
          {isVideo && !playing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow-xl backdrop-blur">
                <Play className="ml-1 h-7 w-7" style={{ color: ROSE }} fill="currentColor" />
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="absolute bottom-4 right-3 flex flex-col gap-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label={liked ? "Unlike" : "Like"}
            onClick={() => setLiked((l) => !l)}
            className={iconBtn}
          >
            <motion.span
              key={String(liked)}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 14 }}
            >
              <Heart
                className="h-5 w-5"
                fill={liked ? "#ff6f9b" : "none"}
                stroke={liked ? "#ff6f9b" : "white"}
              />
            </motion.span>
          </button>
          {isVideo && (
            <button
              type="button"
              aria-label={soundOn ? "Mute" : "Unmute"}
              onClick={() => setSoundOn(!soundOn)}
              className={iconBtn}
            >
              {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
          )}
        </div>

        {bursts.map((h) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 1, scale: 0.4, y: 0 }}
            animate={{ opacity: 0, scale: 1.6, y: -70 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            className="pointer-events-none absolute"
            style={{ left: h.x - 28, top: h.y - 28 }}
          >
            <Heart
              className="h-14 w-14 drop-shadow-lg"
              fill="#ff6f9b"
              stroke="white"
              strokeWidth={1.5}
            />
          </motion.div>
        ))}

        {isVideo && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
            <div
              ref={barRef}
              className="h-full origin-left"
              style={{
                background: GRAD,
                transform: "scaleX(0)",
                transition: "transform 0.25s linear",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The note — full note with zero truncation or extra whitespace       */
/* ------------------------------------------------------------------ */
function NoteCard({
  m,
  index,
  total,
  flip,
  palette,
}: {
  m: Moment;
  index: number;
  total: number;
  flip: boolean;
  palette: [string, string, string];
}) {
  const tilt = flip ? 1.2 : -1.2;
  const cleanNote = m.note?.trim() ?? "";

  return (
    <div className="relative mx-auto w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 24, rotate: tilt * 2 }}
        whileInView={{ opacity: 1, y: 0, rotate: tilt }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.1 }}
        className="relative rounded-[22px] px-6 pb-6 pt-8 text-center sm:px-8 sm:pb-7 sm:pt-9 md:text-left"
        style={{
          background:
            "linear-gradient(180deg,rgba(255,254,252,0.97),rgba(255,247,250,0.93))",
          border: "1px solid rgba(255,255,255,0.95)",
          boxShadow:
            "0 30px 60px -28px rgba(110,70,150,0.45), 0 2px 0 rgba(255,255,255,0.8) inset",
        }}
      >
        <span
          aria-hidden
          className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rounded-[3px] md:left-10 md:translate-x-0"
          style={{
            rotate: flip ? "3deg" : "-3deg",
            background: `repeating-linear-gradient(45deg,${palette[0]}66 0 7px,${palette[0]}33 7px 14px)`,
            boxShadow: "0 2px 6px rgba(120,80,150,0.18)",
          }}
        />

        <h3
          className="text-2xl font-medium leading-snug tracking-tight sm:text-[28px]"
          style={{ fontFamily: "'Fraunces', Georgia, serif", color: INK }}
        >
          {m.heading}
        </h3>

        <svg
          aria-hidden
          viewBox="0 0 120 10"
          className="mx-auto mt-1 h-2.5 w-24 md:mx-0"
          fill="none"
        >
          <motion.path
            d="M2 6C15 1 25 9 38 5C52 1 62 9 76 5C90 1 100 8 118 4"
            stroke={palette[0]}
            strokeWidth="2.6"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.5, ease: "easeInOut" }}
          />
        </svg>

        {cleanNote && (
          <p
            className="mt-2.5 whitespace-pre-line break-words text-[22px] leading-[1.38] sm:text-[26px]"
            style={{ fontFamily: "'Caveat', cursive", color: INK }}
          >
            {cleanNote}
          </p>
        )}

        <div
          className="mt-3.5 flex items-center justify-center gap-2.5 md:justify-start"
          style={{ color: palette[0] }}
        >
          <Heart className="h-3.5 w-3.5" fill="currentColor" />
          <span className="text-[11px] tabular-nums" style={{ color: INK_SOFT }}>
            Moment {index + 1} of {total}
          </span>
        </div>
      </motion.div>

      <Doodle
        kind="star"
        color={palette[1]}
        className={`-top-5 h-9 w-9 sm:h-11 sm:w-11 ${flip ? "-left-3" : "-right-3"}`}
        delay={0.3}
        rotate={flip ? -12 : 12}
      />
      <Doodle
        kind="squiggle"
        color={palette[2]}
        className={`-bottom-6 h-9 w-14 sm:h-10 sm:w-16 ${flip ? "right-6" : "left-6"}`}
        delay={0.6}
      />
      <Doodle
        kind="sparkle"
        color={palette[0]}
        className={`top-1/2 h-6 w-6 sm:h-7 sm:w-7 ${flip ? "-right-4" : "-left-4"}`}
        delay={0.9}
      />
      <Doodle
        kind="ribbon"
        color={palette[1]}
        className={`-bottom-4 h-8 w-8 sm:h-9 sm:w-9 ${flip ? "left-6" : "right-6"}`}
        delay={1.05}
        rotate={flip ? -8 : 8}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  One row: wider reel on one side, note on the other — alternating   */
/* ------------------------------------------------------------------ */
function MomentRow({
  m,
  index,
  total,
  soundOn,
  setSoundOn,
}: {
  m: Moment;
  index: number;
  total: number;
  soundOn: boolean;
  setSoundOn: (v: boolean) => void;
}) {
  const flip = index % 2 === 1;
  const palette = PALETTES[index % PALETTES.length];
  const tag = SIDE_TAGS[index % SIDE_TAGS.length];
  const subline = SIDE_SUBLINES[index % SIDE_SUBLINES.length];

  return (
    <article className="relative grid items-center gap-8 md:grid-cols-2 md:gap-10">
      <div className="pointer-events-none absolute -left-48 top-1/2 hidden -translate-y-1/2 xl:block">
        <SideCharm label={tag} subline={subline} accent={palette[0]} align="left" />
      </div>
      <div className="pointer-events-none absolute -right-48 top-1/2 hidden -translate-y-1/2 xl:block">
        <SideCharm label={tag} subline={subline} accent={palette[1]} align="right" />
      </div>

      <motion.div
        initial={{ opacity: 0, x: flip ? 40 : -40, scale: 0.96 }}
        whileInView={{ opacity: 1, x: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={`relative flex justify-center ${flip ? "md:order-2" : ""}`}
        style={
          {
            "--rw":
              "clamp(250px, min(86vw, 400px, calc((100dvh - 140px) * 0.68)), 400px)",
          } as CSSProperties
        }
      >
        <div className="relative">
          <Reel m={m} soundOn={soundOn} setSoundOn={setSoundOn} />
          <Doodle
            kind="heart"
            color={palette[0]}
            className="-left-5 -top-5 h-10 w-10 sm:-left-7 sm:-top-6 sm:h-12 sm:w-12"
            delay={0.2}
            rotate={-14}
          />
          <Doodle
            kind="flower"
            color={palette[1]}
            className="-right-5 top-1/3 h-10 w-10 sm:-right-8 sm:h-14 sm:w-14"
            delay={0.5}
          />
          <Doodle
            kind="arrow"
            color={palette[2]}
            className="-bottom-6 -left-5 h-10 w-10 sm:-left-9 sm:h-12 sm:w-12"
            delay={0.8}
          />
          <Doodle
            kind="butterfly"
            color={palette[0]}
            className="-bottom-4 -right-5 h-9 w-9 sm:-right-7 sm:h-11 sm:w-11"
            delay={1.0}
            rotate={10}
          />
        </div>
      </motion.div>

      <div className={flip ? "md:order-1" : ""}>
        <NoteCard m={m} index={index} total={total} flip={flip} palette={palette} />
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function Moments({ gateToken, onNext, onPrevious, onRestart }: Props) {
  const reduce = useReducedMotion();
  const [items, setItems] = useState<Moment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);

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
        const data = ((json.data as Moment[]) ?? []).slice();
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

  const navBtn =
    "flex items-center gap-2 rounded-full border border-white/90 bg-white/65 px-4 py-2.5 text-sm backdrop-blur transition active:scale-95 hover:bg-white sm:px-5";

  return (
    <div
      className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden"
      style={{ background: "#fbf6fb", color: INK }}
    >
      <div
        className="fixed inset-0 z-0"
        style={{
          background: "linear-gradient(165deg,#f8f1ff 0%,#fdeff4 50%,#eef5ff 100%)",
        }}
      />
      {[
        { c: "#f9c6d6", cls: "-left-[15%] top-[5%] h-[45vh] w-[60vw]", dx: 40, d: 18, delay: 0 },
        { c: "#d5c8f5", cls: "-right-[15%] top-[35%] h-[45vh] w-[60vw]", dx: -40, d: 22, delay: 3 },
        { c: "#c9e0f8", cls: "-bottom-[15%] left-[20%] h-[40vh] w-[60vw]", dx: 30, d: 20, delay: 6 },
      ].map((b, i) => (
        <motion.div
          key={i}
          aria-hidden
          className={`pointer-events-none fixed z-0 transform-gpu rounded-full blur-[80px] ${b.cls}`}
          style={{ background: b.c }}
          animate={reduce ? undefined : { x: [0, b.dx, 0], opacity: [0.5, 0.72, 0.5] }}
          transition={{ duration: b.d, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
        />
      ))}

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-8 pt-4 sm:px-8 sm:pt-6">
        <header className="mb-5 flex flex-col items-center text-center sm:mb-7">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 rounded-full border border-white/80 bg-white/65 px-3.5 py-1 text-xs backdrop-blur sm:text-sm"
            style={{ color: INK_SOFT }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: ROSE }} />
            Moments
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-2 text-[32px] font-medium leading-tight tracking-tight sm:text-5xl"
            style={{ fontFamily: "'Fraunces', Georgia, serif", color: INK }}
          >
            Little pockets of time
          </motion.h2>
        </header>

        <div className="flex-1">
          {items === null ? (
            <div className="grid items-center gap-9 md:grid-cols-2">
              <div className="mx-auto aspect-[4/5] w-[min(80vw,340px)] animate-pulse rounded-[30px] bg-white/60" />
              <div className="mx-auto h-48 w-full max-w-md animate-pulse rounded-[22px] bg-white/60" />
            </div>
          ) : error ? (
            <p className="text-center text-rose-500">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-center" style={{ color: INK_SOFT }}>
              No moments added yet.
            </p>
          ) : (
            <div className="space-y-14 md:space-y-16">
              {items.map((m, i) => (
                <MomentRow
                  key={m._id}
                  m={m}
                  index={i}
                  total={items.length}
                  soundOn={soundOn}
                  setSoundOn={setSoundOn}
                />
              ))}
            </div>
          )}
        </div>

        <nav className="mt-12 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          <button type="button" onClick={onPrevious} className={navBtn} style={{ color: INK }}>
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button type="button" onClick={onRestart} className={navBtn} style={{ color: INK_SOFT }}>
            <RotateCcw className="h-4 w-4" /> Start over
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#c4607f]/30 transition active:scale-95 hover:brightness-105"
            style={{ background: GRAD }}
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </div>
  );
}