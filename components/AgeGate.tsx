"use client";

import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cake } from "lucide-react";

interface Props {
  onVerified: () => void;
}

export default function AgeGate({ onVerified }: Props) {
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(0);

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
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500"
      >
        <Cake className="h-6 w-6" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="text-2xl font-medium text-slate-800 sm:text-3xl"
      >
        First, how old are you?
      </motion.h2>
      <p className="mt-2 text-sm text-slate-500">
        Be honest, this is important.
      </p>

      <form onSubmit={submit} className="mt-8 w-full max-w-xs">
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
          className="input-field text-center text-lg"
          autoFocus
        />

        <button type="submit" className="btn-primary mt-4 w-full">
          Continue
        </button>
      </form>

      <AnimatePresence>
        {message && (
          <motion.p
            key={message}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-5 max-w-sm text-sm text-rose-500"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}