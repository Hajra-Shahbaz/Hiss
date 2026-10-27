"use client";

import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";

interface Props {
  noAttempted: boolean;
  onYes: () => void;
  onNo: () => void;
}

export default function WelcomePage({ noAttempted, onYes, onNo }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 flex items-center gap-2 text-blue-300"
      >
        <Sparkles className="h-4 w-4" />
        <Heart className="h-5 w-5" />
        <Sparkles className="h-4 w-4" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="max-w-xl text-balance text-3xl font-medium leading-snug text-slate-800 sm:text-4xl"
      >
        I have made something for you.
        <br />
        <span className="text-blue-800">Do you wanna see it?</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.5 }}
        className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
      >
        <button onClick={onYes} className="btn-primary min-w-[140px]">
          Yes
        </button>

        {!noAttempted && (
          <button onClick={onNo} className="btn-secondary min-w-[140px]">
            No
          </button>
        )}
      </motion.div>

      {noAttempted && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 text-sm italic text-slate-500"
        >
          How dare you to say no!
        </motion.p>
      )}
    </div>
  );
}