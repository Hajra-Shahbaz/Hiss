"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import WelcomePage from "./WelcomePage";
import VideoPage from "./VideoPage";
import Wishes from "./Wishes";
import Congratulations from "./Congratulations";
import SecretGate from "./SecretGate";
import Memories from "./Memories";
import Moments from "./Moments";
import Promises from "./Promises";
import Sorry from "./Sorry";
import ThankYou from "./ThankYou";

export type Stage =
  | "welcome"
  | "video"
  | "wishes"
  | "congratulations"
  | "secret"
  | "memories"
  | "moments"
  | "promises"
  | "sorry"
  | "thankyou";

const POST_WISHES_ORDER: Stage[] = [
  "welcome",
  "video",
  "wishes",
  "congratulations",
  "secret",
  "memories",
  "moments",
  "promises",
  "sorry",
  "thankyou",
];

const GATED_STAGES: Stage[] = [
  "memories",
  "moments",
  "promises",
  "sorry",
  "thankyou",
];

const HIDE_NAV_STAGES: Stage[] = ["welcome", "secret"];

// ── 2D JELLYFISH NAV BUTTON ──
function JellyfishButton({
  direction,
  onClick,
  ariaLabel,
}: {
  direction: "back" | "next";
  onClick: () => void;
  ariaLabel: string;
}) {
  const isNext = direction === "next";

  // Palette: Yellow-Orange mix for Next, Blue for Back
  const strokeColor = isNext ? "#fbbf24" : "#93c5fd";
  const glowColor = isNext
    ? "rgba(249, 115, 22, 0.36)"
    : "rgba(59, 130, 246, 0.36)";
  const bgGradient = isNext
    ? "radial-gradient(circle at 50% 25%, rgba(250, 204, 21, 0.48), rgba(249, 115, 22, 0.2) 72%, rgba(234, 88, 12, 0.32))"
    : "radial-gradient(circle at 50% 25%, rgba(96, 165, 250, 0.45), rgba(37, 99, 235, 0.16) 70%, rgba(96, 165, 250, 0.28))";

  return (
    <motion.button
      onClick={onClick}
      aria-label={ariaLabel}
      // Subtle ambient bobbing like floating in water
      animate={{
        y: [0, -2, 0],
      }}
      transition={{
        duration: isNext ? 3.2 : 3.6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      // Squishy jellyfish pulse on hover & tap
      whileHover={{
        scaleX: 1.12,
        scaleY: 0.9,
        transition: { type: "spring", stiffness: 350, damping: 14 },
      }}
      whileTap={{
        scaleX: 0.85,
        scaleY: 1.18,
        transition: { type: "spring", stiffness: 450, damping: 12 },
      }}
      className="group pointer-events-auto relative flex flex-col items-center focus:outline-none"
    >
      {/* Jellyfish Bell (Dome) */}
      <div
        style={{
          borderRadius: "52% 52% 36% 36% / 68% 68% 32% 32%",
          background: bgGradient,
          borderColor: strokeColor,
          boxShadow: `0 3px 10px ${glowColor}, inset 0 2px 4px rgba(255, 255, 255, 0.35)`,
        }}
        className="relative flex h-7 w-8 items-center justify-center border-[1.25px] backdrop-blur-[2px] transition-shadow duration-300 group-hover:brightness-110"
      >
        {/* Top inner glossy highlight */}
        <span className="pointer-events-none absolute top-1 h-1 w-3.5 rounded-full bg-white/30" />

        {/* Direction Arrow */}
        {isNext ? (
          <ArrowRight
            style={{ color: "#fffbeb" }}
            className="relative z-10 h-3 w-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] transition-transform duration-200 group-hover:translate-x-0.5"
          />
        ) : (
          <ArrowLeft
            style={{ color: "#dbeafe" }}
            className="relative z-10 h-3 w-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] transition-transform duration-200 group-hover:-translate-x-0.5"
          />
        )}
      </div>

      {/* 2D Wavy Tentacles */}
      <svg
        width="22"
        height="10"
        viewBox="0 0 30 14"
        fill="none"
        className="-mt-[1px] overflow-visible opacity-90 transition-opacity group-hover:opacity-100"
      >
        <motion.path
          d="M 8 0 Q 5 5, 8 9 T 7 14"
          stroke={strokeColor}
          strokeWidth="1.4"
          strokeLinecap="round"
          animate={{
            d: [
              "M 8 0 Q 5 5, 8 9 T 7 14",
              "M 8 0 Q 11 5, 8 9 T 9 14",
              "M 8 0 Q 5 5, 8 9 T 7 14",
            ],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M 15 0 Q 18 5, 15 10 T 16 15"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          animate={{
            d: [
              "M 15 0 Q 18 5, 15 10 T 16 15",
              "M 15 0 Q 12 5, 15 10 T 14 15",
              "M 15 0 Q 18 5, 15 10 T 16 15",
            ],
          }}
          transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M 22 0 Q 19 5, 22 9 T 21 14"
          stroke={strokeColor}
          strokeWidth="1.4"
          strokeLinecap="round"
          animate={{
            d: [
              "M 22 0 Q 19 5, 22 9 T 21 14",
              "M 22 0 Q 25 5, 22 9 T 23 14",
              "M 22 0 Q 19 5, 22 9 T 21 14",
            ],
          }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </motion.button>
  );
}

export default function BirthdayExperience() {
  const [stage, setStage] = useState<Stage>("welcome");
  const [isClient, setIsClient] = useState(false);

  const [gateToken, setGateToken] = useState<string | null>(null);
  const [noAttempted, setNoAttempted] = useState(false);
  const [verifiedOnce, setVerifiedOnce] = useState(false);

  const [publicContent, setPublicContent] = useState<{
    wishes: unknown[] | null;
    congratulations: unknown[] | null;
    video: unknown | null;
  }>({ wishes: null, congratulations: null, video: null });

  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedStage = sessionStorage.getItem("current_stage") as Stage;
    if (savedStage && POST_WISHES_ORDER.includes(savedStage)) {
      setStage(savedStage);
    }

    const savedToken = sessionStorage.getItem("gate_token");
    if (savedToken) {
      setGateToken(savedToken);
      setVerifiedOnce(true);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      sessionStorage.setItem("current_stage", stage);
    }
  }, [stage, isClient]);

  useEffect(() => {
    if (isClient) {
      if (gateToken) {
        sessionStorage.setItem("gate_token", gateToken);
      } else {
        sessionStorage.removeItem("gate_token");
      }
    }
  }, [gateToken, isClient]);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (stage === "welcome") return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;
    setContentLoading(true);

    Promise.all([
      fetch("/api/content?type=all").then((r) => r.json()),
      fetch("/api/video").then((r) => r.json()),
    ])
      .then(([contentRes, videoRes]) => {
        if (cancelled) return;
        const data = contentRes?.data ?? {};
        setPublicContent({
          wishes: Array.isArray(data.wishes) ? data.wishes : [],
          congratulations: Array.isArray(data.congratulations)
            ? data.congratulations
            : [],
          video: videoRes?.data ?? null,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setPublicContent({ wishes: [], congratulations: [], video: null });
      })
      .finally(() => {
        setContentLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stage]);

  const goTo = useCallback((next: Stage) => setStage(next), []);

  const next = useCallback(() => {
    const idx = POST_WISHES_ORDER.indexOf(stage);
    if (idx === -1 || idx === POST_WISHES_ORDER.length - 1) return;

    const candidate = POST_WISHES_ORDER[idx + 1];
    if (GATED_STAGES.includes(candidate) && !gateToken) {
      setStage("secret");
      return;
    }
    setStage(candidate);
  }, [stage, gateToken]);

  const previous = useCallback(() => {
    const idx = POST_WISHES_ORDER.indexOf(stage);
    if (idx <= 0) return;
    setStage(POST_WISHES_ORDER[idx - 1]);
  }, [stage]);

  const restart = useCallback(() => {
    setStage("welcome");
    setGateToken(null);
    setNoAttempted(false);
    setVerifiedOnce(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("current_stage");
      sessionStorage.removeItem("typed_wishes_ids");
      sessionStorage.removeItem("gate_token");
    }
  }, []);

  const handleSecretVerified = useCallback((token: string) => {
    setGateToken(token);
    setVerifiedOnce(true);
    setStage("memories");
  }, []);

  const skipSecretIfVerified = useCallback(() => {
    if (gateToken) setStage("memories");
  }, [gateToken]);

  const showNav = !HIDE_NAV_STAGES.includes(stage);
  const canGoBack = POST_WISHES_ORDER.indexOf(stage) > 0;
  const canGoNext =
    POST_WISHES_ORDER.indexOf(stage) < POST_WISHES_ORDER.length - 1;

  const isWishesStage = stage === "wishes";

  return (
    <MotionConfig reducedMotion="user">
      <main
        className={`relative flex w-full flex-col overflow-x-hidden ${
          isWishesStage ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]"
        }`}
      >
        {/* ── GLOBAL TOP NAV (Floating, zero layout space taken) ── */}
        <AnimatePresence>
          {showNav && (
            <motion.nav
              key="topnav"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between px-4 pt-3 md:px-6 md:pt-4"
            >
              {canGoBack ? (
                <JellyfishButton
                  direction="back"
                  onClick={previous}
                  ariaLabel="Go back"
                />
              ) : (
                <div aria-hidden className="w-11" />
              )}

              {canGoNext ? (
                <JellyfishButton
                  direction="next"
                  onClick={next}
                  ariaLabel="Go next"
                />
              ) : (
                <div aria-hidden className="w-11" />
              )}
            </motion.nav>
          )}
        </AnimatePresence>

        {/* ── STAGE CONTENT (Removed pt-14 so there is zero extra top space) ── */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className={`flex flex-1 flex-col ${
              isWishesStage ? "h-full overflow-hidden" : ""
            }`}
          >
            {stage === "welcome" && (
              <WelcomePage
                noAttempted={noAttempted}
                onYes={() => goTo("video")}
                onNo={() => setNoAttempted(true)}
              />
            )}

            {stage === "video" && (
              <VideoPage
                video={(publicContent.video as any) ?? null}
                loading={contentLoading}
                onNext={next}
              />
            )}

            {stage === "wishes" && (
              <Wishes
                wishes={(publicContent.wishes as any[]) ?? []}
                loading={contentLoading}
                onNext={next}
                onPrevious={previous}
              />
            )}

            {stage === "congratulations" && (
              <Congratulations
                items={(publicContent.congratulations as any[]) ?? []}
                loading={contentLoading}
                onNext={next}
                onPrevious={previous}
              />
            )}

            {stage === "secret" && (
              <SecretGate
                alreadyVerified={Boolean(gateToken)}
                onVerified={handleSecretVerified}
                onSkip={skipSecretIfVerified}
                onBack={previous}
              />
            )}

            {stage === "memories" && (
              <Memories
                gateToken={gateToken}
                onNext={next}
                onPrevious={previous}
                onRestart={restart}
              />
            )}
            {stage === "moments" && (
              <Moments
                gateToken={gateToken}
                onNext={next}
                onPrevious={previous}
                onRestart={restart}
              />
            )}
            {stage === "promises" && (
              <Promises
                gateToken={gateToken}
                onNext={next}
                onPrevious={previous}
                onRestart={restart}
              />
            )}
            {stage === "sorry" && (
              <Sorry
                gateToken={gateToken}
                onNext={next}
                onPrevious={previous}
                onRestart={restart}
              />
            )}
            {stage === "thankyou" && (
              <ThankYou
                gateToken={gateToken}
                onPrevious={previous}
                onRestart={restart}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}