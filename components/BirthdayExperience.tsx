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

// Stages where the shared top nav should be hidden
const HIDE_NAV_STAGES: Stage[] = ["welcome", "secret"];

export default function BirthdayExperience() {
  // 1. Initialize with a safe default that matches the server
  const [stage, setStage] = useState<Stage>("welcome");
  const [isClient, setIsClient] = useState(false);

  // Session-only state (now initialized from sessionStorage)
  const [gateToken, setGateToken] = useState<string | null>(null);
  const [noAttempted, setNoAttempted] = useState(false);
  const [verifiedOnce, setVerifiedOnce] = useState(false);

  // Public content cache
  const [publicContent, setPublicContent] = useState<{
    wishes: unknown[] | null;
    congratulations: unknown[] | null;
    video: unknown | null;
  }>({ wishes: null, congratulations: null, video: null });

  const [contentLoading, setContentLoading] = useState(false);

  // 2. Hydrate the saved stage AND gateToken AFTER mounting to prevent SSR mismatch
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

  // ── Save stage and gateToken to sessionStorage whenever they change ──
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

  // ── Fetch public content exactly ONCE, as soon as we leave "welcome" ──
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
  const canGoNext = POST_WISHES_ORDER.indexOf(stage) < POST_WISHES_ORDER.length - 1;

  // Disables scrolling on the main wrapper ONLY for the wishes stage
  const isWishesStage = stage === "wishes";

  return (
    <MotionConfig reducedMotion="user">
      <main 
        className={`relative flex w-full flex-col overflow-x-hidden ${
          isWishesStage ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]"
        }`}
      >
        {/* ── GLOBAL TOP NAV ── */}
        <AnimatePresence>
          {showNav && (
            <motion.nav
              key="topnav"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-4 pt-4 md:px-6 md:pt-6"
            >
              {/* soft scrim so buttons stay legible over any stage */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent" />

              {/* BACK — small circular arrow */}
              {canGoBack ? (
                <motion.button
                  onClick={previous}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  className="group pointer-events-auto relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#f5d68a]/30 bg-white/[0.05] text-[#e0d7ff] backdrop-blur-md transition-colors hover:border-[#f5d68a]/70 hover:text-[#f5d68a]"
                  aria-label="Go back"
                >
                  <ArrowLeft className="relative h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                </motion.button>
              ) : (
                <div aria-hidden className="h-9 w-9" />
              )}

              {/* NEXT — small gold circular arrow */}
              {canGoNext ? (
                <motion.button
                  onClick={next}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  className="group pointer-events-auto relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-[#0b0a1f]"
                  aria-label="Go next"
                >
                  <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </motion.button>
              ) : (
                <div aria-hidden className="h-9 w-9" />
              )}
            </motion.nav>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className={`flex flex-1 flex-col ${isWishesStage ? "h-full overflow-hidden" : "pt-14"}`}
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