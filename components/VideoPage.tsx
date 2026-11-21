"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Cake, Heart, Play, Sparkles, Star, Utensils, Wind } from "lucide-react";

interface VideoDoc {
  media: string;
  description: string;
}

interface Props {
  video: VideoDoc | null;
  loading: boolean;
  onNext: () => void;
}

type Stage = "blow" | "cut" | "video";

const FONT_DISPLAY = "'Instrument Serif', Georgia, serif";
const FONT_BODY = "'Newsreader', Georgia, serif";
const FONT_HAND = "'Caveat', cursive";

const FLOATERS = [
  { left: "9%", top: "17%", kind: "heart", color: "#f7b5cc", size: 16, dur: 6.5, delay: 0 },
  { left: "88%", top: "20%", kind: "star", color: "#f7d488", size: 16, dur: 7.2, delay: 0.7 },
  { left: "13%", top: "75%", kind: "spark", color: "#b6dcf8", size: 16, dur: 6.8, delay: 1.3 },
  { left: "86%", top: "73%", kind: "heart", color: "#d8c4fc", size: 17, dur: 7.5, delay: 0.4 },
] as const;

const SWEET_LINES = [
  "you make every day feel like a party ♡",
  "may all your wishes come true ✨",
  "the sweetest slice is for you 🍰",
  "here's to a year full of giggles & glow",
  "you're the best part of this cake 💙",
];

const CONFETTI_COLORS = ["#f48fb1", "#f7d488", "#9ec5fb", "#c9b3fb", "#9be3c6", "#ffb38a"];
const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  x: Math.round(Math.cos(i * 2.4) * (95 + (i % 5) * 28)),
  y: -Math.round(65 + ((i * 37) % 120)),
  rot: (i * 53) % 360,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  round: i % 3 === 0,
  delay: (i % 6) * 0.025,
}));

function CuteIcon({
  kind,
  size,
  color,
}: {
  kind: "heart" | "star" | "spark";
  size: number;
  color: string;
}) {
  const style = { width: size, height: size, color };
  if (kind === "heart") return <Heart style={style} fill="currentColor" strokeWidth={0} />;
  if (kind === "star") return <Star style={style} fill="currentColor" strokeWidth={0} />;
  return <Sparkles style={style} strokeWidth={2.2} />;
}

/* ---------- Hand-drawn doodles ---------- */

function Doodle({
  d,
  color,
  w,
  h,
  vb,
  delay = 0,
  fill = "none",
  className = "",
  reduce,
}: {
  d: string;
  color: string;
  w: number;
  h: number;
  vb: string;
  delay?: number;
  fill?: string;
  className?: string;
  reduce: boolean;
}) {
  return (
    <svg
      aria-hidden
      width={w}
      height={h}
      viewBox={vb}
      className={`pointer-events-none ${className}`}
      fill="none"
    >
      <motion.path
        d={d}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
        initial={reduce ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, delay, ease: "easeInOut" }}
      />
    </svg>
  );
}

const D_STAR = "M24 4 L29 18 L44 19 L32 28 L36 43 L24 35 L12 43 L16 28 L4 19 L19 18 Z";
const D_HEART =
  "M24 42 C6 28 4 14 14 9 C20 6 24 11 24 14 C24 11 28 6 34 9 C44 14 42 28 24 42 Z";
const D_SWIRL = "M6 30 C6 8 40 8 40 26 C40 38 22 40 22 28 C22 20 32 20 32 26";
const D_SPARK = "M24 4 V44 M4 24 H44 M10 10 L38 38 M38 10 L10 38";
const D_SQUIGGLE =
  "M4 12 Q22 -2 40 12 T76 12 T112 12 T148 12 T184 12 T220 12 T256 12";
const D_ARROW = "M4 40 C20 8 50 4 70 24 M70 24 L56 22 M70 24 L66 38";

/* ---------- Cute Cake with Dynamic Cut Position ---------- */

function CakeScene({
  blown,
  sliced,
  canCut,
  cutX,
  onHoverX,
  onCutAt,
  reduce,
}: {
  blown: boolean;
  sliced: boolean;
  canCut: boolean;
  cutX: number; // SVG x-coordinate in [50..250]
  onHoverX: (x: number) => void;
  onCutAt: (x: number) => void;
  reduce: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement | null>(null);

  const candles = [
    { x: 88, color: "#7fb2f5", stripe: "#dceaff", topper: "star" as const },
    { x: 120, color: "#f48fb1", stripe: "#ffe3ee", topper: "heart" as const },
    { x: 150, color: "#f7c85c", stripe: "#fff3c4", topper: "spark" as const },
    { x: 180, color: "#b799ff", stripe: "#ece3ff", topper: "heart" as const },
    { x: 212, color: "#7ad7b8", stripe: "#d9f7ec", topper: "star" as const },
  ];

  const clientXToSvgX = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return 150;
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return 150;
    const ratio = (clientX - rect.left) / rect.width;
    const svgX = ratio * 300;
    return Math.max(52, Math.min(248, Math.round(svgX)));
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!canCut || sliced) return;
    onHoverX(clientXToSvgX(e.clientX));
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!canCut || sliced) return;
    const x = clientXToSvgX(e.clientX);
    onHoverX(x);
    onCutAt(x);
  };

  const Body = () => (
    <g>
      {/* Bottom tier */}
      <rect
        x="30"
        y="170"
        width="240"
        height="72"
        rx="20"
        fill="#ffe3ee"
        stroke="#e47da6"
        strokeWidth="3"
      />
      {/* Scalloped lower icing wave */}
      <path
        d="M32 195 Q52 212 72 195 T112 195 T152 195 T192 195 T232 195 T268 195"
        stroke="#f48fb1"
        strokeWidth="3.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Top tier */}
      <rect
        x="58"
        y="112"
        width="184"
        height="62"
        rx="18"
        fill="#fff8ec"
        stroke="#e47da6"
        strokeWidth="3"
      />

      {/* Cute frosting drips */}
      <path
        d="M58 128 Q58 112 75 112 H225 Q242 112 242 128 V135 Q232 154 222 134 Q211 160 200 134 Q188 152 178 132 Q165 164 152 134 Q140 152 128 132 Q115 162 103 134 Q92 150 82 132 Q70 145 58 135 Z"
        fill="#ffc4da"
        stroke="#e47da6"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Cute berries on top */}
      {[78, 222].map((bx, idx) => (
        <g key={idx}>
          <ellipse cx={bx} cy="108" rx="9" ry="7" fill="#ff6b8b" stroke="#d94b6b" strokeWidth="2" />
          <path d={`M${bx - 3} 101 Q${bx} 95 ${bx + 3} 101`} stroke="#4caf50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      ))}

      {/* Sprinkles */}
      {[
        [48, 218, "#7fb2f5"],
        [86, 228, "#f7c85c"],
        [124, 219, "#9be3c6"],
        [168, 229, "#7fb2f5"],
        [214, 218, "#f48fb1"],
        [250, 228, "#f7c85c"],
      ].map(([x, y, c], i) => (
        <circle key={i} cx={x as number} cy={y as number} r="4.2" fill={c as string} />
      ))}

      {/* Cute kawaii face on top tier */}
      <circle cx="131" cy="153" r="3.4" fill="#3c3456" />
      <circle cx="169" cy="153" r="3.4" fill="#3c3456" />
      {/* Tiny eye sparkles */}
      <circle cx="130" cy="151.8" r="1.1" fill="#fff" />
      <circle cx="168" cy="151.8" r="1.1" fill="#fff" />
      {/* Smile */}
      <path
        d="M142 158 Q150 166 158 158"
        stroke="#3c3456"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Rosy cheeks */}
      <ellipse cx="118" cy="159" rx="6" ry="4" fill="#ff9ebb" opacity="0.78" />
      <ellipse cx="182" cy="159" rx="6" ry="4" fill="#ff9ebb" opacity="0.78" />
    </g>
  );

  const renderCandlesInRange = (minX: number, maxX: number) =>
    candles
      .filter((c) => c.x >= minX && c.x < maxX)
      .map((c) => {
        const i = candles.findIndex((item) => item.x === c.x);
        return (
          <g key={c.x}>
            {/* Candle stick */}
            <rect
              x={c.x - 4.5}
              y="80"
              width="9"
              height="34"
              rx="3.5"
              fill={c.color}
              stroke="#3c3456"
              strokeWidth="2"
            />
            {/* Stripes */}
            <path
              d={`M${c.x - 4.5} 91 L${c.x + 4.5} 87 M${c.x - 4.5} 101 L${c.x + 4.5} 97`}
              stroke={c.stripe}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Cute charm badge on candle */}
            <circle cx={c.x} cy="107" r="2.2" fill="#fff" opacity="0.9" />

            {/* Flame */}
            <motion.g
              style={{ transformOrigin: `${c.x}px 78px` }}
              initial={false}
              animate={
                blown
                  ? { scaleY: 0, scaleX: 0.2, opacity: 0, x: 9 }
                  : reduce
                    ? { scaleY: 1, opacity: 1 }
                    : {
                        scaleY: [1, 1.2, 0.92, 1.12, 1],
                        rotate: [-3.5, 3.5, -2.5, 2.5, -3.5],
                        opacity: 1,
                        x: 0,
                      }
              }
              transition={
                blown
                  ? { duration: 0.35, delay: i * 0.08 }
                  : { duration: 1.05 + i * 0.12, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <path
                d={`M${c.x} 58 C${c.x + 9.5} 69 ${c.x + 8.5} 78 ${c.x} 80 C${c.x - 8.5} 78 ${c.x - 9.5} 69 ${c.x} 58 Z`}
                fill="#ffb347"
                stroke="#e87d1e"
                strokeWidth="2"
              />
              <path
                d={`M${c.x} 69 C${c.x + 3.2} 74 ${c.x + 2.4} 78 ${c.x} 79 C${c.x - 2.4} 78 ${c.x - 3.2} 74 ${c.x} 69 Z`}
                fill="#fff6bd"
              />
            </motion.g>

            {/* Smoke puff when blown */}
            {blown && !reduce && (
              <motion.path
                d={`M${c.x} 76 q-6 -8 0 -14 q6 -6 0 -14 q-5 -6 0 -12`}
                stroke="#b5bdd6"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0.9, y: 0 }}
                animate={{ pathLength: 1, opacity: 0, y: -22 }}
                transition={{ duration: 1.35, delay: 0.2 + i * 0.08, ease: "easeOut" }}
              />
            )}
          </g>
        );
      });

  return (
    <div className="relative mx-auto w-full max-w-[360px] select-none">
      {/* Confetti burst at cutX */}
      {sliced &&
        !reduce &&
        CONFETTI.map((c, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="pointer-events-none absolute top-[52%] block h-2.5 w-2.5"
            style={{
              left: `${(cutX / 300) * 100}%`,
              background: c.color,
              borderRadius: c.round ? "999px" : "2px",
            }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.4 }}
            animate={{
              x: c.x,
              y: [0, c.y, c.y + 190],
              opacity: [1, 1, 0],
              rotate: c.rot * 2,
              scale: 1,
            }}
            transition={{ duration: 1.8, delay: c.delay, ease: "easeOut" }}
          />
        ))}

      <motion.svg
        ref={svgRef}
        viewBox="0 0 300 280"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        className={`w-full overflow-visible drop-shadow-[0_22px_28px_rgba(228,125,166,0.28)] ${
          canCut && !sliced ? "cursor-crosshair touch-none" : ""
        }`}
        role="img"
        aria-label="A cute birthday cake with five candles"
        initial={reduce ? false : { y: -260, opacity: 0, rotate: -4 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 70, damping: 11, mass: 1 }}
      >
        <defs>
          <clipPath id={`${uid}-left`}>
            <rect x="-60" y="-80" width={cutX + 60} height="420" />
          </clipPath>
          <clipPath id={`${uid}-right`}>
            <rect x={cutX} y="-80" width={360 - cutX} height="420" />
          </clipPath>
        </defs>

        {/* Cute cake stand / plate */}
        <ellipse cx="150" cy="248" rx="142" ry="20" fill="#ffffff" stroke="#c9d6f7" strokeWidth="3" />
        <ellipse cx="150" cy="244" rx="108" ry="11" fill="#f4f7ff" />
        <path d="M124 266 Q150 274 176 266" stroke="#c9d6f7" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Left half (splits left from cutX) */}
        <motion.g
          clipPath={`url(#${uid}-left)`}
          animate={sliced ? { x: -12, rotate: -1.5 } : { x: 0, rotate: 0 }}
          style={{ transformOrigin: `${cutX}px 240px` }}
          transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.22 }}
        >
          <Body />
          {renderCandlesInRange(-100, cutX)}
        </motion.g>

        {/* Right half (splits right from cutX) */}
        <motion.g
          clipPath={`url(#${uid}-right)`}
          animate={sliced ? { x: 24, y: 4, rotate: 3.5 } : { x: 0, y: 0, rotate: 0 }}
          style={{ transformOrigin: `${cutX}px 240px` }}
          transition={{ type: "spring", stiffness: 115, damping: 13, delay: 0.28 }}
        >
          <Body />
          {renderCandlesInRange(cutX, 400)}
        </motion.g>

        {/* Cut guide line while aiming with cursor/finger */}
        {canCut && !sliced && (
          <g pointerEvents="none">
            <line
              x1={cutX}
              y1="96"
              x2={cutX}
              y2="242"
              stroke="#e07aa5"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              opacity="0.85"
            />
            <circle cx={cutX} cy="92" r="5" fill="#fff" stroke="#e07aa5" strokeWidth="2.5" />
          </g>
        )}

        {/* Knife slicing right at cutX */}
        <AnimatePresence>
          {((canCut && !sliced) || sliced) && !reduce && (
            <motion.g
              key="knife"
              initial={{ y: -120, opacity: 0 }}
              animate={
                sliced
                  ? { x: cutX - 188, y: [-120, 24, 10], opacity: [0.9, 1, 0], rotate: [0, -8, -8] }
                  : { x: cutX - 188, y: -32, opacity: 0.92, rotate: -8 }
              }
              exit={{ opacity: 0, y: -60 }}
              transition={
                sliced
                  ? { duration: 0.65, ease: "easeIn" }
                  : { type: "spring", stiffness: 220, damping: 22 }
              }
            >
              {/* Blade */}
              <rect
                x="185"
                y="42"
                width="8"
                height="128"
                rx="2"
                fill="#eef3ff"
                stroke="#3c3456"
                strokeWidth="2.5"
              />
              {/* Cute handle */}
              <rect
                x="179"
                y="12"
                width="20"
                height="32"
                rx="9"
                fill="#f48fb1"
                stroke="#3c3456"
                strokeWidth="2.5"
              />
            </motion.g>
          )}
        </AnimatePresence>
      </motion.svg>
    </div>
  );
}

/* ---------- Page ---------- */

export default function VideoPage({ video, loading, onNext }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timers = useRef<number[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [stage, setStage] = useState<Stage>("blow");
  const [blown, setBlown] = useState(false);
  const [sliced, setSliced] = useState(false);
  const [cutX, setCutX] = useState(175);
  const [lineIdx, setLineIdx] = useState(0);
  const reduceMotion = !!useReducedMotion();

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Instrument+Serif:ital@0;1&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    const pending = timers.current;
    return () => {
      document.head.removeChild(link);
      pending.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    setHasStarted(false);
  }, [video?.media]);

  // Rotate sweet lines on the video screen
  useEffect(() => {
    if (stage !== "video") return;
    const id = window.setInterval(() => setLineIdx((i) => (i + 1) % SWEET_LINES.length), 3200);
    return () => window.clearInterval(id);
  }, [stage]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const handleBlow = () => {
    if (blown) return;
    setBlown(true);
    later(() => setStage("cut"), 1600);
  };

  const handleCutAt = (x: number) => {
    if (sliced) return;
    setCutX(x);
    setSliced(true);
    later(() => setStage("video"), 2100);
  };

  const handleOverlayPlay = () => {
    setHasStarted(true);
    videoRef.current?.play().catch(() => {});
  };

  const prompt =
    stage === "blow"
      ? blown
        ? { title: "Wish made!", hand: "shhh… it's coming true ♡" }
        : { title: "Close your eyes & make a wish", hand: "blow out the candles, birthday boy ♡" }
      : sliced
        ? { title: "Sweet slice cut!", hand: "opening your birthday video…" }
        : { title: "Cut where you want a slice", hand: "move your finger or cursor on the cake & tap ♡" };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      {/* Dreamy pastel wash & glowing clouds */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "linear-gradient(165deg, #fff2f8 0%, #f5efff 40%, #eaf1ff 75%, #eff9ff 100%)",
        }}
      />
      <motion.div
        aria-hidden
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 24, 0], scale: [1, 1.07, 1], opacity: [0.5, 0.75, 0.5] }
        }
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none fixed -left-24 top-16 -z-10 h-72 w-72 rounded-full bg-[#ffd0e2] blur-[110px]"
      />
      <motion.div
        aria-hidden
        animate={
          reduceMotion
            ? undefined
            : { x: [0, -24, 0], scale: [1.05, 0.96, 1.05], opacity: [0.5, 0.75, 0.5] }
        }
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none fixed -right-24 bottom-12 -z-10 h-80 w-80 rounded-full bg-[#c8daff] blur-[115px]"
      />

      {/* Gentle floating cute icons */}
      {!reduceMotion &&
        FLOATERS.map((item, idx) => (
          <motion.div
            key={idx}
            aria-hidden
            className="pointer-events-none fixed -z-10 hidden sm:block"
            style={{ left: item.left, top: item.top }}
            animate={{ y: [-7, 7, -7], rotate: [-6, 6, -6], opacity: [0.55, 0.9, 0.55] }}
            transition={{ duration: item.dur, delay: item.delay, repeat: Infinity, ease: "easeInOut" }}
          >
            <CuteIcon kind={item.kind} size={item.size} color={item.color} />
          </motion.div>
        ))}

      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {stage !== "video" ? (
            /* ================= CAKE SCENE ================= */
            <motion.div
              key="cake-scene"
              exit={{ opacity: 0, scale: 0.92, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={prompt.title}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                >
                  <h2
                    className="text-[36px] leading-[1.06] tracking-tight text-[#2f2748] sm:text-[48px]"
                    style={{ fontFamily: FONT_DISPLAY }}
                  >
                    {prompt.title}
                  </h2>
                  <p
                    className="mt-1.5 text-[24px] leading-snug text-[#5876d8] sm:text-[27px]"
                    style={{ fontFamily: FONT_HAND }}
                  >
                    {prompt.hand}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="relative mt-6" aria-live="polite">
                <CakeScene
                  blown={blown}
                  sliced={sliced}
                  canCut={stage === "cut"}
                  cutX={cutX}
                  onHoverX={setCutX}
                  onCutAt={handleCutAt}
                  reduce={reduceMotion}
                />
              </div>

              <div className="mt-6 flex min-h-12 justify-center">
                <AnimatePresence mode="wait">
                  {stage === "blow" && !blown && (
                    <motion.button
                      key="blow-btn"
                      type="button"
                      onClick={handleBlow}
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: reduceMotion ? 0 : 0.7 }}
                      whileHover={reduceMotion ? undefined : { y: -2, scale: 1.03 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                      className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-[#4c6ed7] to-[#6562dc] px-8 text-[15px] font-semibold text-white shadow-[0_14px_28px_-8px_rgba(76,110,215,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4c6ed7] focus-visible:ring-offset-2"
                    >
                      <Wind className="h-4 w-4" aria-hidden />
                      Blow the candles
                    </motion.button>
                  )}

                  {stage === "cut" && !sliced && (
                    <motion.button
                      key="cut-btn"
                      type="button"
                      onClick={() => handleCutAt(cutX)}
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={reduceMotion ? undefined : { y: -2, scale: 1.03 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                      className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-[#e07aa5] to-[#6562dc] px-8 text-[15px] font-semibold text-white shadow-[0_14px_28px_-8px_rgba(224,122,165,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e07aa5] focus-visible:ring-offset-2"
                    >
                      <Utensils className="h-4 w-4" aria-hidden />
                      Cut right here
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            /* ================= VIDEO SCENE ================= */
            <motion.div
              key="video-scene"
              initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Title with doodle squiggle */}
              <div className="relative text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-1 text-[13px] font-medium text-[#4c6ed7] shadow-sm ring-1 ring-[#dfe7fb]">
                  <Cake className="h-3.5 w-3.5 text-[#e47da6]" aria-hidden />
                  your slice of the day
                </span>

                <h2
                  className="mt-3 text-[40px] leading-[1.05] tracking-tight text-[#2f2748] sm:text-[54px]"
                  style={{ fontFamily: FONT_DISPLAY }}
                >
                  Happy Birthday!
                </h2>

                <div className="mx-auto -mt-1 flex justify-center">
                  <Doodle
                    d={D_SQUIGGLE}
                    color="#f48fb1"
                    w={260}
                    h={24}
                    vb="0 -4 260 32"
                    delay={0.35}
                    reduce={reduceMotion}
                  />
                </div>

                <p
                  className="mt-1 text-[25px] leading-snug text-[#5876d8] sm:text-[28px]"
                  style={{ fontFamily: FONT_HAND }}
                >
                  wishes made, candles out, cake cut ♡
                </p>
              </div>

              {/* Video card with doodles + washi tape */}
              <div className="relative mt-8">
                <Doodle
                  d={D_STAR}
                  color="#f2b84b"
                  fill="#fff0c2"
                  w={44}
                  h={44}
                  vb="0 0 48 48"
                  delay={0.55}
                  reduce={reduceMotion}
                  className="absolute -left-3 -top-7 -rotate-12 sm:-left-8"
                />
                <Doodle
                  d={D_HEART}
                  color="#e47da6"
                  fill="#ffd0e2"
                  w={40}
                  h={40}
                  vb="0 0 48 48"
                  delay={0.75}
                  reduce={reduceMotion}
                  className="absolute -right-2 -top-8 rotate-12 sm:-right-7"
                />
                <Doodle
                  d={D_SWIRL}
                  color="#8f7be0"
                  w={46}
                  h={46}
                  vb="0 0 48 48"
                  delay={0.95}
                  reduce={reduceMotion}
                  className="absolute -bottom-7 left-6 hidden sm:block"
                />
                <Doodle
                  d={D_SPARK}
                  color="#6fa8f0"
                  w={34}
                  h={34}
                  vb="0 0 48 48"
                  delay={1.05}
                  reduce={reduceMotion}
                  className="absolute -bottom-6 right-8"
                />
                <Doodle
                  d={D_ARROW}
                  color="#e47da6"
                  w={74}
                  h={44}
                  vb="0 0 76 44"
                  delay={1.25}
                  reduce={reduceMotion}
                  className="absolute -left-14 top-1/2 hidden -rotate-12 lg:block"
                />

                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.97, rotate: -1.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotate: reduceMotion ? 0 : -0.6 }}
                  transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="relative rounded-[32px] bg-[#fffefe] p-3.5 shadow-[0_35px_80px_-28px_rgba(76,110,215,0.45),0_2px_0_0_rgba(255,255,255,0.95)_inset] ring-1 ring-[#e3e9fb] sm:p-5"
                >
                  {/* Washi tape */}
                  <span
                    aria-hidden
                    className="absolute -top-3 left-8 h-6 w-20 -rotate-6 rounded-[3px] bg-[#ffd0e2]/90 shadow-sm [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.55)_0_6px,transparent_6px_12px)]"
                  />
                  <span
                    aria-hidden
                    className="absolute -top-3 right-8 h-6 w-20 rotate-6 rounded-[3px] bg-[#c8daff]/90 shadow-sm [background-image:repeating-linear-gradient(-45deg,rgba(255,255,255,0.55)_0_6px,transparent_6px_12px)]"
                  />

                  <div className="mb-3 flex items-center justify-between px-2 pt-2">
                    <span
                      className="inline-flex items-center gap-1.5 text-[21px] font-semibold text-[#463f63]"
                      style={{ fontFamily: FONT_HAND }}
                    >
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f48fb1]" />
                      cake cutting clip
                    </span>
                    <span className="rounded-full bg-[#f4f7ff] px-3 py-0.5 text-[11px] font-semibold tracking-wide text-[#4c6ed7] ring-1 ring-[#dfe7fb]">
                      HAPPY BIRTHDAY
                    </span>
                  </div>

                  {loading ? (
                    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-[22px] bg-gradient-to-br from-[#f6f8ff] via-[#fff5f9] to-[#eef7ff]">
                      <motion.div
                        animate={reduceMotion ? undefined : { scale: [1, 1.18, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#e3e9fb]"
                      >
                        <Cake className="h-6 w-6 text-[#e47da6]" />
                      </motion.div>
                      <p className="text-[22px] text-[#5876d8]" style={{ fontFamily: FONT_HAND }}>
                        lighting the candles...
                      </p>
                    </div>
                  ) : video?.media ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-[22px] bg-[#19142c] shadow-[0_18px_40px_-14px_rgba(47,39,72,0.45)] ring-2 ring-[#eef3ff]">
                      <video
                        ref={videoRef}
                        src={video.media}
                        controls
                        playsInline
                        preload="metadata"
                        onPlay={() => setHasStarted(true)}
                        className="h-full w-full object-cover"
                      />
                      {!hasStarted && (
                        <button
                          type="button"
                          onClick={handleOverlayPlay}
                          aria-label="Play birthday cake video"
                          className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[#19142c]/25 transition duration-300 hover:bg-[#19142c]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                          <motion.span
                            animate={reduceMotion ? undefined : { scale: [1, 1.07, 1] }}
                            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-[#4c6ed7] shadow-[0_14px_35px_rgba(0,0,0,0.28)] ring-4 ring-[#ffd6e5]/70 backdrop-blur-md"
                          >
                            <Play className="ml-0.5 h-7 w-7 fill-current" aria-hidden />
                          </motion.span>
                          <span
                            className="rounded-full bg-white/90 px-4 py-1 text-[21px] font-semibold text-[#2f2748] shadow-sm backdrop-blur-sm"
                            style={{ fontFamily: FONT_HAND }}
                          >
                            watch the cake moment ♡
                          </span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2.5 rounded-[22px] border-2 border-dashed border-[#d8e2fc] bg-gradient-to-b from-[#f8faff] to-[#fff5f9] px-6 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#e47da6] shadow-sm ring-1 ring-[#dfe7fb]">
                        <Cake className="h-6 w-6" aria-hidden />
                      </div>
                      <p className="text-[18px] font-medium text-[#2f2748]" style={{ fontFamily: FONT_BODY }}>
                        The cake-cutting video hasn&apos;t been added yet.
                      </p>
                      <p className="text-[24px] text-[#4c6ed7]" style={{ fontFamily: FONT_HAND }}>
                        saving the sweetest slice for soon 💙
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  <div className="mt-4 flex items-start gap-3 rounded-2xl bg-gradient-to-r from-[#fff5f8] via-[#f8faff] to-[#f4f7ff] px-5 py-3.5 ring-1 ring-[#eaeefb]">
                    <Heart className="mt-1 h-4 w-4 shrink-0 fill-[#f48fb1] text-[#f48fb1]" aria-hidden />
                    <p
                      className="text-[17px] leading-relaxed text-[#463f63] sm:text-[18px]"
                      style={{ fontFamily: FONT_BODY }}
                    >
                      {video?.description ||
                        "May every wish you make on that cake come true, and may every day ahead feel just as warm and bright."}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Rotating sweet lines */}
              <div className="mt-9 flex h-10 items-center justify-center text-center" aria-live="polite">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={lineIdx}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.45 }}
                    className="text-[26px] text-[#5876d8] sm:text-[30px]"
                    style={{ fontFamily: FONT_HAND }}
                  >
                    {SWEET_LINES[lineIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Next CTA */}
              <div className="mt-4 flex justify-center">
                <motion.button
                  type="button"
                  onClick={onNext}
                  whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                  className="btn-primary group inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-[#4c6ed7] via-[#6562dc] to-[#e07aa5] px-8 text-[14px] font-semibold text-white shadow-[0_14px_28px_-8px_rgba(76,110,215,0.65)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4c6ed7] focus-visible:ring-offset-2"
                >
                  <span>Next</span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden
                  />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}