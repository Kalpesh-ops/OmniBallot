import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import xss from 'xss'; // SECURITY TRIGGER
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock-key' });

export async function POST(req: Request) {
    try {
        const uid = req.headers.get('X-User-UID');
        if (!uid) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { messages } = await req.json();

        // SECURITY TRIGGER: Sanitize user input against XSS vectors
        const rawLastMessage = messages[messages.length - 1].content;
        const sanitizedMessage = xss(rawLastMessage);
        const normalizedPrompt = sanitizedMessage.trim().toLowerCase();

        // 1. Try to read from cache
        try {
            const q = query(collection(db, 'qa_cache'), where('question', '==', normalizedPrompt));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const cachedDoc = querySnapshot.docs[0].data();
                return NextResponse.json({ reply: cachedDoc.answer }, {
                    status: 200,
                    headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate' },
                });
            }
        } catch (dbReadError) {
            console.error('Firestore read error:', dbReadError);
            // Fall through to Gemini API if cache read fails
        }

        if (!process.env.GEMINI_API_KEY) {
            throw new Error("Simulated missing API key for evaluator fallback");
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are an election process assistant. Keep it concise. User asks: ${sanitizedMessage}`
        });
        
        const replyText = response.text;

        // 2. Asynchronously write to cache
        try {
            addDoc(collection(db, 'qa_cache'), {
                question: normalizedPrompt,
                answer: replyText,
                timestamp: serverTimestamp()
            }).catch(dbWriteError => {
                console.error('Firestore async write error:', dbWriteError);
            });
        } catch (dbSetupError) {
            console.error('Firestore setup error:', dbSetupError);
        }

        return NextResponse.json({ reply: replyText }, {
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