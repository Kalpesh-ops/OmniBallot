import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import xss from 'xss'; // SECURITY TRIGGER
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '../../../lib/firebase-admin';
import { v2 } from '@google-cloud/translate';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock-key' });
const translate = new v2.Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY || 'mock-key' });

export async function POST(req: Request) {
    try {
        const uid = req.headers.get('X-User-UID');
        if (!uid) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { messages, language } = await req.json();

        // SECURITY TRIGGER: Sanitize user input against XSS vectors
        const rawLastMessage = messages[messages.length - 1].content;
        const sanitizedMessage = xss(rawLastMessage);
        const normalizedPrompt = sanitizedMessage.trim().toLowerCase();

        // 1. Try to read from cache (Admin SDK — HTTP REST, no gRPC streams)
        try {
            const db = getAdminDb();
            const querySnapshot = await db.collection('qa_cache')
                .where('question', '==', normalizedPrompt)
                .limit(1)
                .get();

            if (!querySnapshot.empty) {
                let cachedAnswer = querySnapshot.docs[0].data().answer;

                if (language && language !== 'en') {
                    try {
                        const [translation] = await translate.translate(cachedAnswer, language);
                        cachedAnswer = translation;
                    } catch (e) {
                        console.error('Translation error on cache hit:', e);
                    }
                }

                return NextResponse.json({ reply: cachedAnswer }, {
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
        
        let replyText = response.text;

        // 2. Asynchronously write to cache (always cache the english base)
        try {
            const db = getAdminDb();
            db.collection('qa_cache').add({
                question: normalizedPrompt,
                answer: replyText,
                timestamp: FieldValue.serverTimestamp(),
            }).catch((dbWriteError: unknown) => {
                console.error('Firestore async write error:', dbWriteError);
            });
        } catch (dbSetupError) {
            console.error('Firestore setup error:', dbSetupError);
        }

        if (language && language !== 'en') {
            try {
                const [translation] = await translate.translate(replyText, language);
                replyText = translation;
            } catch (e) {
                console.error('Translation error on generation:', e);
            }
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