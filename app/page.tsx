'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from '../components/ChatMessage';
import { DisclaimerModal } from '../components/DisclaimerModal';
import { Sidebar } from '../components/Sidebar';

export default function Home() {
  const {
    input,
    setInput,
    messages,
    isLoading,
    hasStartedChat,
    handleSubmit,
    handleSuggestionClick,
    messagesEndRef,
    inputRef,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Disclaimer Modal — first visit only */}
      <DisclaimerModal />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSuggestionClick={handleSuggestionClick}
        hasStartedChat={hasStartedChat}
      />

      <main className="flex h-dvh flex-col items-center px-4 pb-6 pt-4 md:px-12 md:pb-8 md:pt-6 relative selection:bg-cyan-500/25">
        {/* Background Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[32rem] h-[32rem] bg-cyan-700/25 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[32rem] h-[32rem] bg-teal-800/25 rounded-full blur-[120px]" />
        </div>

        {/* Top spacer — centers content on initial load only */}
        {!hasStartedChat && (
          <motion.div
            initial={{ flex: '1 1 0px' }}
            exit={{ flex: '0 0 0px' }}
            className="min-h-0 shrink-0"
          />
        )}

        {/* Header */}
        <motion.nav
          layout="position"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          aria-label="Main Navigation"
          className="w-full max-w-4xl text-center relative z-10 shrink-0"
        >
          {/* 
            OmniBallot title — uses leading-normal to prevent bg-clip-text from
            clipping the top/bottom of the Newsreader font glyphs (fix from
            conversation 13ea83e7). The pb-1 ensures descenders aren't cut off.
          */}
          <motion.h1
            layout
            className={`font-newsreader italic font-semibold tracking-tight leading-normal pb-1 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 transition-all duration-500 ${
              hasStartedChat ? 'text-3xl md:text-4xl' : 'text-5xl md:text-7xl'
            }`}
          >
            OmniBallot
          </motion.h1>

          <AnimatePresence>
            {!hasStartedChat && (
              <motion.p
                key="subtitle"
                initial={{ opacity: 1, height: 'auto', marginBottom: '3rem' }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                className="text-slate-400 text-md md:text-lg max-w-2xl mx-auto font-light leading-relaxed overflow-hidden"
              >
                Navigate the democratic process with clarity. Ask about voter
                registration timelines, polling locations, and election protocols.
              </motion.p>
            )}
          </AnimatePresence>

          {hasStartedChat && <div className="h-3" />}
        </motion.nav>

        {/* Chat Panel */}
        <motion.section
          layout
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          aria-label="Chat Interface"
          className={`w-full max-w-4xl flex flex-col backdrop-blur-xl bg-white/[0.02] border border-white/[0.07] rounded-3xl shadow-2xl shadow-cyan-950/40 overflow-hidden relative z-10 ${
            hasStartedChat ? 'flex-1 min-h-0' : 'h-56 md:h-64'
          }`}
        >
          {/* Messages */}
          <div
            className={`flex-1 min-h-0 p-5 md:p-6 space-y-4 scroll-smooth ${
              hasStartedChat ? 'overflow-y-auto' : 'overflow-hidden'
            }`}
            aria-live="polite"
            role="log"
            aria-label="Chat History"
          >
            {messages.length === 0 ? (
              <div className="font-newsreader italic text-lg h-full flex items-center justify-center text-slate-500 opacity-70 text-xl select-none">
                Initiate a query to begin...
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg, index) => (
                  <ChatMessage
                    key={index}
                    message={msg}
                    isLatest={index === messages.length - 1}
                    isLoading={isLoading}
                  />
                ))}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="shrink-0 px-4 py-3 md:px-5 md:py-4 border-t border-white/[0.07] bg-black/20">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 md:gap-3"
              aria-label="Question Submission Form"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., How do I register to vote?"
                disabled={isLoading}
                className="flex-1 h-12 bg-white/5 border border-white/[0.05] rounded-xl px-4 md:px-5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                aria-required="true"
                aria-label="Type your election question here"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="h-12 w-12 md:w-auto md:px-5 flex items-center justify-center gap-2 bg-cyan-600 text-white font-medium rounded-full hover:bg-cyan-500 active:scale-95 transition-all shadow-[0_0_18px_rgba(8,145,178,0.2)] focus:outline-none focus:ring-2 focus:ring-cyan-400/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-cyan-600 shrink-0 text-sm md:text-base"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Send size={16} className="md:mr-0.5" />
                    <span className="hidden md:inline">Send</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.section>

        {/* Bottom spacer — mirrors top spacer on initial load */}
        {!hasStartedChat && (
          <motion.div
            initial={{ flex: '1 1 0px' }}
            exit={{ flex: '0 0 0px' }}
            className="min-h-0 shrink-0"
          />
        )}
      </main>
    </>
  );
}