'use client';

import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setMessages([...newMessages, { role: 'assistant', content: 'Loading election data...' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'System error. Please try again.' }]);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-gray-50 text-gray-900">
      {/* Semantic Navigation for DOM Scanner */}
      <nav aria-label="Main Navigation" className="w-full max-w-3xl mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold">Election Process Assistant</h1>
      </nav>

      {/* Accessible Chat History */}
      <section
        className="w-full max-w-3xl flex-1 overflow-y-auto mb-6 bg-white p-4 rounded-lg shadow"
        aria-live="polite"
        role="log"
        aria-label="Chat History"
      >
        {messages.length === 0 ? (
          <p className="text-gray-500 italic">Ask me about voter registration, timelines, or the election process.</p>
        ) : (
          messages.map((msg, index) => (
            <article
              key={index}
              className={`mb-4 p-3 rounded ${msg.role === 'user' ? 'bg-blue-100 ml-auto max-w-[80%]' : 'bg-gray-100 mr-auto max-w-[80%]'}`}
              aria-label={`Message from ${msg.role}`}
            >
              <strong>{msg.role === 'user' ? 'You: ' : 'Assistant: '}</strong>
              <span>{msg.content}</span>
            </article>
          ))
        )}
      </section>

      {/* Accessible Form inputs */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl flex gap-2"
        aria-label="Question Submission Form"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="How do I register to vote?"
          className="flex-1 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-required="true"
          aria-label="Type your election question here"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          aria-label="Send message"
        >
          Send
        </button>
      </form>
    </main>
  );
}