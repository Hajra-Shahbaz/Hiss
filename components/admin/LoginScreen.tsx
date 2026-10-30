"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Delete,
  Heart,
  Loader2,
  LockKeyhole,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const CUTE_LINES = [
  "Every little memory has a place here.",
  "Some things are only for your eyes.",
  "I built this while thinking of you.",
  "Take your time — it's yours.",
  "There's a reason all this exists.",
];

const ATTEMPT_HINTS = [
  "Unlock your panel to continue",
  "Yeh koi date nahi hai, bas password hai.",
  "Mere laptop ka password enter karo.",
  "WhatsApp par zara milain aa kar.",
];

const STICKERS = [
  "/WhatsApp Sticker 2026-10-30 at 2.21.09 PM",
  "/WhatsApp Sticker 2026-10-30 at 2.22.13 PM",
  "/WhatsApp Sticker 2026-10-30 at 2.21.17 PM",
  "/WhatsApp Sticker 2026-10-30 at 2.21.23 PM",
];

const SUCCESS_STICKER = "/WhatsApp Sticker 2026-10-30 at 2.21.09 PM";

const FLOATERS = [
  { top: "10%", left: "14%", size: 14, delay: 0, duration: 10 },
  { top: "22%", left: "80%", size: 10, delay: 1.4, duration: 12 },
  { top: "68%", left: "10%", size: 12, delay: 2.2, duration: 11 },
  { top: "80%", left: "84%", size: 16, delay: 0.8, duration: 13 },
  { top: "46%", left: "90%", size: 8, delay: 1.9, duration: 14 },
  { top: "56%", left: "8%", size: 10, delay: 2.7, duration: 10.5 },
];

const MAX_LEN = 5;
const MAX_ATTEMPTS = 3;
const LOCK_SECONDS = 30;
const SUCCESS_HOLD_MS = 1400;

// Royal blue + soft pink palette
const COLORS = {
  bg: "#fbf6f5",
  navy: "#0f2a5c",
  navyDeep: "#0a1f47",
  pink: "#f472b6",
  pinkDeep: "#ec4899",
  pinkSoft: "#fce7f3",
};

// ─────────────────────────────────────────────
// Login screen
// ─────────────────────────────────────────────
export default function LoginScreen({
  onLoggedIn,
}: {
  onLoggedIn: (token: string) => void;
}) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);

  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [lockTick, setLockTick] = useState(0);

  const [success, setSuccess] = useState(false);
  const [successToken, setSuccessToken] = useState<string | null>(null);

  const wrongCount = MAX_ATTEMPTS - attemptsLeft;
  const locked = lockUntil !== null && Date.now() < lockUntil;

  useEffect(() => {
    const id = window.setInterval(
      () => setLineIndex((i) => (i + 1) % CUTE_LINES.length),
      4500,
    );
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!lockUntil) return;
    const id = window.setInterval(() => {
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      setLockTick(remaining);
      if (remaining <= 0) {
        setLockUntil(null);
        setAttemptsLeft(MAX_ATTEMPTS);
        window.clearInterval(id);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [lockUntil]);

  useEffect(() => {
    if (!success || !successToken) return;
    const id = window.setTimeout(() => {
      onLoggedIn(successToken);
    }, SUCCESS_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [success, successToken, onLoggedIn]);

  const triggerLock = useCallback(() => {
    const until = Date.now() + LOCK_SECONDS * 1000;
    setLockUntil(until);
    setLockTick(LOCK_SECONDS);
    setError(`Too many attempts. Try again in ${LOCK_SECONDS}s.`);
    setPin("");
  }, []);

  const submit = useCallback(
    async (value: string) => {
      if (busy || !value || locked || success) return;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: value }),
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          const next = attemptsLeft - 1;
          setAttemptsLeft(Math.max(0, next));
          setShake((s) => s + 1);
          setPin("");
          if (next <= 0) triggerLock();
          else
            setError(
              json?.error ??
                `Wrong PIN — ${next} attempt${next === 1 ? "" : "s"} left.`,
            );
          return;
        }
        setSuccessToken(json.data.token as string);
        setSuccess(true);
      } catch {
        const next = attemptsLeft - 1;
        setAttemptsLeft(Math.max(0, next));
        setShake((s) => s + 1);
        setPin("");
        if (next <= 0) triggerLock();
        else
          setError(
            `Network error — ${next} attempt${next === 1 ? "" : "s"} left.`,
          );
      } finally {
        setBusy(false);
      }
    },
    [busy, locked, attemptsLeft, onLoggedIn, triggerLock, success],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (busy || locked || success) return;
      if (/^[0-9]$/.test(e.key)) {
        setPin((p) => (p.length < MAX_LEN ? p + e.key : p));
      } else if (e.key === "Backspace") {
        setPin((p) => p.slice(0, -1));
      } else if (e.key === "Enter") {
        if (pin.length >= 1) submit(pin);
      } else if (e.key === "Escape") {
        setPin("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pin, busy, locked, submit, success]);

  const pressDigit = (d: string) => {
    if (busy || locked || success) return;
    if (error && !locked) setError(null);
    setPin((p) => (p.length < MAX_LEN ? p + d : p));
  };
  const backspace = () => {
    if (busy || locked || success) return;
    if (error && !locked) setError(null);
    setPin((p) => p.slice(0, -1));
  };
  const clear = () => {
    if (busy || locked || success) return;
    if (error && !locked) setError(null);
    setPin("");
  };
  const doSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (pin.length >= 1 && !locked && !success) submit(pin);
  };

  const hintLine = ATTEMPT_HINTS[Math.min(wrongCount, ATTEMPT_HINTS.length - 1)];
  const stickerSrc = STICKERS[Math.min(wrongCount, STICKERS.length - 1)];

  // ─────────────────────────────────────────────
  // SUCCESS SCREEN
  // ─────────────────────────────────────────────
  if (success) {
    return (
      <div
        className="relative flex h-dvh w-full items-center justify-center overflow-hidden px-6"
        style={{
          backgroundColor: COLORS.bg,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-40 -left-24 h-80 w-80 rounded-full"
          style={{ backgroundColor: COLORS.pinkSoft, opacity: 0.6 }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full"
          style={{ backgroundColor: COLORS.navy, opacity: 0.08 }}
        />

        {FLOATERS.map((f, i) => (
          <motion.div
            key={i}
            className="pointer-events-none absolute"
            style={{ top: f.top, left: f.left, color: COLORS.pink }}
            animate={{
              y: [0, -18, 0],
              rotate: [0, 8, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: f.duration,
              delay: f.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Heart
              style={{ width: f.size, height: f.size }}
              fill="currentColor"
              strokeWidth={0}
            />
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[400px]"
        >
          <div className="relative rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(15,42,92,0.15)] sm:p-8">
            <motion.div
              initial={{ scale: 0.85, rotate: -4 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.1,
                type: "spring",
                stiffness: 180,
                damping: 16,
              }}
              className="relative mx-auto mb-5 w-full max-w-[180px] sm:mb-6 sm:max-w-[200px]"
            >
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50 p-1.5">
                <div className="overflow-hidden rounded-lg bg-white">
                  <StickerImage
                    src={SUCCESS_STICKER}
                    wrongCount={0}
                    fallbackEmoji="💝"
                  />
                </div>
              </div>
            </motion.div>

            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 240,
                  damping: 18,
                }}
                className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl sm:h-11 sm:w-11"
                style={{ backgroundColor: COLORS.pink }}
              >
                <Heart className="h-5 w-5 text-white" fill="currentColor" />
              </motion.div>
              <h2 className="text-lg font-semibold tracking-tight text-stone-900">
                You're in
              </h2>
              <p className="mt-1 text-[13px] text-stone-500">
                Opening your panel…
              </p>
            </div>

            <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-stone-100">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: SUCCESS_HOLD_MS / 1000,
                  ease: "linear",
                }}
                className="h-full rounded-full"
                style={{ backgroundColor: COLORS.pink }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────────
  return (
    <div
      className="flex h-dvh min-h-0 w-full flex-col overflow-hidden lg:flex-row"
      style={{
        backgroundColor: COLORS.bg,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* ───────────── LEFT / TOP PANEL ───────────── */}
      <div
        className="relative flex w-full flex-col overflow-hidden lg:w-1/2 lg:justify-between lg:p-10"
        style={{ backgroundColor: COLORS.navy }}
      >
        {/* Subtle grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Floating hearts */}
        {FLOATERS.map((f, i) => (
          <motion.div
            key={i}
            className="pointer-events-none absolute"
            style={{ top: f.top, left: f.left, color: COLORS.pink }}
            animate={{
              y: [0, -18, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: f.duration,
              delay: f.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Heart
              style={{ width: f.size, height: f.size }}
              fill="currentColor"
              strokeWidth={0}
            />
          </motion.div>
        ))}

        {/* ───── MOBILE COMPACT HEADER ───── */}
        <div className="relative flex items-center justify-between gap-3 px-4 pt-4 pb-2 lg:hidden">
          {/* Brand + sticker combined pill */}
          <motion.div
            key={wrongCount}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-w-0 items-center gap-2.5 rounded-2xl border p-1.5 pr-3.5"
            style={{
              borderColor: "rgba(255,255,255,0.12)",
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="h-9 w-9 shrink-0 overflow-hidden rounded-lg"
              style={{ backgroundColor: COLORS.navyDeep }}
            >
              <StickerImage src={stickerSrc} wrongCount={wrongCount} />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold leading-tight tracking-tight text-white">
                Admin Panel
              </p>
              <p className="text-[10px] leading-tight text-stone-400">
                Private access
              </p>
            </div>
          </motion.div>

          {/* Compact heart indicator */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: "rgba(244,114,182,0.18)",
              boxShadow: "inset 0 0 0 1px rgba(244,114,182,0.35)",
            }}
          >
            <Heart
              className="h-4 w-4"
              style={{ color: COLORS.pink }}
              fill="currentColor"
              strokeWidth={0}
            />
          </div>
        </div>

        {/* Mobile rotating line — reserved height, no layout shift */}
        <div className="relative min-h-[2.5rem] overflow-hidden px-4 pb-3 lg:hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={lineIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-[13px] font-medium leading-snug text-white/90"
            >
              {CUTE_LINES[lineIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* ───── DESKTOP FULL PANEL ───── */}
        <div className="relative hidden flex-col lg:flex lg:h-full lg:justify-between">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative flex items-center gap-3"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{
                backgroundColor: "rgba(244,114,182,0.18)",
                boxShadow: "inset 0 0 0 1px rgba(244,114,182,0.35)",
              }}
            >
              <Heart
                className="h-4 w-4"
                style={{ color: COLORS.pink }}
                fill="currentColor"
                strokeWidth={0}
              />
            </div>
            <div>
              <p className="text-[13px] font-semibold tracking-tight text-white">
                Admin Panel
              </p>
              <p className="text-[11px] text-stone-400">Private access</p>
            </div>
          </motion.div>

          {/* Center content */}
          <div className="relative flex flex-col items-center">
            <motion.div
              key={wrongCount}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative mb-8 w-full max-w-[220px]"
            >
              <div
                className="overflow-hidden rounded-xl border p-1.5"
                style={{
                  borderColor: "rgba(255,255,255,0.15)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                }}
              >
                <div
                  className="overflow-hidden rounded-lg"
                  style={{ backgroundColor: COLORS.navyDeep }}
                >
                  <StickerImage src={stickerSrc} wrongCount={wrongCount} />
                </div>
              </div>
            </motion.div>

            <div className="w-full text-center">
              <div
                className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-wider"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                <Sparkles className="h-3 w-3" />
                Just between us
              </div>

              <div className="relative h-20">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={lineIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 text-xl font-medium leading-snug tracking-tight text-white"
                  >
                    {CUTE_LINES[lineIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="mt-3 flex items-center justify-center gap-1.5">
                {CUTE_LINES.map((_, i) => (
                  <span
                    key={i}
                    className={`h-[3px] rounded-full transition-all duration-500 ${
                      i === lineIndex ? "w-6" : "w-1.5"
                    }`}
                    style={{
                      backgroundColor:
                        i === lineIndex
                          ? COLORS.pink
                          : "rgba(255,255,255,0.2)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="relative flex items-center gap-2 text-[11px] text-stone-500"
          >
            <LockKeyhole className="h-3 w-3" />
            Session stays on this device.
          </motion.div>
        </div>
      </div>

      {/* ───────────── RIGHT / BOTTOM PANEL ───────────── */}
      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-y-auto px-4 py-4 sm:px-10 sm:py-8 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="my-auto w-full max-w-[400px]"
        >
          <div className="relative rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(15,42,92,0.12)] sm:p-7 lg:p-8">
            {/* Attempt hearts + sparkle */}
            <div className="mb-3 flex items-center justify-between lg:mb-6">
              <div className="flex items-center gap-1">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => {
                  const filled = i < attemptsLeft;
                  return (
                    <Heart
                      key={i}
                      className="h-3 w-3 transition"
                      style={{
                        color: filled ? COLORS.pink : "#e7e5e4",
                      }}
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  );
                })}
              </div>
              <Sparkles
                className="h-3.5 w-3.5"
                style={{ color: COLORS.navy, opacity: 0.5 }}
              />
            </div>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.1,
                type: "spring",
                stiffness: 200,
                damping: 16,
              }}
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl shadow-[0_4px_14px_-4px_rgba(244,114,182,0.6)] sm:h-12 sm:w-12"
              style={{ backgroundColor: COLORS.pink }}
            >
              <LockKeyhole
                className="h-5 w-5 text-white"
                strokeWidth={2.2}
              />
            </motion.div>

            {/* Header */}
            <div className="mt-2 text-center lg:mt-4">
              <h1
                className="text-[16px] font-semibold tracking-tight sm:text-lg"
                style={{ color: COLORS.navy }}
              >
                Enter your PIN
              </h1>
              <AnimatePresence mode="wait">
                <motion.p
                  key={hintLine}
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.25 }}
                  className="mt-1 min-h-[1.15rem] text-[12.5px] text-stone-500 sm:text-[13px]"
                >
                  {locked ? "Whatsapp pr milain zra ap." : hintLine}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* PIN slots */}
            <motion.div
              key={shake}
              animate={{ x: [0, -7, 7, -5, 5, 0] }}
              transition={{ duration: 0.35 }}
              className="mt-4 flex justify-center gap-2 lg:mt-6"
            >
              {Array.from({ length: MAX_LEN }).map((_, i) => {
                const filled = i < pin.length;
                return (
                  <motion.span
                    key={i}
                    animate={filled ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border transition sm:h-11 sm:w-11"
                    style={{
                      borderColor: filled ? COLORS.pink : "#e7e5e4",
                      backgroundColor: filled ? COLORS.pinkSoft : "#fafaf9",
                    }}
                  >
                    {filled ? (
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: COLORS.pinkDeep }}
                      />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                    )}
                  </motion.span>
                );
              })}
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  key={error}
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  className={`mt-3 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-center text-[12px] font-medium ${
                    locked
                      ? "bg-amber-50 text-amber-700"
                      : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {locked && <ShieldAlert className="h-3 w-3" />}
                  {locked ? `Locked — retry in ${lockTick}s` : error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Keypad */}
            <form onSubmit={doSubmit} className="mt-3 lg:mt-5">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                  <KeyButton
                    key={d}
                    label={d}
                    onClick={() => pressDigit(d)}
                    disabled={busy || locked}
                  />
                ))}

                <KeyButton
                  variant="muted"
                  onClick={clear}
                  disabled={busy || locked || pin.length === 0}
                  ariaLabel="Clear"
                >
                  <X className="h-4 w-4" />
                </KeyButton>

                <KeyButton
                  label="0"
                  onClick={() => pressDigit("0")}
                  disabled={busy || locked}
                />

                <KeyButton
                  variant="muted"
                  onClick={backspace}
                  disabled={busy || locked || pin.length === 0}
                  ariaLabel="Backspace"
                >
                  <Delete className="h-4 w-4" />
                </KeyButton>
              </div>

              {/* ───── SHINY UNLOCK BUTTON ───── */}
              <ShinyButton
                type="submit"
                disabled={busy || locked || pin.length < 1}
              >
                {locked ? (
                  <>
                    <ShieldAlert className="h-4 w-4" />
                    Locked · {lockTick}s
                  </>
                ) : busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Unlocking…
                  </>
                ) : (
                  <>
                    Unlock
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </ShinyButton>
            </form>

            <p className="mt-2.5 text-center text-[10px] text-stone-400 sm:mt-4 sm:text-[11px]">
              Use your keyboard —{" "}
              <span className="font-medium text-stone-500">Enter</span> to unlock
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ShinyButton — glossy surface with continuous sheen
// ─────────────────────────────────────────────
function ShinyButton({
  children,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="group relative mt-3 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-transform duration-150 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 sm:mt-4 sm:py-3"
      style={{
        background:
          "linear-gradient(180deg, #1a3d75 0%, #0f2a5c 45%, #0a1f47 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.2), 0 6px 16px -6px rgba(15,42,92,0.55)",
      }}
    >
      {/* Top glossy highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)",
        }}
      />

      {/* Moving sheen (shine sweep) */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute top-0 h-full w-1/3 -skew-x-12"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
        }}
        initial={{ x: "-120%" }}
        animate={{ x: "420%" }}
        transition={{
          duration: 2.6,
          repeat: Infinity,
          repeatDelay: 1.4,
          ease: "easeInOut",
        }}
      />

      {/* Content */}
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
// StickerImage
// ─────────────────────────────────────────────
function StickerImage({
  src,
  wrongCount,
  fallbackEmoji,
}: {
  src: string;
  wrongCount: number;
  fallbackEmoji?: string;
}) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  if (broken) {
    const fallbacks = ["💝", "🙈", "🤫", "📱"];
    const emoji =
      fallbackEmoji ?? fallbacks[Math.min(wrongCount, fallbacks.length - 1)];
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 bg-stone-100 p-3">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="text-2xl sm:text-4xl"
        >
          {emoji}
        </motion.div>
        <p className="hidden text-center text-[10px] font-medium text-stone-500 sm:block">
          {wrongCount === 0
            ? "sticker-normal.png"
            : wrongCount === 1
              ? "sticker-wrong1.png"
              : wrongCount === 2
                ? "sticker-wrong2.png"
                : "sticker-wrong3.png"}
        </p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      onError={() => setBroken(true)}
      className="block h-auto w-full"
      draggable={false}
    />
  );
}

// ─────────────────────────────────────────────
// KeyButton
// ─────────────────────────────────────────────
function KeyButton({
  label,
  onClick,
  disabled,
  variant = "default",
  ariaLabel,
  children,
}: {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "muted";
  ariaLabel?: string;
  children?: React.ReactNode;
}) {
  const base =
    "flex h-10 items-center justify-center rounded-lg text-[15px] font-medium transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 sm:h-12";

  const styles =
    variant === "muted"
      ? "border border-stone-200 bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
      : "border border-stone-200 bg-white text-stone-800 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      className={`${base} ${styles}`}
    >
      {children ?? label}
    </button>
  );
}