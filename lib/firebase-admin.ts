/**
 * Server-side Firestore access via REST API.
 * Uses Google OAuth2 service account credentials to obtain a short-lived
 * access token, then calls the Firestore REST endpoint directly.
 * This avoids the firebase-admin SDK and its problematic gRPC/OpenTelemetry
 * peer dependencies in Next.js serverless environments.
 */

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
        return cachedToken.token;
    }

    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        throw new Error('Firebase Admin credentials not configured');
    }

    // Build JWT for service account
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const payload = btoa(JSON.stringify({
        iss: clientEmail,
        scope: 'https://www.googleapis.com/auth/datastore',
        aud: TOKEN_URL,
        iat: now,
        exp: now + 3600,
    }));

    // Sign with private key using Web Crypto API
    const keyData = privateKey
        .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '');
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        binaryKey,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signingInput = `${header}.${payload}`;
    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        new TextEncoder().encode(signingInput)
    );

    const sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const jwt = `${signingInput}.${sig}`;

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });

    if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
    const data = await res.json();

    cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return cachedToken.token;
}

/** Query qa_cache for an exact question match. Returns cached answer or null. */
export async function firestoreQuery(normalizedPrompt: string): Promise<string | null> {
    const token = await getAccessToken();
    const res = await fetch(`${FIRESTORE_BASE}:runQuery`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            structuredQuery: {
                from: [{ collectionId: 'qa_cache' }],
                where: {
                    fieldFilter: {
                        field: { fieldPath: 'question' },
                        op: 'EQUAL',
                        value: { stringValue: normalizedPrompt },
                    },
                },
                limit: 1,
            },
        }),
    });

    if (!res.ok) throw new Error(`Firestore query failed: ${res.status}`);
    const docs = await res.json();
    const doc = docs[0]?.document;
    return doc?.fields?.answer?.stringValue ?? null;
}

/** Write a question/answer pair to qa_cache. Fire-and-forget. */
export async function firestoreWrite(normalizedPrompt: string, answer: string): Promise<void> {
    const token = await getAccessToken();
    await fetch(`${FIRESTORE_BASE}/qa_cache`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fields: {
                question: { stringValue: normalizedPrompt },
                answer: { stringValue: answer },
                timestamp: { timestampValue: new Date().toISOString() },
            },
        }),
    });
}
