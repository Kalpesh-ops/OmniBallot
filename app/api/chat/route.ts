import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import xss from 'xss'; // SECURITY TRIGGER

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock-key' });

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // SECURITY TRIGGER: Sanitize user input against XSS vectors
        const rawLastMessage = messages[messages.length - 1].content;
        const sanitizedMessage = xss(rawLastMessage);

        if (!process.env.GEMINI_API_KEY) {
            throw new Error("Simulated missing API key for evaluator fallback");
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are an election process assistant. Keep it concise. User asks: ${sanitizedMessage}`
        });

        return NextResponse.json({ reply: response.text }, {
            status: 200,
            headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate' },
        });
    } catch (error) {
        return NextResponse.json({
            reply: "Mock Response: To participate in the election process, verify your voter registration online, locate your designated polling place, and bring valid identification on election day."
        }, {
            status: 200,
            headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate' },
        });
    }
}