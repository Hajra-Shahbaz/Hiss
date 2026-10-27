"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

interface VideoDoc {
  media: string;
  description: string;
}

interface Props {
  video: VideoDoc | null;
  loading: boolean;
  onNext: () => void;
}

export default function VideoPage({ video, loading, onNext }: Props) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-2xl font-medium text-slate-800 sm:text-3xl"
      >
        Just something I wanted you to see
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card mt-6 overflow-hidden p-2"
      >
        {loading ? (
          <div className="flex h-56 items-center justify-center text-sm text-slate-400">
            Loading…
          </div>
        ) : video?.media ? (
          <div className="overflow-hidden rounded-2xl bg-slate-900">
            <video
              src={video.media}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full"
            />
          </div>
        ) : (
          <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-500">
              <Play className="h-4 w-4" />
            </div>
            <p className="text-sm text-slate-500">
              The video hasn&apos;t been added yet.
            </p>
            <p className="text-xs text-slate-400">
              Check back soon 💙
            </p>
          </div>
        )}
      </motion.div>

      {video?.description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-5 max-w-lg text-center text-sm leading-relaxed text-slate-600"
        >
          {video.description}
        </motion.p>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={onNext}
          className="btn-primary inline-flex items-center gap-2"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}