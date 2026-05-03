import { useState, useRef, useEffect } from 'react';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function useChat() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasStartedChat, setHasStartedChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input after assistant responds
    useEffect(() => {
        if (!isLoading) {
            inputRef.current?.focus();
        }
    }, [isLoading]);

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading) return;

        if (!hasStartedChat) setHasStartedChat(true);

        const newMessages: Message[] = [...messages, { role: 'user', content: messageText }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        // Optimistic loading bubble
        setMessages([...newMessages, { role: 'assistant', content: '...' }]);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
        } catch {
            setMessages([...newMessages, { role: 'assistant', content: 'System error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleSuggestionClick = (suggestion: string) => {
        sendMessage(suggestion);
    };

    return {
        input,
        setInput,
        messages,
        isLoading,
        hasStartedChat,
        handleSubmit,
        handleSuggestionClick,
        messagesEndRef,
        inputRef,
    };
}