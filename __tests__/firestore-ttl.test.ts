/**
 * @jest-environment node
 */

const DAY = 24 * 60 * 60 * 1000;
const doc = (answer: string, ageMs: number) => ({
    document: { fields: { answer: { stringValue: answer }, timestamp: { timestampValue: new Date(Date.now() - ageMs).toISOString() } } },
});

describe('firestoreQuery cache TTL', () => {
    beforeEach(() => {
        process.env.FIREBASE_CLIENT_EMAIL = 'x@y.iam.gserviceaccount.com';
        // Token step is skipped by faking fetch for both calls below.
    });

    const run = async (docs: unknown[]) => {
        jest.resetModules();
        const { generateKeyPairSync } = await import('crypto');
        const pem = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey
            .export({ type: 'pkcs8', format: 'pem' }).toString();
        process.env.FIREBASE_PRIVATE_KEY = pem;
        global.fetch = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 't', expires_in: 3600 }) })
            .mockResolvedValueOnce({ ok: true, json: async () => docs }) as unknown as typeof fetch;
        const { firestoreQuery: q } = await import('../lib/firebase-admin');
        return q('question');
    };

    it('returns the newest unexpired answer', async () => {
        expect(await run([doc('old-fresh', 3 * DAY), doc('newest', 1 * DAY)])).toBe('newest');
    });

    it('treats expired entries as a miss', async () => {
        expect(await run([doc('stale', 30 * DAY)])).toBeNull();
    });
});
