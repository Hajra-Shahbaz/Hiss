"use client";

import { FormEvent, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cake, Heart, Sparkles } from "lucide-react";

interface Props {
  onVerified: () => void;
}

/* ============================================================
   DRIFTING SHAPES — same blue hearts/stars/sparkles as welcome
   ============================================================ */
function DriftingShapes() {
  const shapes = [
    { id: 0, type: "heart", left: "8%", delay: 0, duration: 16, size: 18, opacity: 0.45 },
    { id: 1, type: "star", left: "22%", delay: 3, duration: 18, size: 12, opacity: 0.5 },
    { id: 2, type: "sparkle", left: "38%", delay: 1.5, duration: 15, size: 14, opacity: 0.45 },
    { id: 3, type: "heart", left: "55%", delay: 5, duration: 20, size: 20, opacity: 0.4 },
    { id: 4, type: "star", left: "68%", delay: 2, duration: 17, size: 11, opacity: 0.5 },
    { id: 5, type: "sparkle", left: "82%", delay: 4, duration: 19, size: 15, opacity: 0.4 },
    { id: 6, type: "heart", left: "93%", delay: 6, duration: 16, size: 16, opacity: 0.45 },
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {shapes.map((s) => (
        <motion.div
          key={s.id}
          className="absolute"
          style={{ left: s.left, width: s.size, height: s.size, opacity: s.opacity, bottom: -40 }}
          animate={{
            y: ["0vh", "-115vh"],
            x: [0, s.id % 2 === 0 ? 12 : -12, 0],
            rotate: [0, s.id % 2 === 0 ? 22 : -22, 0],
          }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
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
        fill="url(#agHeartGrad)"
      />
      <defs>
        <linearGradient id="agHeartGrad" x1="0" y1="0" x2="1" y2="1">
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
        fill="url(#agStarGrad)"
      />
      <defs>
        <linearGradient id="agStarGrad" x1="0" y1="0" x2="1" y2="1">
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
        fill="url(#agSparkleGrad)"
      />
      <defs>
        <linearGradient id="agSparkleGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ============================================================
   TWINKLE FIELD — same blue dots as welcome
   ============================================================ */
function TwinkleField() {
  const dots = Array.from({ length: 22 }).map((_, i) => ({
    id: i,
    top: `${(i * 41 + 7) % 100}%`,
    left: `${(i * 59 + 13) % 100}%`,
    delay: (i % 8) * 0.45,
    size: i % 4 === 0 ? 4 : i % 3 === 0 ? 3 : 2,
    color: i % 3 === 0 ? "bg-sky-300/80" : i % 3 === 1 ? "bg-blue-300/80" : "bg-indigo-300/80",
  }));

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className={`absolute rounded-full ${d.color}`}
          style={{ top: d.top, left: d.left, width: d.size, height: d.size }}
          animate={{ opacity: [0.15, 0.9, 0.15], scale: [1, 1.5, 1] }}
          transition={{ duration: 3 + (d.id % 3), delay: d.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   MESH BACKGROUND — identical to welcome
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
   DOT GRID + LIGHT SWEEP — same subtle layers
   ============================================================ */
function DotGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.35]"
      style={{
        backgroundImage: "radial-gradient(rgba(59, 130, 246, 0.35) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0) 75%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0) 75%)",
      }}
    />
  );
}

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
   MAIN COMPONENT
   ============================================================ */
export default function AgeGate({ onVerified }: Props) {
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch from randomized background animations
  useEffect(() => setMounted(true), []);

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setMessage("Please enter your age.");
      setShake((s) => s + 1);
      return;
    }
    if (!/^\d{1,3}$/.test(trimmed)) {
      setMessage("Please enter a valid number.");
      setShake((s) => s + 1);
      return;
    }
    const age = Number(trimmed);
    if (age > 22) {
      setMessage("Umer nikl rhi h apki kr lo shadi jldi");
      setShake((s) => s + 1);
      return;
    }
    if (age < 22) {
      setMessage("baita umr kam nh honi bharni h, sae age dalo");
      setShake((s) => s + 1);
      return;
    }
    setMessage(null);
    onVerified();
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-1 flex-col items-center justify-center overflow-hidden bg-sky-50 px-4 py-10 text-center sm:px-6">
      {/* Background stack — only after mount to avoid hydration mismatch */}
      {mounted && (
        <>
          <MeshBackground />
          <DotGrid />
          <TwinkleField />
          <LightSweep />
          <DriftingShapes />
        </>
      )}

      {/* Glass card — matches the PrankScreen card language */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
        className="relative z-10 flex w-full max-w-sm flex-col items-center rounded-[2rem] border border-white/70 bg-white/70 px-6 py-8 backdrop-blur-xl sm:px-8 sm:py-10"
      >
        {/* Animated icon trio header — mirrors welcome's sparkle/heart/sparkle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 flex items-center gap-2 text-blue-400"
        >
          <motion.span
            animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </motion.span>
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 text-blue-500"
          >
            <Cake className="h-5 w-5" />
          </motion.span>
          <motion.span
            animate={{ rotate: [0, -15, 10, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <Heart className="h-3.5 w-3.5 fill-blue-300 text-blue-400" />
          </motion.span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.55 }}
          className="text-balance text-2xl font-semibold leading-snug text-slate-800 sm:text-3xl"
        >
          First,{" "}
          <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-500 bg-clip-text text-transparent">
            how old are you?
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-2 text-[0.9rem] leading-relaxed text-slate-500 sm:text-base"
        >
          Be honest, this is important.
        </motion.p>

        <form onSubmit={submit} className="mt-7 w-full">
          <motion.input
            key={shake}
            initial={{ x: 0 }}
            animate={{ x: [0, -8, 8, -6, 6, 0] }}
            transition={{ duration: 0.35 }}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (message) setMessage(null);
            }}
            type="number"
            inputMode="numeric"
            min={0}
            max={150}
            placeholder="Your age"
            autoFocus
            className="w-full rounded-full border border-white/80 bg-white/80 px-5 py-3.5 text-center text-lg font-medium text-slate-800 shadow-sm outline-none backdrop-blur transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-200/70"
          />

          <button
            type="submit"
            className="curvy-btn curvy-btn--primary mt-4 w-full"
          >
            Continue
            <span className="curvy-btn__zig" aria-hidden />
          </button>
        </form>

        <AnimatePresence>
          {message && (
            <motion.p
              key={message}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-5 max-w-xs text-sm text-rose-500"
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}