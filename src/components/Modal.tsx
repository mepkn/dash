import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="glass w-full max-w-md rounded-2xl p-5 shadow-2xl shadow-cyan/5"
            initial={{ scale: 0.96, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 8 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-medium">{title}</h2>
              <button type="button" aria-label="Close" onClick={onClose} className="text-slate-400 hover:text-slate-100">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const inputClass =
  "w-full rounded-lg bg-white/5 px-3 py-2 text-sm ring-1 ring-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-cyan/60";

export const buttonClass =
  "rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50";
