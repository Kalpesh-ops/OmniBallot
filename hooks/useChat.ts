import { useState, useRef, useEffect } from 'react';
import type { Message, LanguageCode } from '../types';

/**
 * Custom React hook that manages the entire chat lifecycle for OmniBallot.
 *
 * Provides state management for messages, input text, loading status, language
 * selection, and auto-scroll behavior, and sends messages to `/api/chat`.
 *
 * @returns An object containing:
 *   - `input` — Current text input value.
 *   - `setInput` — Setter for the text input.
 *   - `messages` — Array of chat {@link Message} objects (user + assistant).
 *   - `isLoading` — Whether an API request is in flight.
 *   - `hasStartedChat` — Whether the user has sent at least one message.
 *   - `handleSubmit` — Form submission handler (prevents default, sends input).
 *   - `handleSuggestionClick` — Sends a predefined suggestion as a message.
 *   - `messagesEndRef` — Ref attached to the scroll anchor element.
 *   - `inputRef` — Ref attached to the text input for focus management.
 *   - `language` — Currently selected {@link LanguageCode}.
 *   - `setLanguage` — Setter for the language selection.
 */
export function useChat() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasStartedChat, setHasStartedChat] = useState(false);
    const [language, setLanguage] = useState<LanguageCode>('en');
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

    /**
     * Sends a chat message to the API and updates the message list.
     * Adds an optimistic loading bubble while awaiting the response.
     *
     * @param messageText - The raw text message to send.
     */
    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading) return;

        if (!hasStartedChat) setHasStartedChat(true);

        const newMessages: Message[] = [...messages, { role: 'user', content: messageText }];
        setInput('');
        setIsLoading(true);

        // Optimistic loading bubble
        setMessages([...newMessages, { role: 'assistant', content: '...' }]);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages, language }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

            setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
        } catch (e) {
            const content = e instanceof Error && e.message ? e.message : 'System error. Please try again.';
            setMessages([...newMessages, { role: 'assistant', content }]);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handles form submission events from the chat input.
     * Prevents the default form action and delegates to {@link sendMessage}.
     *
     * @param e - The React form submission event.
     */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    /**
     * Handles clicks on sidebar suggestion buttons.
     * Sends the suggestion text as a new chat message.
     *
     * @param suggestion - The suggestion text to send.
     */
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
        language,
        setLanguage,
    };
}