"use client";

import { AnimatePresence, motion } from "framer-motion";

type LoadingDotsProps = {
  show: boolean;
};

export function LoadingDots({ show }: LoadingDotsProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-center py-4"
        >
          <div className="flex gap-1">
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-gray-500"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: 0,
              }}
            />
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-gray-500"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: 0.2,
              }}
            />
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-gray-500"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: 0.4,
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
