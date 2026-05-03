'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X } from 'lucide-react';

const STORAGE_KEY = 'omniballot-disclaimer-accepted';

export function DisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show modal on first visit (no localStorage entry)
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleAccept} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-lg bg-slate-950/80 backdrop-blur-2xl border border-white/[0.07] rounded-2xl shadow-2xl shadow-cyan-950/40 p-6 md:p-8"
          >
            {/* Close button */}
            <button
              onClick={handleAccept}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
              aria-label="Close disclaimer"
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-400/15 shadow-[0_0_12px_rgba(8,145,178,0.12)]">
                <ShieldAlert size={22} className="text-cyan-400" />
              </div>
              <h2 id="modal-title" className="text-lg font-semibold text-white">
                Important Disclaimer
              </h2>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.06] mb-5" />

            {/* Content */}
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                OmniBallot is an <strong className="text-white">AI-powered educational assistant</strong> designed
                to help you understand election processes, voter registration timelines, and polling procedures.
              </p>
              <p>
                This tool does <strong className="text-cyan-300">not</strong> provide official legal or electoral
                advice. Always verify information with your local election authority or official government resources
                before making decisions.
              </p>
              <p className="text-slate-500 text-xs">
                By continuing, you acknowledge that responses are AI-generated and may not reflect the most
                current regulations in your jurisdiction.
              </p>
            </div>

            {/* Action */}
            <button
              onClick={handleAccept}
              className="mt-6 w-full h-11 bg-cyan-600 text-white text-sm font-medium rounded-xl hover:bg-cyan-500 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(8,145,178,0.2)] focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            >
              I Understand — Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
