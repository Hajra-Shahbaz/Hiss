"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  KeyRound,
  Loader2,
  ArrowLeft,
  Unlock,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
} from "lucide-react";

interface Props {
  alreadyVerified: boolean;
  onVerified: (token: string) => void;
  onSkip: () => void;
  onBack: () => void;
}

const INK = "#43305c";
const INK_SOFT = "#85759a";
const ROSE = "#e0829f";
const LAV = "#9d86e0";
const GRAD = "linear-gradient(135deg,#e0829f,#9d86e0)";
const EYE = "#2a1c22";

type Mood = "idle" | "happy" | "angry" | "hurt" | "sad" | "cry" | "bawl";
type Kind = "girl" | "boy";

const PALETTE: Record<
  Kind,
  {
    light: string;
    base: string;
    dark: string;
    inner: string;
    belly: string;
    muzzle: string;
    pad: string;
  }
> = {
  girl: {
    light: "#f2cb9b",
    base: "#d9a066",
    dark: "#a56a3b",
    inner: "#f4b9c6",
    belly: "#f6dfc3",
    muzzle: "#fbece0",
    pad: "#e9a6b4",
  },
  boy: {
    light: "#cc986d",
    base: "#a8734b",
    dark: "#6b4326",
    inner: "#dcae95",
    belly: "#ead0b2",
    muzzle: "#f2dec8",
    pad: "#c98a86",
  },
};

/* ------------------------------------------------------------------ */
/*  CSS keyframes used inside the SVG bears                            */
/* ------------------------------------------------------------------ */
const BEAR_CSS = `
.tb-blink{transform-box:fill-box;transform-origin:center;animation:tb-blink 4.6s infinite}
@keyframes tb-blink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}

.tb-sob{transform-box:view-box;transform-origin:60px 125px;animation:tb-sob .3s ease-in-out infinite alternate}
@keyframes tb-sob{from{transform:translateY(0) rotate(-1.6deg)}to{transform:translateY(2.5px) rotate(1.6deg)}}

.tb-tear{animation:tb-tear 1.3s ease-in infinite}
@keyframes tb-tear{
  0%{transform:translateY(0) scale(.4);opacity:0}
  15%{transform:translateY(2px) scale(1);opacity:1}
  100%{transform:translateY(30px) scale(.9);opacity:0}
}

.tb-stream{animation:tb-stream .8s ease-in-out infinite alternate}
@keyframes tb-stream{from{opacity:.45}to{opacity:.85}}

.tb-wipe-l{transform-box:view-box;transform-origin:34px 80px;animation:tb-wipe-l .42s ease-in-out infinite alternate}
@keyframes tb-wipe-l{from{transform:rotate(-152deg)}to{transform:rotate(-166deg)}}
.tb-wipe-r{transform-box:view-box;transform-origin:86px 80px;animation:tb-wipe-r .42s ease-in-out .1s infinite alternate}
@keyframes tb-wipe-r{from{transform:rotate(152deg)}to{transform:rotate(166deg)}}

.tb-punch{transform-box:view-box;transform-origin:86px 80px;animation:tb-punch .6s ease-in-out forwards}
@keyframes tb-punch{
  0%{transform:rotate(0)}
  28%{transform:rotate(34deg)}
  52%{transform:rotate(-86deg)}
  74%{transform:rotate(-86deg)}
  100%{transform:rotate(0)}
}

@media (prefers-reduced-motion: reduce){
  .tb-blink,.tb-sob,.tb-tear,.tb-stream,.tb-wipe-l,.tb-wipe-r,.tb-punch{animation:none!important}
}
`;

/* ------------------------------------------------------------------ */
/*  A single teardrop that falls from the eye                          */
/* ------------------------------------------------------------------ */
function Drop({
  x,
  y,
  delay = 0,
  dur = 1.3,
}: {
  x: number;
  y: number;
  delay?: number;
  dur?: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g
        className="tb-tear"
        style={{ animationDelay: `${delay}s`, animationDuration: `${dur}s` }}
      >
        <path
          d="M0 -5C2.6 -1.6 3.8 0.6 3.8 2.4A3.8 3.8 0 0 1 -3.8 2.4C-3.8 0.6 -2.6 -1.6 0 -5Z"
          fill="#8fd0ff"
          stroke="#ffffff"
          strokeWidth="0.7"
          strokeOpacity="0.85"
        />
        <ellipse cx="-1.2" cy="1.2" rx="0.9" ry="1.4" fill="#fff" opacity="0.8" />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Teddy bear (one component, two characters, many moods)             */
/* ------------------------------------------------------------------ */
function Bear({
  kind,
  mood,
  punching,
  punchKey,
}: {
  kind: Kind;
  mood: Mood;
  punching: boolean;
  punchKey: number;
}) {
  const p = PALETTE[kind];
  const fur = `url(#fur-${kind})`;
  const grain = `url(#grain-${kind})`;
  const stroke = p.dark;

  const normalEyes =
    mood === "idle" || mood === "angry" || mood === "sad" || mood === "cry";
  const bigEyes = mood === "sad" || mood === "cry";
  const watery = mood === "sad" || mood === "cry";

  const leftWipe = mood === "cry" || mood === "bawl";
  const rightWipe = mood === "bawl";

  const Eye = ({ cx }: { cx: number }) => (
    <g>
      <ellipse
        cx={cx}
        cy={46}
        rx={bigEyes ? 5.4 : 4.3}
        ry={bigEyes ? 6.2 : 5}
        fill={EYE}
      />
      <circle cx={cx + 1.5} cy={bigEyes ? 43.8 : 44.4} r={bigEyes ? 2.1 : 1.5} fill="#fff" />
      <circle cx={cx - 1.5} cy={bigEyes ? 49 : 48} r={0.85} fill="#fff" opacity="0.85" />
      {watery && (
        <ellipse cx={cx} cy={50.5} rx={4.6} ry={1.7} fill="#bfe5ff" opacity="0.6" />
      )}
    </g>
  );

  return (
    <svg viewBox="0 0 120 130" className="tb-svg h-32 w-32 overflow-visible" aria-hidden>
      <defs>
        <radialGradient id={`fur-${kind}`} cx="0.36" cy="0.28" r="0.85">
          <stop offset="0" stopColor={p.light} />
          <stop offset="0.55" stopColor={p.base} />
          <stop offset="1" stopColor={p.dark} />
        </radialGradient>
        <radialGradient id={`belly-${kind}`} cx="0.4" cy="0.3" r="0.9">
          <stop offset="0" stopColor={p.muzzle} />
          <stop offset="1" stopColor={p.belly} />
        </radialGradient>
        <radialGradient id={`muzzle-${kind}`} cx="0.4" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.35" stopColor={p.muzzle} />
          <stop offset="1" stopColor={p.belly} />
        </radialGradient>
        <radialGradient id={`ear-${kind}`} cx="0.5" cy="0.6" r="0.7">
          <stop offset="0" stopColor={p.inner} />
          <stop offset="1" stopColor={p.dark} stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id={`ribbon-${kind}`} x1="0" y1="0" x2="1" y2="1">
          {kind === "girl" ? (
            <>
              <stop offset="0" stopColor="#ff9cbb" />
              <stop offset="1" stopColor="#df4f7e" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#9acdf7" />
              <stop offset="1" stopColor="#4a88cc" />
            </>
          )}
        </linearGradient>
        <filter id={`grain-${kind}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4" result="n" />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0.25  0 0 0 0 0.14  0 0 0 0 0.07  0 0 0 1.1 -0.38"
          />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {/* ground shadow */}
      <ellipse cx="60" cy="124" rx="34" ry="5" fill="#43305c" opacity="0.16" />

      <g className={mood === "bawl" ? "tb-sob" : undefined}>
        {/* feet */}
        <ellipse cx="38" cy="113" rx="15" ry="11" fill={fur} stroke={stroke} strokeOpacity="0.35" />
        <ellipse cx="82" cy="113" rx="15" ry="11" fill={fur} stroke={stroke} strokeOpacity="0.35" />
        <ellipse cx="38" cy="116" rx="8" ry="5.8" fill={p.pad} opacity="0.9" />
        <ellipse cx="82" cy="116" rx="8" ry="5.8" fill={p.pad} opacity="0.9" />

        {/* ears */}
        <circle cx="30" cy="28" r="13.5" fill={fur} stroke={stroke} strokeOpacity="0.35" />
        <circle cx="90" cy="28" r="13.5" fill={fur} stroke={stroke} strokeOpacity="0.35" />
        <circle cx="30.5" cy="29" r="7.5" fill={`url(#ear-${kind})`} />
        <circle cx="89.5" cy="29" r="7.5" fill={`url(#ear-${kind})`} />

        {/* body */}
        <ellipse cx="60" cy="92" rx="30" ry="28" fill={fur} stroke={stroke} strokeOpacity="0.35" />
        <ellipse cx="60" cy="92" rx="30" ry="28" fill="#000" filter={grain} />
        <ellipse cx="60" cy="97" rx="18.5" ry="18" fill={`url(#belly-${kind})`} />
        <path
          d="M60 82V112"
          stroke={p.dark}
          strokeOpacity="0.28"
          strokeWidth="1.1"
          strokeDasharray="2.2 2.4"
          strokeLinecap="round"
        />

        {/* chin shadow on body */}
        <ellipse cx="60" cy="82" rx="24" ry="6" fill="#000" opacity="0.14" />

        {/* head */}
        <circle cx="60" cy="50" r="32" fill={fur} stroke={stroke} strokeOpacity="0.35" />
        <circle cx="60" cy="50" r="32" fill="#000" filter={grain} />
        <ellipse
          cx="45"
          cy="30"
          rx="14"
          ry="7"
          fill="#fff"
          opacity="0.2"
          transform="rotate(-28 45 30)"
        />
        {/* fur tufts */}
        <g stroke={p.dark} strokeOpacity="0.3" strokeWidth="1.1" strokeLinecap="round" fill="none">
          <path d="M29 52q-3 1.5-4 4.5" />
          <path d="M30 59q-3.5 1-4.5 4" />
          <path d="M91 52q3 1.5 4 4.5" />
          <path d="M90 59q3.5 1 4.5 4" />
          <path d="M52 20q1.5-3 4.5-3.5" />
          <path d="M64 19q2-3 5-3" />
        </g>

        {/* muzzle */}
        <ellipse cx="60" cy="61" rx="15" ry="11.5" fill={`url(#muzzle-${kind})`} stroke={stroke} strokeOpacity="0.18" />

        {/* cheeks */}
        <ellipse cx="37" cy="58" rx="6.5" ry="3.8" fill="#ff8fab" opacity={mood === "angry" ? 0.25 : 0.5} />
        <ellipse cx="83" cy="58" rx="6.5" ry="3.8" fill="#ff8fab" opacity={mood === "angry" ? 0.25 : 0.5} />

        {/* nose */}
        <path
          d="M53.5 53Q60 48.5 66.5 53Q66.5 59.5 60 62Q53.5 59.5 53.5 53Z"
          fill="#2f2026"
        />
        <ellipse cx="57.6" cy="53" rx="2.4" ry="1.2" fill="#fff" opacity="0.55" />

        {/* eyes */}
        {normalEyes && (
          <g className="tb-blink">
            <Eye cx={46} />
            <Eye cx={74} />
          </g>
        )}
        {mood === "happy" && (
          <g stroke={EYE} strokeWidth="2.8" strokeLinecap="round" fill="none">
            <path d="M40.5 48Q46 40.5 51.5 48" />
            <path d="M68.5 48Q74 40.5 79.5 48" />
          </g>
        )}
        {mood === "hurt" && (
          <g>
            <ellipse cx="46" cy="46" rx="6" ry="6.5" fill="#fff" stroke={EYE} strokeWidth="1.4" />
            <ellipse cx="74" cy="46" rx="6" ry="6.5" fill="#fff" stroke={EYE} strokeWidth="1.4" />
            <circle cx="46.5" cy="47" r="1.9" fill={EYE} />
            <circle cx="73.5" cy="47" r="1.9" fill={EYE} />
          </g>
        )}
        {mood === "bawl" && (
          <g stroke={EYE} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d="M40 41L51 46L40 51" />
            <path d="M80 41L69 46L80 51" />
          </g>
        )}

        {/* girl lashes */}
        {kind === "girl" && (normalEyes || mood === "happy") && (
          <g stroke={EYE} strokeWidth="1.5" strokeLinecap="round">
            <path d="M41.5 43L38.2 41" />
            <path d="M41 46.5L37.5 46.5" />
            <path d="M78.5 43L81.8 41" />
            <path d="M79 46.5L82.5 46.5" />
          </g>
        )}

        {/* brows */}
        {mood === "angry" && (
          <g stroke={p.dark} strokeWidth="3" strokeLinecap="round">
            <path d="M38 36L53 42" />
            <path d="M82 36L67 42" />
          </g>
        )}
        {(mood === "sad" || mood === "cry" || mood === "bawl") && (
          <g stroke={p.dark} strokeWidth="2.8" strokeLinecap="round">
            <path d="M39 40L52 34.5" />
            <path d="M81 40L68 34.5" />
          </g>
        )}
        {mood === "hurt" && (
          <g stroke={p.dark} strokeWidth="2.6" strokeLinecap="round" fill="none">
            <path d="M39.5 35Q46 31 52.5 35" />
            <path d="M80.5 35Q74 31 67.5 35" />
          </g>
        )}

        {/* mouth */}
        <g stroke={EYE} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {(mood === "idle" || mood === "happy") && mood === "idle" && (
            <>
              <path d="M60 62V65" />
              <path d="M60 65Q56.5 70 52 66.5" />
              <path d="M60 65Q63.5 70 68 66.5" />
            </>
          )}
          {mood === "angry" && (
            <>
              <path d="M60 62V65" />
              <path d="M52.5 70Q60 65.5 67.5 70" />
            </>
          )}
          {mood === "sad" && (
            <>
              <path d="M60 62V65" />
              <path d="M53 71Q60 65.5 67 71" />
            </>
          )}
          {mood === "cry" && (
            <>
              <path d="M60 62V65" />
              <path d="M51.5 72Q55.7 66.5 60 70Q64.3 66.5 68.5 72" />
            </>
          )}
        </g>
        {mood === "happy" && (
          <g>
            <path d="M60 62V64" stroke={EYE} strokeWidth="2.1" strokeLinecap="round" />
            <path d="M51 65Q60 78 69 65Z" fill="#5a2b3d" stroke={EYE} strokeWidth="1.6" strokeLinejoin="round" />
            <ellipse cx="60" cy="71.5" rx="5" ry="2.6" fill="#ee8aa0" />
          </g>
        )}
        {mood === "hurt" && (
          <ellipse cx="60" cy="69" rx="3.8" ry="4.8" fill="#5a2b3d" stroke={EYE} strokeWidth="1.5" />
        )}
        {mood === "bawl" && (
          <g>
            <path d="M60 62V64" stroke={EYE} strokeWidth="2.1" strokeLinecap="round" />
            <path
              d="M48 66Q60 62 72 66Q70 82 60 82Q50 82 48 66Z"
              fill="#5a2b3d"
              stroke={EYE}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <ellipse cx="60" cy="77.5" rx="6.5" ry="3.6" fill="#ee8aa0" />
          </g>
        )}

        {/* accessories */}
        {kind === "girl" && (
          <g transform="rotate(14 80 22)">
            <path
              d="M80 22C73 11 64 13 64 21C64 30 73 33 80 22Z"
              fill={`url(#ribbon-girl)`}
              stroke="#c13b6a"
              strokeOpacity="0.5"
              strokeWidth="0.8"
            />
            <path
              d="M80 22C87 11 96 13 96 21C96 30 87 33 80 22Z"
              fill={`url(#ribbon-girl)`}
              stroke="#c13b6a"
              strokeOpacity="0.5"
              strokeWidth="0.8"
            />
            <path d="M70 18Q73 22 71 27" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <circle cx="80" cy="22" r="4.4" fill="#d9476f" stroke="#c13b6a" strokeOpacity="0.5" strokeWidth="0.8" />
            <circle cx="78.8" cy="20.8" r="1.2" fill="#fff" opacity="0.6" />
          </g>
        )}
        {kind === "boy" && (
          <g>
            <path
              d="M60 84L45 76Q42 84 45 92Z"
              fill={`url(#ribbon-boy)`}
              stroke="#3a6fa8"
              strokeOpacity="0.5"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            <path
              d="M60 84L75 76Q78 84 75 92Z"
              fill={`url(#ribbon-boy)`}
              stroke="#3a6fa8"
              strokeOpacity="0.5"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            <rect x="55.5" y="79" width="9" height="10" rx="3.5" fill="#4a88cc" stroke="#3a6fa8" strokeOpacity="0.5" strokeWidth="0.8" />
            <path d="M48 79Q47 84 48 88" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.1" fill="none" strokeLinecap="round" />
          </g>
        )}

        {/* left arm */}
        <g className={leftWipe ? "tb-wipe-l" : undefined}>
          <g transform="rotate(10 34 80)">
            <ellipse cx="30" cy="96" rx="9.5" ry="17" fill={fur} stroke={stroke} strokeOpacity="0.35" />
            <ellipse cx="30" cy="109" rx="5.6" ry="4.4" fill={p.pad} opacity="0.9" />
          </g>
        </g>

        {/* right arm (punches for the girl bear) */}
        <g
          key={`rarm-${punchKey}`}
          className={
            punching && kind === "girl" ? "tb-punch" : rightWipe ? "tb-wipe-r" : undefined
          }
        >
          <g transform="rotate(-10 86 80)">
            <ellipse cx="90" cy="96" rx="9.5" ry="17" fill={fur} stroke={stroke} strokeOpacity="0.35" />
            <ellipse cx="90" cy="109" rx="5.6" ry="4.4" fill={p.pad} opacity="0.9" />
          </g>
        </g>

        {/* tears sit above everything */}
        {mood === "cry" && (
          <g>
            <Drop x={41} y={53} delay={0} dur={1.4} />
            <Drop x={79} y={53} delay={0.5} dur={1.4} />
            <Drop x={43} y={53} delay={0.95} dur={1.4} />
            <Drop x={77} y={53} delay={1.2} dur={1.4} />
          </g>
        )}
        {mood === "bawl" && (
          <g>
            <path
              className="tb-stream"
              d="M43 52Q35 63 38 80"
              stroke="#9bd4ff"
              strokeWidth="4.2"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
            <path
              className="tb-stream"
              d="M77 52Q85 63 82 80"
              stroke="#9bd4ff"
              strokeWidth="4.2"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
            <Drop x={36} y={56} delay={0} dur={0.9} />
            <Drop x={84} y={56} delay={0.2} dur={0.9} />
            <Drop x={39} y={56} delay={0.45} dur={0.9} />
            <Drop x={81} y={56} delay={0.65} dur={0.9} />
          </g>
        )}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Stage: two bears. Girl punches boy on a wrong secret.              */
/*  1st hit: ouch. 2nd hit: crying. 3rd+ hit: bawling.                 */
/* ------------------------------------------------------------------ */
function TeddyBearsDuo({
  punches,
  flash,
  unlocked,
  reduce,
}: {
  punches: number;
  flash: boolean;
  unlocked: boolean;
  reduce: boolean;
}) {
  const hit = punches > 0 && !reduce;
  const BONKS = ["BONK!", "POW!", "SMACK!"];

  const boyMood: Mood = unlocked
    ? "happy"
    : punches === 0
    ? "idle"
    : punches >= 3
    ? "bawl"
    : punches === 2
    ? "cry"
    : flash
    ? "hurt"
    : "sad";

  const girlMood: Mood = unlocked
    ? "happy"
    : flash
    ? "angry"
    : punches >= 2
    ? "sad"
    : "idle";

  const floatAnim = (delaySafe: boolean, mood: Mood) =>
    reduce || mood === "bawl"
      ? { y: 0 }
      : mood === "happy"
      ? { y: [0, -7, 0] }
      : { y: delaySafe ? [0, -2, 0] : [0, -2.5, 0] };

  return (
    <div className="relative mx-auto mb-1 flex h-36 w-[19rem] max-w-full select-none items-end justify-center">
      {/* soft floor glow */}
      <div className="absolute bottom-0 left-1/2 h-5 w-60 -translate-x-1/2 rounded-full bg-[#b79ad9]/25 blur-md" />

      {/* comic burst */}
      <AnimatePresence>
        {flash && !unlocked && (
          <motion.div
            key={`pow-${punches}`}
            initial={{ scale: 0, opacity: 0, rotate: -20 }}
            animate={{ scale: [0, 1.25, 1], opacity: [0, 1, 0], rotate: 8 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 top-6 z-30 -translate-x-1/2"
          >
            <span
              className="rounded-full border-2 border-white bg-[#ff6f9b] px-3 py-0.5 text-xs font-bold tracking-wider text-white shadow-md"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              {BONKS[(punches - 1) % BONKS.length]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GIRL BEAR — winds up and punches right */}
      <motion.div
        key={`girl-${punches}`}
        animate={hit ? { x: [0, -8, 30, 30, 0], rotate: [0, -6, 8, 8, 0] } : { x: 0, rotate: 0 }}
        transition={{ duration: 0.6, times: [0, 0.25, 0.5, 0.72, 1], ease: "easeInOut" }}
        className="relative z-20 -mr-3"
      >
        <motion.div
          animate={floatAnim(true, girlMood)}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Bear kind="girl" mood={girlMood} punching={flash && !unlocked} punchKey={punches} />
        </motion.div>
      </motion.div>

      {/* BOY BEAR — gets hit, then cries */}
      <motion.div
        key={`boy-${punches}`}
        animate={
          hit
            ? {
                x: [0, 0, 24, -5, 3, 0],
                y: [0, 0, -6, 2, 0, 0],
                rotate: [0, 0, 16, -6, 3, 0],
              }
            : { x: 0, y: 0, rotate: 0 }
        }
        transition={{ duration: 0.8, times: [0, 0.4, 0.55, 0.72, 0.88, 1], ease: "easeOut" }}
        className="relative z-10 -ml-3"
      >
        <AnimatePresence>
          {flash && !unlocked && (
            <motion.div
              key={`stars-${punches}`}
              initial={{ opacity: 0, scale: 0.5, y: 6 }}
              animate={{ opacity: [0, 1, 1, 0], scale: 1, y: -4, rotate: [0, 20, -20, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, delay: 0.3 }}
              className="pointer-events-none absolute -top-1 left-1/2 z-30 flex -translate-x-1/2 gap-1 text-sm"
            >
              <span className="text-amber-400">✦</span>
              <span className="text-rose-400">★</span>
              <span className="text-amber-400">✦</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={floatAnim(false, boyMood)}
          transition={{ duration: 2.8, delay: 0.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Bear kind="boy" mood={boyMood} punching={false} punchKey={punches} />
        </motion.div>
      </motion.div>
    </div>
  );
}

const CAPTIONS: Record<number, string> = {
  1: "Ouch! That's not the date.",
  2: "Now he's crying. Try again, gently.",
};
const CAPTION_MANY = "He's sobbing. Please get it right!";

export default function SecretGate({
  alreadyVerified,
  onVerified,
  onSkip,
  onBack,
}: Props) {
  const reduce = !!useReducedMotion();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [punches, setPunches] = useState(0);
  const [flash, setFlash] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reveal, setReveal] = useState(false);

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

  // Short "impact" window after each wrong secret
  useEffect(() => {
    if (punches === 0) return;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 1100);
    return () => clearTimeout(t);
  }, [punches]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const secret = value.trim();
    if (!secret) {
      setError("Please enter the secret first!");
      setShake((s) => s + 1);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setError(json?.error ?? "Wrong secret! Try again.");
        setShake((s) => s + 1);
        setPunches((n) => n + 1); // bonk!
        return;
      }
      const token = json.data?.token as string | undefined;
      if (!token) {
        setError("Something went wrong. Try again.");
        return;
      }
      onVerified(token);
    } catch {
      setError("Network error. Please try again.");
      setShake((s) => s + 1);
    } finally {
      setSubmitting(false);
    }
  }

  const caption =
    punches === 0 ? null : CAPTIONS[punches] ?? CAPTION_MANY;

  return (
    <div
      className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden px-5 py-6"
      style={{ background: "#fbf6fb", color: INK }}
    >
      <style>{BEAR_CSS}</style>

      {/* soft pastel background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: "linear-gradient(165deg,#f8f1ff 0%,#fdeff4 50%,#eef5ff 100%)",
        }}
      />
      {[
        { c: "#f9c6d6", cls: "-left-[15%] top-[8%] h-[42vh] w-[55vw]", dx: 35, d: 18, delay: 0 },
        { c: "#d5c8f5", cls: "-right-[15%] bottom-[10%] h-[45vh] w-[55vw]", dx: -35, d: 22, delay: 3 },
      ].map((b, i) => (
        <motion.div
          key={i}
          aria-hidden
          className={`pointer-events-none fixed z-0 transform-gpu rounded-full blur-[85px] ${b.cls}`}
          style={{ background: b.c }}
          animate={reduce ? undefined : { x: [0, b.dx, 0], opacity: [0.48, 0.7, 0.48] }}
          transition={{ duration: b.d, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md rounded-[28px] border border-white/90 px-7 py-8 text-center sm:px-9 sm:py-9"
        style={{
          background:
            "linear-gradient(180deg,rgba(255,254,252,0.92),rgba(255,247,250,0.86))",
          boxShadow:
            "0 32px 64px -28px rgba(105,70,145,0.38), 0 1px 0 rgba(255,255,255,0.9) inset",
          backdropFilter: "blur(16px)",
        }}
      >
        {/* top pill badge */}
        <div
          className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/75 px-3.5 py-1 text-xs font-medium shadow-sm"
          style={{ color: INK_SOFT }}
        >
          <Sparkles className="h-3.5 w-3.5" style={{ color: ROSE }} />
          Private Vault
        </div>

        {/* Two Teddy Bears */}
        <TeddyBearsDuo
          punches={punches}
          flash={flash}
          unlocked={alreadyVerified}
          reduce={reduce}
        />

        {alreadyVerified ? (
          <div className="flex flex-col items-center">
            <div
              className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium"
              style={{ color: LAV }}
            >
              <Unlock className="h-3.5 w-3.5" />
              Unlocked
            </div>

            <h2
              className="text-2xl font-medium tracking-tight sm:text-3xl"
              style={{ fontFamily: "'Fraunces', Georgia, serif", color: INK }}
            >
              You&apos;re already in
            </h2>
            <p
              className="mt-1.5 text-2xl"
              style={{ fontFamily: "'Caveat', cursive", color: INK_SOFT }}
            >
              The bears saved your spot — ready when you are.
            </p>

            <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/80 px-5 py-2.5 text-sm font-medium transition hover:bg-white active:scale-95"
                style={{ color: INK }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#c4607f]/25 transition hover:brightness-105 active:scale-95"
                style={{ background: GRAD }}
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* bear reaction caption */}
            <div className="flex h-7 items-center justify-center">
              <AnimatePresence mode="wait">
                {caption && (
                  <motion.p
                    key={caption}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="text-xl leading-none"
                    style={{ fontFamily: "'Caveat', cursive", color: ROSE }}
                  >
                    {caption}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <h2
              className="mt-1 text-2xl font-medium leading-snug tracking-tight sm:text-3xl"
              style={{ fontFamily: "'Fraunces', Georgia, serif", color: INK }}
            >
              One small secret
            </h2>

            {/* hand-drawn underline */}
            <svg
              aria-hidden
              viewBox="0 0 120 10"
              className="mx-auto mt-1 h-2.5 w-24"
              fill="none"
            >
              <motion.path
                d="M2 6C15 1 25 9 38 5C52 1 62 9 76 5C90 1 100 8 118 4"
                stroke={ROSE}
                strokeWidth="2.6"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.85, delay: 0.25, ease: "easeInOut" }}
              />
            </svg>

            <p
              className="mx-auto mt-2.5 max-w-xs text-sm leading-relaxed"
              style={{ color: INK_SOFT }}
            >
              Enter the date only you and I know — careful, he gets bonked if you miss!
            </p>

            <form onSubmit={submit} className="mx-auto mt-6 w-full max-w-xs">
              <motion.div
                key={shake}
                initial={{ x: 0 }}
                animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
                transition={{ duration: 0.35 }}
                className="relative"
              >
                <KeyRound
                  aria-hidden
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: INK_SOFT }}
                />
                <input
                  type={reveal ? "text" : "password"}
                  inputMode="text"
                  autoComplete="off"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="The secret date..."
                  aria-label="Enter the secret"
                  aria-invalid={!!error}
                  autoFocus
                  disabled={submitting}
                  className="w-full rounded-2xl border border-[#e8dcf7] bg-white/95 py-3 pl-10 pr-11 text-center text-sm tracking-widest shadow-inner outline-none transition placeholder:tracking-normal focus:border-[#d48ba3] focus:ring-4 focus:ring-[#e0829f]/15 disabled:opacity-60"
                  style={{ color: INK }}
                />
                <button
                  type="button"
                  onClick={() => setReveal((r) => !r)}
                  aria-label={reveal ? "Hide secret" : "Show secret"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition hover:bg-[#f3ebfa]"
                  style={{ color: INK_SOFT }}
                >
                  {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </motion.div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white shadow-lg shadow-[#c4607f]/30 transition hover:brightness-105 active:scale-95 disabled:opacity-70"
                style={{ background: GRAD }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking…
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" />
                    Unlock
                  </>
                )}
              </button>

              {/* Hint + Go back row */}
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition hover:bg-white/70"
                  style={{ color: INK_SOFT }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Go back
                </button>

                <button
                  type="button"
                  onClick={() => setShowHint((h) => !h)}
                  aria-expanded={showHint}
                  className="inline-flex items-center gap-1 rounded-full border border-white/90 bg-white/70 px-3 py-1 text-xs font-medium transition hover:bg-white"
                  style={{ color: ROSE }}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  {showHint ? "Hide hint" : "Need a hint?"}
                </button>
              </div>
            </form>

            {/* Collapsible cute hint note */}
            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -4 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div
                    className="mx-auto mt-3.5 max-w-xs rounded-2xl border border-[#f5d5e0] bg-white/85 px-4 py-2.5 text-center shadow-sm"
                    style={{ color: INK }}
                  >
                    <p
                      className="text-xl leading-snug"
                      style={{ fontFamily: "'Caveat', cursive" }}
                    >
                      Think of the day our story started — try writing the numbers cleanly without extra spaces.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.p
                  key={error}
                  role="alert"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-3.5 text-xs font-medium text-rose-500"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </div>
  );
}
