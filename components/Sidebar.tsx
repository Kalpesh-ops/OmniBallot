'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Vote,
  MapPin,
  CalendarClock,
  FileText,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Globe,
} from 'lucide-react';
import type { SidebarProps, LanguageCode } from '../types';

const suggestions = [
  {
    icon: Vote,
    label: 'Voter Registration',
    query: 'How do I register to vote in my state?',
  },
  {
    icon: MapPin,
    label: 'Polling Locations',
    query: 'How can I find my nearest polling location?',
  },
  {
    icon: CalendarClock,
    label: 'Election Timelines',
    query: 'What are the key dates for the upcoming election?',
  },
  {
    icon: FileText,
    label: 'Ballot Information',
    query: 'How do I request an absentee or mail-in ballot?',
  },
  {
    icon: HelpCircle,
    label: 'Voter ID Requirements',
    query: 'What identification do I need to bring to vote?',
  },
];

export function Sidebar({ isOpen, onToggle, onSuggestionClick, hasStartedChat, language, onLanguageChange }: SidebarProps) {
  return (
    <>
      {/* Toggle Button — always visible */}
      <motion.button
        onClick={onToggle}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-white/[0.06] backdrop-blur-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all shadow-lg"
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </motion.button>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] md:hidden"
              onClick={onToggle}
            />

            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 z-35 w-[260px] h-dvh flex flex-col bg-slate-950/80 backdrop-blur-2xl border-r border-white/[0.06] shadow-2xl shadow-black/40 pt-16 pb-6 px-4"
              aria-label="Quick Topics"
            >
              {/* Brand area */}
              <div className="mb-6 px-2">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">Quick Topics</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select a topic to start a conversation
                </p>
              </div>

              {/* Suggestion Buttons */}
              <nav className="flex-1 space-y-1.5 overflow-y-auto">
                {suggestions.map((item, idx) => (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    onClick={() => {
                      onSuggestionClick(item.query);
                      // Close sidebar on mobile after click
                      if (window.innerWidth < 768) onToggle();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all group"
                  >
                    <item.icon
                      size={16}
                      className="shrink-0 text-slate-500 group-hover:text-cyan-400 transition-colors"
                    />
                    <span className="truncate">{item.label}</span>
                  </motion.button>
                ))}
              </nav>

              {/* Language Selector */}
              <div className="mt-4 mb-2 px-2">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={14} className="text-slate-500" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Language</span>
                </div>
                <div className="flex items-center gap-2">
                  {(['en', 'es', 'hi'] as LanguageCode[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => onLanguageChange(lang)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        language === lang
                          ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                          : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200'
                      }`}
                      aria-label={`Switch to ${lang.toUpperCase()}`}
                      aria-pressed={language === lang}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-2 pt-4 border-t border-white/[0.05] px-2">
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Powered by Gemini AI · Educational use only
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
