"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useRef } from "react";

interface Props {
  noAttempted: boolean;
  onYes: () => void;
  onNo: () => void;
}

type Stage = "welcome" | "prank" | "sticker";

/* ============================================================
   ✨ NEW (additions only) — cute lines, mascot, clouds, tap hearts
   ============================================================ */
const CUTE_LINES = [
  "you make ordinary days feel like magic ✨",
  "psst… this was made with so much love 💙",
  "warning: may cause uncontrollable smiling 🥹",
  "I saved the softest corner of the internet for you ☁️",
  "take a deep breath… something sweet is waiting 🫧",
  "no pressure, just a little pocket of cuteness 🧸",
];

const PRANK_CUTE_LINES = [
  "the “no” button is just shy 🙈",
  "your smile is loading… 🫧",
  "nice try, cutie 💫",
  "I can hear you blushing 🌸",
];

function CuteLines({
  lines,
  interval = 3400,
  className = "",
}: {
  lines: string[];
  interval?: number;
  className?: string;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % lines.length), interval);
    return () => clearInterval(t);
  }, [lines.length, interval]);

  return (
    <div
      className={`relative flex min-h-[2.5rem] items-center justify-center ${className}`}
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(3px)" }}
          transition={{ duration: 0.45 }}
          className="text-balance"
        >
          {lines[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function CloudMascot() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className="mb-2 h-24 w-28 sm:h-28 sm:w-32"
      animate={reduce ? undefined : { y: [0, -8, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 140 120" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="cloudBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#dbeafe" />
          </linearGradient>
          <linearGradient id="mascotHeart" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>

        <motion.g
          animate={reduce ? undefined : { y: [0, -5, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "70px 12px" }}
        >
          <path
            d="M70 24s-13-8-13-18a7 7 0 0 1 13-3.6A7 7 0 0 1 83 6c0 10-13 18-13 18Z"
            fill="url(#mascotHeart)"
          />
        </motion.g>

        <path
          d="M34 100c-15 0-26-9-26-22 0-11 8-19 19-21 2-16 16-27 33-27 13 0 24 6 29 17 3-2 7-3 11-3 14 0 24 10 24 23 0 18-13 33-31 33H34Z"
          fill="url(#cloudBody)"
          stroke="#bfdbfe"
          strokeWidth="2.5"
        />

        {[52, 88].map((cx) => (
          <motion.ellipse
            key={cx}
            cx={cx}
            cy={72}
            rx={5}
            ry={6.5}
            fill="#1e3a8a"
            animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.94, 0.98, 1] }}
            style={{ transformOrigin: `${cx}px 72px` }}
          />
        ))}
        <circle cx="54" cy="69.5" r="1.7" fill="#fff" />
        <circle cx="90" cy="69.5" r="1.7" fill="#fff" />

        <ellipse cx="38" cy="82" rx="7" ry="4.5" fill="#f9a8d4" opacity="0.6" />
        <ellipse cx="102" cy="82" rx="7" ry="4.5" fill="#f9a8d4" opacity="0.6" />

        <path
          d="M63 82q7 8 14 0"
          fill="none"
          stroke="#1e3a8a"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}

function SoftClouds() {
  const clouds = [
    { id: 0, top: "8%", scale: 1, duration: 70, delay: 0, opacity: 0.85 },
    { id: 1, top: "30%", scale: 0.65, duration: 90, delay: -30, opacity: 0.6 },
    { id: 2, top: "62%", scale: 0.85, duration: 80, delay: -55, opacity: 0.7 },
    { id: 3, top: "80%", scale: 0.55, duration: 100, delay: -15, opacity: 0.55 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {clouds.map((c) => (
        <motion.div
          key={c.id}
          className="absolute left-0"
          style={{ top: c.top, opacity: c.opacity }}
          initial={{ x: "-30vw" }}
          animate={{ x: "115vw" }}
          transition={{ duration: c.duration, delay: c.delay, repeat: Infinity, ease: "linear" }}
        >
          <svg width={150 * c.scale} height={70 * c.scale} viewBox="0 0 150 70" fill="#ffffff">
            <path d="M32 66C14 66 4 55 4 43c0-11 8-19 19-20C26 10 38 2 52 2c13 0 24 7 29 18 3-2 7-3 11-3 11 0 20 8 21 18 14 1 25 10 25 22 0 7-6 11-12 11H32Z" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

/* Tap anywhere → little emojis pop up (listens on window, so no
   existing element needed to change) */
type Pop = { id: number; x: number; y: number; emoji: string };
const POP_EMOJIS = ["💙", "✨", "🫧", "💫", "☁️", "🩵"];

function TapHearts() {
  const [pops, setPops] = useState<Pop[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const id = idRef.current++;
      const emoji = POP_EMOJIS[id % POP_EMOJIS.length];
      setPops((p) => [...p.slice(-12), { id, x: e.clientX, y: e.clientY, emoji }]);
      setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1000);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {pops.map((p) => (
          <motion.span
            key={p.id}
            className="absolute text-xl"
            style={{ left: p.x - 12, top: p.y - 12 }}
            initial={{ opacity: 1, scale: 0.4, y: 0 }}
            animate={{ opacity: 0, scale: 1.4, y: -70, x: (p.id % 5) * 8 - 16 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {p.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   BACKGROUND LAYER 1 — Drifting SVG hearts & stars (blue only)
   ============================================================ */
function DriftingShapes() {
  const shapes = [
    { id: 0, type: "heart", left: "6%", delay: 0, duration: 16, size: 20, opacity: 0.55 },
    { id: 1, type: "star", left: "18%", delay: 3, duration: 18, size: 14, opacity: 0.6 },
    { id: 2, type: "sparkle", left: "32%", delay: 1.5, duration: 15, size: 16, opacity: 0.55 },
    { id: 3, type: "heart", left: "47%", delay: 5, duration: 20, size: 22, opacity: 0.45 },
    { id: 4, type: "star", left: "61%", delay: 2, duration: 17, size: 12, opacity: 0.6 },
    { id: 5, type: "sparkle", left: "74%", delay: 4, duration: 19, size: 18, opacity: 0.5 },
    { id: 6, type: "heart", left: "88%", delay: 6, duration: 16, size: 20, opacity: 0.5 },
    { id: 7, type: "star", left: "95%", delay: 0.5, duration: 21, size: 15, opacity: 0.55 },
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {shapes.map((s) => (
        <motion.div
          key={s.id}
          className="absolute"
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            bottom: -40,
          }}
          animate={{
            y: ["0vh", "-115vh"],
            x: [0, s.id % 2 === 0 ? 14 : -14, 0],
            rotate: [0, s.id % 2 === 0 ? 25 : -25, 0],
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {s.type === "heart" && <HeartShape />}
          {s.type === "star" && <StarShape />}
          {s.type === "sparkle" && <SparkleShape />}
        </motion.div>
      ))}
    </div>
  );
}

function HeartShape() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M12 21s-8-4.9-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.1-8 11-8 11Z"
        fill="url(#heartGradBlue)"
      />
      <defs>
        <linearGradient id="heartGradBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#a5b4fc" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function StarShape() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M12 2.5l2.7 5.9 6.3.7-4.8 4.4 1.3 6.3L12 16.9 6.5 19.8l1.3-6.3L3 9.1l6.3-.7L12 2.5Z"
        fill="url(#starGradBlue)"
      />
      <defs>
        <linearGradient id="starGradBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SparkleShape() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M12 2c.6 4.4 3 6.8 7.4 7.4-4.4.6-6.8 3-7.4 7.4-.6-4.4-3-6.8-7.4-7.4C9 8.8 11.4 6.4 12 2Z"
        fill="url(#sparkleGradBlue)"
      />
      <defs>
        <linearGradient id="sparkleGradBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ============================================================
   BACKGROUND LAYER 2 — Twinkling dots (blue only)
   ============================================================ */
function TwinkleField() {
  const dots = Array.from({ length: 26 }).map((_, i) => ({
    id: i,
    top: `${(i * 41 + 7) % 100}%`,
    left: `${(i * 59 + 13) % 100}%`,
    delay: (i % 8) * 0.45,
    size: i % 4 === 0 ? 5 : i % 3 === 0 ? 4 : 3,
    color:
      i % 3 === 0
        ? "bg-sky-300/80"
        : i % 3 === 1
        ? "bg-blue-300/80"
        : "bg-indigo-300/80",
  }));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className={`absolute rounded-full ${d.color}`}
          style={{ top: d.top, left: d.left, width: d.size, height: d.size }}
          animate={{ opacity: [0.15, 0.9, 0.15], scale: [1, 1.5, 1] }}
          transition={{
            duration: 3 + (d.id % 3),
            delay: d.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   BACKGROUND LAYER 3 — Soft mesh gradient (pure CSS, no blur blobs)
   ============================================================ */
function MeshBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: [
          "radial-gradient(circle at 12% 18%, rgba(186, 230, 253, 0.55) 0%, rgba(186, 230, 253, 0) 42%)",
          "radial-gradient(circle at 88% 12%, rgba(191, 219, 254, 0.6) 0%, rgba(191, 219, 254, 0) 45%)",
          "radial-gradient(circle at 10% 85%, rgba(199, 210, 254, 0.55) 0%, rgba(199, 210, 254, 0) 46%)",
          "radial-gradient(circle at 90% 88%, rgba(165, 180, 252, 0.45) 0%, rgba(165, 180, 252, 0) 48%)",
          "radial-gradient(circle at 50% 50%, rgba(224, 242, 254, 0.5) 0%, rgba(224, 242, 254, 0) 55%)",
          "linear-gradient(135deg, #e0f2fe 0%, #dbeafe 40%, #e0e7ff 70%, #eef2ff 100%)",
        ].join(", "),
      }}
    />
  );
}

/* ============================================================
   BACKGROUND LAYER 4 — Subtle blue dot grid
   ============================================================ */
function DotGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.35]"
      style={{
        backgroundImage:
          "radial-gradient(rgba(59, 130, 246, 0.35) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        maskImage:
          "radial-gradient(ellipse at center, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0) 75%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0) 75%)",
      }}
    />
  );
}

/* ============================================================
   BACKGROUND LAYER 5 — Slow diagonal light sweep
   ============================================================ */
function LightSweep() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.45) 45%, transparent 70%)",
        backgroundSize: "250% 250%",
      }}
      animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ============================================================
   CURVY / ZIGZAG BUTTON STYLES (unchanged)
   ============================================================ */
function CurvyButtonStyles() {
  return (
    <style jsx global>{`
      .curvy-btn {
        position: relative;
        isolation: isolate;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.85rem 1.6rem;
        font-weight: 600;
        font-size: 0.95rem;
        letter-spacing: 0.01em;
        border-radius: 999px;
        cursor: pointer;
        border: none;
        outline: none;
        overflow: hidden;
        transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
          color 0.3s ease;
        white-space: nowrap;
      }

      .curvy-btn--primary {
        color: #ffffff;
        background: linear-gradient(
          135deg,
          #6366f1 0%,
          #3b82f6 40%,
          #ec4899 100%
        );
        background-size: 200% 200%;
        animation: curvy-gradient-shift 8s ease infinite;
      }
      .curvy-btn--primary::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 2px;
        background: linear-gradient(
          120deg,
          rgba(255, 255, 255, 0.7),
          rgba(255, 255, 255, 0) 40%,
          rgba(255, 255, 255, 0.5) 70%,
          rgba(255, 255, 255, 0) 100%
        );
        -webkit-mask: linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
        opacity: 0.7;
      }
      .curvy-btn--primary::after {
        content: "";
        position: absolute;
        top: -50%;
        left: -60%;
        width: 60%;
        height: 200%;
        background: linear-gradient(
          100deg,
          transparent,
          rgba(255, 255, 255, 0.55),
          transparent
        );
        transform: skewX(-20deg);
        transition: left 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        pointer-events: none;
      }
      .curvy-btn--primary:hover::after {
        left: 120%;
      }

      .curvy-btn--secondary {
        color: #4338ca;
        background: linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%);
      }
      .curvy-btn--secondary::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 2px;
        background: conic-gradient(
          from 0deg,
          #93c5fd,
          #c4b5fd,
          #f9a8d4,
          #fde68a,
          #93c5fd
        );
        -webkit-mask: linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
        animation: curvy-spin 6s linear infinite;
      }
      .curvy-btn--secondary::after {
        content: "";
        position: absolute;
        inset: 3px;
        border-radius: inherit;
        background: linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%);
        z-index: -1;
        pointer-events: none;
      }

      .curvy-btn:hover {
        transform: translateY(-2px) scale(1.03);
      }
      .curvy-btn:active {
        transform: translateY(0) scale(0.97);
      }

      .curvy-btn__zig {
        position: absolute;
        bottom: 4px;
        left: 50%;
        width: 0;
        height: 6px;
        transform: translateX(-50%);
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='6' viewBox='0 0 60 6'><path d='M0 3 Q 7.5 0 15 3 T 30 3 T 45 3 T 60 3' fill='none' stroke='white' stroke-width='1.6' stroke-linecap='round'/></svg>");
        background-repeat: repeat-x;
        background-size: 60px 6px;
        transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        pointer-events: none;
        opacity: 0.9;
      }
      .curvy-btn--secondary .curvy-btn__zig {
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='6' viewBox='0 0 60 6'><path d='M0 3 Q 7.5 0 15 3 T 30 3 T 45 3 T 60 3' fill='none' stroke='%236366f1' stroke-width='1.6' stroke-linecap='round'/></svg>");
      }
      .curvy-btn:hover .curvy-btn__zig {
        width: 70%;
      }

      @keyframes curvy-gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes curvy-spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  );
}

export default function WelcomePage({ noAttempted, onYes, onNo }: Props) {
  const [stage, setStage] = useState<Stage>("welcome");
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch from randomized background animations
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleYes = () => {
    setStage("sticker");
    setTimeout(() => onYes(), 1800);
  };

  const handleNo = () => {
    onNo();
    setStage("prank");
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-1 flex-col items-center justify-center overflow-hidden bg-sky-50 px-4 pb-16 pt-6 text-center sm:px-6 sm:pt-10">
      <CurvyButtonStyles />

      {/* Background stack — only render after mount to avoid hydration mismatch */}
      {mounted && (
        <>
          <MeshBackground />
          <DotGrid />
          <SoftClouds />
          <TwinkleField />
          <LightSweep />
          <DriftingShapes />
          <TapHearts />
        </>
      )}

      <AnimatePresence mode="wait">
        {/* ================= WELCOME ================= */}
        {stage === "welcome" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
            transition={{ duration: 0.4 }}
            className="relative z-10 flex w-full max-w-2xl flex-col items-center -translate-y-4 sm:-translate-y-8"
          >
            <CloudMascot />

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4 flex items-center gap-2 text-blue-400 sm:mb-5"
            >
              <motion.span
                animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </motion.span>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Heart className="h-4 w-4 fill-blue-300 text-blue-400 sm:h-5 sm:w-5" />
              </motion.span>
              <motion.span
                animate={{ rotate: [0, -15, 10, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </motion.span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-balance text-[1.6rem] font-semibold leading-[1.15] text-slate-800 sm:text-4xl md:text-5xl"
            >
              Hey, I built a tiny universe
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-500 bg-clip-text text-transparent">
                just for you.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="mt-4 max-w-md text-[0.9rem] leading-relaxed text-slate-500 sm:mt-5 sm:text-base"
            >
              It won&apos;t take long — but it might make you smile.
              <br /> Ready to step inside?
            </motion.p>

          

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.55 }}
              className="mt-7 flex w-full flex-row items-center justify-center gap-2.5 sm:mt-9 sm:gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleYes}
                className="curvy-btn curvy-btn--primary flex-1 max-w-[170px] sm:flex-none sm:min-w-[160px]"
              >
                Let&apos;s begin
                <ArrowRight className="h-4 w-4" />
                <span className="curvy-btn__zig" aria-hidden />
              </motion.button>

              {!noAttempted && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNo}
                  className="curvy-btn curvy-btn--secondary flex-1 max-w-[170px] sm:flex-none sm:min-w-[160px]"
                >
                  Nah, maybe not
                  <span className="curvy-btn__zig" aria-hidden />
                </motion.button>
              )}
            </motion.div>

            {noAttempted && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-5 text-sm italic text-slate-500"
              >
                See? You came back. I knew it. 💙
              </motion.p>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 1.2 }}
              className="mt-6 text-xs text-slate-400"
            >
              (psst… tap anywhere for a little sparkle ✨)
            </motion.p>
          </motion.div>
        )}

        {/* ================= PRANK (No) ================= */}
        {stage === "prank" && <PrankScreen key="prank" onReturn={() => setStage("welcome")} />}

        {/* ================= STICKER REVEAL (Yes) ================= */}
        {stage === "sticker" && (
          <motion.div
            key="sticker"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 180, damping: 16 }}
            className="relative z-10 flex flex-col items-center -translate-y-4 sm:-translate-y-8"
          >
            <motion.img
              src="/welcome3"
              alt="A little surprise"
              className="h-40 w-40 sm:h-56 sm:w-56 md:h-64 md:w-64"
              animate={{ rotate: [-2, 2, -2], y: [0, -6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-6 text-base font-medium text-slate-700 sm:text-lg"
            >
              Okay… come with me 💫
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-1 text-sm text-indigo-400"
            >
              hold my hand, it&apos;s going to be cute 🤍
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   Prank screen — shown on "No", auto-returns after 4 seconds
   ============================================================ */
function PrankScreen({ onReturn }: { onReturn: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(4);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    const timer = setTimeout(onReturn, 4000);

    return () => {
      clearInterval(tick);
      clearTimeout(timer);
    };
  }, [onReturn]);

  return (
    <motion.div
      key="prank"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 flex w-full max-w-md flex-col items-center -translate-y-4 sm:-translate-y-8"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-sky-200/50 via-transparent to-blue-200/50 blur-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
        className="relative flex w-full flex-col items-center rounded-[2rem] border border-white/70 bg-white/70 px-6 py-8 backdrop-blur-xl sm:px-8 sm:py-10"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
        >
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 110;
            return (
              <motion.div
                key={i}
                className="absolute"
                style={{ width: 16, height: 16 }}
                animate={{
                  x: [Math.cos(angle) * radius, Math.cos(angle + 0.6) * radius],
                  y: [Math.sin(angle) * radius, Math.sin(angle + 0.6) * radius],
                  rotate: [0, 180, 360],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 4 + i * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              >
                {i % 3 === 0 ? (
                  <HeartShape />
                ) : i % 3 === 1 ? (
                  <StarShape />
                ) : (
                  <SparkleShape />
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.img
          src="/Teasing"
          alt="Teasing sticker"
          initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 14 }}
          className="h-32 w-32 sm:h-40 sm:w-40" 
        />
         <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-5 max-w-md text-balance text-xl font-semibold leading-snug text-slate-800 sm:mt-6 sm:text-2xl"
        >
          Aw, &quot;no&quot;? TQ mar khani h ap n.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-2.5 max-w-sm px-1 text-[0.9rem] leading-relaxed text-slate-500 sm:text-base"
        >
          But your heart already said yes. Give it {secondsLeft}s…
        </motion.p>

  

        <div className="mt-6 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-slate-200/80 sm:mt-7">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4, ease: "linear" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
