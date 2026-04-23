"use client";

import { AnimatePresence, motion } from "framer-motion";

export function PanelTransitionOverlay({
  visible,
  label,
}: {
  visible: boolean;
  label: string;
}) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(8,10,16,0.14),rgba(8,10,16,0.34))] backdrop-blur-[1px]"
        >
          <div className="absolute right-4 top-4 rounded-full border border-sky-400/25 bg-sky-400/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-100/85">
            {label}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
