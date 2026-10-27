"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import WelcomePage from "./WelcomePage";
import AgeGate from "./AgeGate";
import BalloonPage from "./BalloonPage";
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
  | "age"
  | "balloons"
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
  "age",
  "balloons",
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

export default function BirthdayExperience() {
  const [stage, setStage] = useState<Stage>("welcome");

  // Session-only state (never persisted, never in cookies)
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

  // Fetch public content once when the user reaches the video stage
  useEffect(() => {
    if (stage !== "video" || publicContent.wishes) return;

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
        if (!cancelled) setContentLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stage, publicContent.wishes]);

  const goTo = useCallback((next: Stage) => setStage(next), []);

  const next = useCallback(() => {
    const idx = POST_WISHES_ORDER.indexOf(stage);
    if (idx === -1 || idx === POST_WISHES_ORDER.length - 1) return;

    // Safety net: never skip the gate to gated content
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
  }, []);

  const handleSecretVerified = useCallback((token: string) => {
    setGateToken(token);
    setVerifiedOnce(true);
    setStage("memories");
  }, []);

  const skipSecretIfVerified = useCallback(() => {
    if (gateToken) setStage("memories");
  }, [gateToken]);

  const common = useMemo(
    () => ({ next, previous, restart, goTo }),
    [next, previous, restart, goTo],
  );

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-6 sm:px-6">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <FloatingBackdrop />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            {stage === "welcome" && (
              <WelcomePage
                noAttempted={noAttempted}
                onYes={() => goTo("age")}
                onNo={() => setNoAttempted(true)}
              />
            )}

            {stage === "age" && <AgeGate onVerified={() => goTo("video")} />}

            {stage === "balloons" && <BalloonPage onComplete={() => goTo("video")} />}

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

        <footer className="mt-8 pb-2 text-center text-xs text-slate-400">
          made with 💙 · {verifiedOnce ? "for you" : "just for you"}
        </footer>
      </main>
    </MotionConfig>
  );
}

function FloatingBackdrop() {
  // Gentle decorative drift, respects prefers-reduced-motion via MotionConfig
  const items = [
    { top: "8%", left: "6%", size: 6, delay: 0, dur: 9 },
    { top: "22%", left: "88%", size: 5, delay: 1.2, dur: 11 },
    { top: "60%", left: "4%", size: 4, delay: 2.1, dur: 10 },
    { top: "78%", left: "92%", size: 6, delay: 0.6, dur: 12 },
    { top: "40%", left: "50%", size: 3, delay: 1.8, dur: 13 },
  ];

  return (
    <>
      {items.map((it, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-blue-200/70"
          style={{ top: it.top, left: it.left, width: it.size, height: it.size }}
          animate={{ y: [0, -18, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{
            duration: it.dur,
            delay: it.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}