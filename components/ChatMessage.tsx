import { motion } from 'framer-motion';
import { Message } from '../hooks/useChat';
import { User, Bot } from 'lucide-react';

export function ChatMessage({ message, isLatest, isLoading }: { message: Message; isLatest: boolean; isLoading?: boolean }) {
    const isUser = message.role === 'user';
    const showDots = isLoading && isLatest && !isUser && message.content === '...';

    return (
        <motion.article
            initial={isLatest ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            aria-label={`Message from ${message.role}`}
        >
            {/* Assistant avatar */}
            {!isUser && (
                <div className="shrink-0 w-7 h-7 rounded-lg bg-cyan-950/50 border border-cyan-400/10 flex items-center justify-center mr-2.5 mt-0.5">
                    <Bot size={14} className="text-cyan-400" />
                </div>
            )}

            <div
                className={`px-4 py-3 md:px-5 md:py-3.5 rounded-2xl max-w-[85%] text-sm md:text-base leading-relaxed break-words ${isUser
                    ? 'bg-cyan-600/80 text-white shadow-[0_0_20px_rgba(8,145,178,0.2)] rounded-tr-sm'
                    : 'bg-cyan-950/30 border border-cyan-400/10 text-slate-200 rounded-tl-sm'
                    }`}
            >
                {showDots ? (
                    <span className="flex gap-1 items-center h-5">
                        {[0, 1, 2].map((i) => (
                            <span
                                key={i}
                                className="dot-bounce w-1.5 h-1.5 rounded-full bg-slate-400 block"
                                style={{ animationDelay: `${i * 0.18}s` }}
                            />
                        ))}
                    </span>
                ) : (
                    message.content
                )}
            </div>

            {/* User avatar */}
            {isUser && (
                <div className="shrink-0 w-7 h-7 rounded-lg bg-cyan-600/40 border border-cyan-500/20 flex items-center justify-center ml-2.5 mt-0.5">
                    <User size={14} className="text-cyan-200" />
                </div>
            )}
        </motion.article>
    );
}