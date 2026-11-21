"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  FastForward,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";

interface Note {
  _id: string;
  emoji: string;
  notes: string;
  order: number;
}

interface Props {
  gateToken: string | null;
  onPrevious: () => void;
  onRestart: () => void;
  adminPath?: string;
  onOpenAdmin?: () => void;
}

/* ---------- Palette (flat, soft, no shadows, no blur) ---------- */
const C = {
  ink: "#44386b", // soft plum-navy text
  inkSoft: "#7a6f9b",
  pink: "#ffb8d1",
  pinkDeep: "#ff8fb8",
  pinkPale: "#ffe4ee",
  blue: "#a8d1ff",
  blueDeep: "#6fb0ff",
  bluePale: "#e2f0ff",
  butter: "#fff0b8",
  mint: "#c9f2e1",
  white: "#ffffff",
};
const SPRINKLES = [C.pink, C.pinkDeep, C.blue, C.blueDeep, C.butter, C.mint, "#ffffff", "#d9c8ff"];

const display = { fontFamily: "'Fredoka', 'Nunito', system-ui, sans-serif" };
const body = { fontFamily: "'Nunito', system-ui, sans-serif" };

/* ---------- Little shapes ---------- */
function Heart({ size = 20, color = C.pinkDeep }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 2.7 4.5 6.3 4.5c2.1 0 3.8 1.2 5.7 3.3 1.9-2.1 3.6-3.3 5.7-3.3 3.6 0 5.4 3.8 3.9 7.2C19.5 16.4 12 21 12 21z"
        fill={color}
      />
    </svg>
  );
}
function Star({ size = 20, color = C.butter }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2.5l2.8 6.1 6.6.7-4.9 4.5 1.4 6.5L12 17l-5.9 3.3 1.4-6.5L2.6 9.3l6.6-.7L12 2.5z"
        fill={color}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Floating background decorations: flat, slow, few */
const DECOR = [
  { t: "heart", x: "6%", y: "18%", s: 26, c: C.pink, d: 7 },
  { t: "star", x: "90%", y: "14%", s: 30, c: C.butter, d: 9 },
  { t: "dot", x: "14%", y: "72%", s: 22, c: C.blue, d: 8 },
  { t: "heart", x: "88%", y: "66%", s: 34, c: C.blue, d: 10 },
  { t: "star", x: "47%", y: "6%", s: 20, c: C.pink, d: 6 },
  { t: "dot", x: "76%", y: "88%", s: 18, c: C.pink, d: 7 },
  { t: "star", x: "4%", y: "46%", s: 18, c: C.blue, d: 8 },
] as const;

function Decor({ reduce }: { reduce: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* big flat soft blobs */}
      <div
        className="absolute -left-24 -top-24 h-72 w-72 rounded-full sm:h-96 sm:w-96"
        style={{ background: C.pinkPale }}
      />
      <div
        className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full sm:h-[26rem] sm:w-[26rem]"
        style={{ background: C.bluePale }}
      />
      {DECOR.map((d, n) => (
        <motion.div
          key={n}
          className="absolute"
          style={{ left: d.x, top: d.y }}
          animate={reduce ? undefined : { y: [0, -12, 0], rotate: [-8, 8, -8] }}
          transition={{ duration: d.d, repeat: Infinity, ease: "easeInOut", delay: n * 0.4 }}
        >
          {d.t === "heart" ? (
            <Heart size={d.s} color={d.c} />
          ) : d.t === "star" ? (
            <Star size={d.s} color={d.c} />
          ) : (
            <div style={{ width: d.s, height: d.s, background: d.c, borderRadius: 999 }} />
          )}
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- Sprinkle burst: blows out of the centre, arcs, then drifts down ---------- */
type Piece = {
  id: number;
  dx: number;
  up: number;
  fall: number;
  rot: number;
  delay: number;
  dur: number;
  kind: "rod" | "dot" | "heart" | "star";
  color: string;
  size: number;
};

function makePieces(count: number, power: number, delay0: number, startId: number): Piece[] {
  return Array.from({ length: count }, (_, n) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = (0.35 + Math.random() * 0.65) * power;
    const roll = Math.random();
    return {
      id: startId + n,
      dx: Math.cos(angle) * dist,
      // bias upward so it "blows up" before falling
      up: -Math.abs(Math.sin(angle)) * dist * 0.9 - 60,
      fall: 260 + Math.random() * 420,
      rot: (Math.random() - 0.5) * 900,
      delay: delay0 + Math.random() * 0.12,
      dur: 2.4 + Math.random() * 1.6,
      kind: roll < 0.5 ? "rod" : roll < 0.75 ? "dot" : roll < 0.9 ? "heart" : "star",
      color: SPRINKLES[Math.floor(Math.random() * SPRINKLES.length)],
      size: 8 + Math.random() * 10,
    };
  });
}

function SprinkleBurst() {
  const pieces = useMemo(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 800;
    const power = Math.min(Math.max(w * 0.55, 260), 720);
    return [
      ...makePieces(70, power, 0, 0),
      ...makePieces(50, power * 1.2, 0.35, 100),
      ...makePieces(36, power * 0.8, 0.8, 200),
    ];
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <div className="absolute left-1/2 top-1/2">
        {pieces.map((p) => (
          <motion.div
            key={p.id}
            className="absolute"
            initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: [0, p.dx, p.dx * 1.12],
              y: [0, p.up, p.up + p.fall],
              scale: [0, 1, 1],
              opacity: [1, 1, 0],
              rotate: p.rot,
            }}
            transition={{
              duration: p.dur,
              delay: p.delay,
              times: [0, 0.35, 1],
              ease: ["easeOut", "easeIn"],
            }}
          >
            {p.kind === "rod" ? (
              <div
                style={{
                  width: Math.max(5, p.size * 0.5),
                  height: p.size * 1.9,
                  background: p.color,
                  borderRadius: 999,
                }}
              />
            ) : p.kind === "dot" ? (
              <div
                style={{ width: p.size * 0.8, height: p.size * 0.8, background: p.color, borderRadius: 999 }}
              />
            ) : p.kind === "heart" ? (
              <Heart size={p.size * 1.6} color={p.color} />
            ) : (
              <Star size={p.size * 1.7} color={p.color} />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Main ---------- */
export default function ThankYou({
  gateToken,
  onPrevious,
  onRestart,
  adminPath = "/admin",
  onOpenAdmin,
}: Props) {
  const [items, setItems] = useState<Note[] | null>(null);
  const [error, setError] = useState("");
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);
  const [retry, setRetry] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const rm = !!useReducedMotion();

  const total = items?.length ?? 0;
  const note = items?.[i];
  const words = note ? note.notes.trim().split(/\s+/).filter(Boolean) : [];
  const typing = shown < words.length;
  const warm = i % 2 === 0; // alternate pink / blue notes
  const accent = warm ? C.pink : C.blue;
  const accentPale = warm ? C.pinkPale : C.bluePale;

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@500;600;700;800&display=swap";
    document.head.appendChild(l);
    return () => void document.head.removeChild(l);
  }, []);

  useEffect(() => {
    if (!gateToken) return;
    let off = false;
    setError("");
    setItems(null);
    fetch("/api/content?type=thankyou", {
      headers: { Authorization: `Bearer ${gateToken}` },
    })
      .then(async (r) => {
        const j = await r.json();
        if (off) return;
        if (!r.ok || !j?.success) throw new Error(j?.error);
        setItems([...(j.data as Note[])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        setI(0);
        setDone(false);
      })
      .catch((e) => {
        if (off) return;
        setError(
          e?.message || "We couldn't load your notes. Check your connection and try again."
        );
        setItems([]);
      });
    return () => {
      off = true;
    };
  }, [gateToken, retry]);

  useEffect(() => {
    if (!note || done) return;
    setShown(0);
    let k = 0;
    let t: ReturnType<typeof setTimeout>;
    const next = () => (i + 1 < total ? setI(i + 1) : finish());
    const tick = () => {
      if (k < words.length) {
        setShown(++k);
        t = setTimeout(tick, rm ? 20 : 85);
      } else {
        t = setTimeout(next, rm ? 600 : 2200);
      }
    };
    t = setTimeout(tick, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, note?._id, done]);

  useEffect(() => {
    if (!done) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setDone(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [done]);

  const finish = () => {
    setBurstKey((k) => k + 1);
    setDone(true);
  };
  const advance = () => (i + 1 < total ? setI(i + 1) : finish());
  const back = () => i > 0 && setI(i - 1);

  useEffect(() => {
    if (done || !total) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") advance();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, total, i]);

  const goAdmin = () => (onOpenAdmin ? onOpenAdmin() : window.location.assign(adminPath));
  const replay = () => {
    setDone(false);
    setI(0);
    onRestart();
  };

  const pillBlue =
    "inline-flex h-10 items-center gap-2 rounded-full bg-[#e2f0ff] px-4 text-[14px] font-bold text-[#2f3f7a] transition-colors hover:bg-[#cfe5ff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#a8d1ff]";
  const pillPink =
    "inline-flex items-center justify-center gap-2 rounded-full bg-[#ffb8d1] font-bold text-[#4a2350] transition-colors hover:bg-[#ffa6c6] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd3e3]";

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{
        ...body,
        color: C.ink,
        background: "linear-gradient(165deg, #eef6ff 0%, #fff6fa 55%, #ffeef5 100%)",
      }}
    >
      <Decor reduce={rm} />

      {/* Header */}
      <header className="relative z-20 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <button type="button" onClick={onPrevious} className={pillBlue}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span>Back</span>
          </button>

          <h1 className="flex items-center gap-2 text-[22px] font-semibold sm:text-[26px]" style={display}>
            <Heart size={20} />
            For being you
            <Heart size={20} color={C.blueDeep} />
          </h1>

          {total > 0 && !done ? (
            <button type="button" onClick={finish} className={pillBlue}>
              <FastForward className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Skip to end</span>
              <span className="sm:hidden">Skip</span>
            </button>
          ) : (
            <span className="w-[72px]" aria-hidden />
          )}
        </div>

        {/* One heart per note: filled = read */}
        {total > 0 && (
          <div
            className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-1"
            role="progressbar"
            aria-label="Notes read"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done ? total : Math.min(i + 1, total)}
          >
            {items!.map((it, idx) => {
              const read = done || idx < i || (idx === i && !typing);
              const current = idx === i && !done;
              return (
                <button
                  key={it._id}
                  type="button"
                  aria-label={`Jump to note ${idx + 1}`}
                  onClick={() => {
                    setDone(false);
                    setI(idx);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#a8d1ff]"
                >
                  <motion.span
                    animate={{ scale: current ? 1.25 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    className="flex"
                  >
                    <Heart size={20} color={read ? C.pinkDeep : current ? C.pink : "#dfe6f5"} />
                  </motion.span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Stage */}
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-10 sm:px-6">
        {items === null ? (
          <div className="w-full rounded-[2rem] bg-white p-8" aria-label="Loading notes">
            <div className="h-5 w-1/3 animate-pulse rounded-full" style={{ background: C.pinkPale }} />
            <div className="mt-5 h-5 w-full animate-pulse rounded-full" style={{ background: C.bluePale }} />
            <div className="mt-3 h-5 w-11/12 animate-pulse rounded-full" style={{ background: C.bluePale }} />
            <div className="mt-3 h-5 w-2/3 animate-pulse rounded-full" style={{ background: C.bluePale }} />
          </div>
        ) : error || total === 0 ? (
          <div
            className="w-full rounded-[2rem] bg-white p-8 text-center"
            role={error ? "alert" : undefined}
          >
            <p className="text-[18px] font-semibold" style={display}>
              {error || "No notes here yet. Check back soon."}
            </p>
            {error && (
              <button
                type="button"
                onClick={() => setRetry((r) => r + 1)}
                className={`${pillPink} mt-5 h-11 px-6 text-[15px]`}
              >
                Try again
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.article
              key={note!._id}
              initial={rm ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={rm ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -16 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="relative w-full pt-10"
            >
              {/* Emoji sticker perched on the bubble */}
              <motion.div
                aria-hidden
                initial={rm ? false : { scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: warm ? -8 : 8 }}
                transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.1 }}
                className="absolute left-6 top-0 z-10 flex h-20 w-20 items-center justify-center rounded-full text-[40px] sm:left-10 sm:h-24 sm:w-24 sm:text-[48px]"
                style={{ background: accent, border: "5px solid #ffffff" }}
              >
                <motion.span
                  animate={rm ? undefined : { y: [0, -4, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  {note!.emoji || "✨"}
                </motion.span>
              </motion.div>

              {/* Speech bubble */}
              <div
                className="rounded-[2.25rem] bg-white px-6 pb-7 pt-16 sm:px-10 sm:pb-9 sm:pt-20"
                style={{ border: `4px solid ${accent}` }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="rounded-full px-3 py-1 text-[13px] font-bold"
                    style={{ background: accentPale, color: C.ink }}
                  >
                    Note {i + 1} of {total}
                  </span>
                  <span className="text-[13px] font-semibold" style={{ color: C.inkSoft }}>
                    {typing ? "writing…" : "done"}
                  </span>
                </div>

                <p
                  className="min-h-[8.5rem] whitespace-pre-line text-[22px] font-semibold leading-[1.65] sm:text-[27px]"
                  aria-live="off"
                >
                  {words.slice(0, shown).map((w, idx) => (
                    <motion.span
                      key={idx}
                      initial={rm ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 420, damping: 22 }}
                      className="inline-block"
                    >
                      {w}
                      {idx < words.length - 1 ? "\u00A0" : ""}
                    </motion.span>
                  ))}
                  {typing && (
                    <motion.span
                      aria-hidden
                      animate={{ scale: [1, 1.35, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="ml-1 inline-block translate-y-[0.1em]"
                    >
                      <Heart size={20} color={C.pinkDeep} />
                    </motion.span>
                  )}
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={advance}
                  className={`${pillPink} group h-12 pl-6 pr-4 text-[16px]`}
                >
                  <span>{i + 1 < total ? "Next note" : "Finish"}</span>
                  <ChevronRight
                    className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </button>
              </div>
            </motion.article>
          </AnimatePresence>
        )}
      </main>

      {/* Finale pop-up */}
      <AnimatePresence>
        {done && (
          <>
            <motion.div
              key="finale"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-5"
              style={{ background: "rgba(214, 232, 255, 0.92)" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="finale-title"
            >
              <motion.div
                initial={rm ? { opacity: 0 } : { opacity: 0, scale: 0.3, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 240, damping: 15, delay: 0.1 }}
                className="relative w-full max-w-md rounded-[2.5rem] bg-white px-6 pb-8 pt-14 text-center sm:px-9"
                style={{ border: `5px solid ${C.pink}` }}
              >
                <button
                  type="button"
                  onClick={() => setDone(false)}
                  aria-label="Close dialog"
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#e2f0ff] text-[#2f3f7a] transition-colors hover:bg-[#cfe5ff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#a8d1ff]"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>

                <motion.div
                  aria-hidden
                  animate={rm ? undefined : { rotate: [-8, 8, -8], y: [0, -6, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-11 left-1/2 flex h-[5.5rem] w-[5.5rem] -translate-x-1/2 items-center justify-center rounded-full text-[44px]"
                  style={{ background: C.butter, border: "5px solid #ffffff" }}
                >
                  🎂
                </motion.div>

                <h2
                  id="finale-title"
                  className="text-[34px] font-semibold leading-[1.1] sm:text-[40px]"
                  style={display}
                >
                  With all my heart, always.
                </h2>

                <p className="mx-auto mt-3 max-w-xs text-[18px] font-semibold leading-snug" style={{ color: C.inkSoft }}>
                  Happy birthday, Meri Jan. Thank you for every moment.
                  and extremely sorry for this much delay....
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={goAdmin} className={`${pillPink} h-12 flex-1 px-5 text-[15px]`}>
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                    <span>Open admin panel</span>
                  </button>
                  <button
                    type="button"
                    onClick={replay}
                    className={`${pillBlue} h-12 flex-1 justify-center px-5 text-[15px]`}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    <span>Read again</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>

            {!rm && <SprinkleBurst key={burstKey} />}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
