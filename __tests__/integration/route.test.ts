/**
 * @jest-environment node
 */

/**
 * Integration tests for the `/api/chat` POST endpoint.
 *
 * These tests validate the security middleware (CSRF, Auth, Rate-limiting)
 * by constructing mock Request objects and calling the POST handler directly.
 * Uses the Node.js test environment for native Request/Response globals.
 *
 * @module route.integration.test
 */

// Suppress console.error noise during tests
beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Mock external dependencies to isolate route logic
jest.mock('../../lib/firebase-admin', () => ({
    firestoreQuery: jest.fn().mockResolvedValue(null),
    firestoreWrite: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@google-cloud/translate', () => ({
    v2: {
        Translate: jest.fn().mockImplementation(() => ({
            translate: jest.fn().mockResolvedValue(['translated text']),
        })),
    },
}));

jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockResolvedValue({
                response: {
                    text: () => 'Mock AI response about voter registration.',
                },
            }),
        }),
    })),
}));

jest.mock('xss', () => ({
    __esModule: true,
    default: jest.fn((input: string) => input),
}));

import { POST } from '../../app/api/chat/route';

/**
 * Creates a mock HTTP Request object for testing the POST handler.
 *
 * @param options - Configuration for the mock request.
 * @param options.csrfToken - Optional CSRF token to include in the X-CSRF-Token header.
 * @param options.bearerToken - Optional bearer token for the Authorization header.
 * @param options.body - The JSON body to send in the request.
 * @returns A Request object suitable for passing to the POST handler.
 */
function createMockRequest({
    csrfToken,
    bearerToken,
    body,
}: {
    csrfToken?: string;
    bearerToken?: string;
    body?: Record<string, unknown>;
}): Request {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
    }
    if (bearerToken) {
        headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    return new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(body ?? {
            messages: [{ role: 'user', content: 'How do I register to vote?' }],
            language: 'en',
        }),
    });
}

describe('/api/chat POST endpoint', () => {
    /**
     * Test 1: CSRF Token Validation
     * The endpoint must return HTTP 403 when the X-CSRF-Token header is missing.
     */
    it('returns 403 when X-CSRF-Token header is missing', async () => {
        const req = createMockRequest({
            bearerToken: 'valid-token-for-testing-purposes',
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('CSRF Token missing or invalid');
    });

    /**
     * Test 2: CSRF Token Validation with wrong value
     * The endpoint must return HTTP 403 when the X-CSRF-Token is present but invalid.
     */
    it('returns 403 when X-CSRF-Token header has wrong value', async () => {
        const req = createMockRequest({
            csrfToken: 'wrong-token-value',
            bearerToken: 'valid-token-for-testing-purposes',
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('CSRF Token missing or invalid');
    });

    /**
     * Test 3: Bearer Authentication Fallback
     * When the CSRF token is valid but the Bearer token is missing or too short,
     * the endpoint must return HTTP 401 Unauthorized.
     */
    it('returns 401 when Authorization bearer token is missing', async () => {
        const req = createMockRequest({
            csrfToken: 'omni-secure-token-2026',
            // No bearerToken — triggers 401
        });

        const response = await POST(req);

        expect(response.status).toBe(401);
    });

    /**
     * Test 4: Successful request with valid CSRF and auth
     * When all security checks pass, the endpoint should return HTTP 200
     * with a reply (either from AI or mock fallback).
     */
    it('returns 200 with a reply when all security headers are valid', async () => {
        const req = createMockRequest({
            csrfToken: 'omni-secure-token-2026',
            bearerToken: 'valid-token-for-testing-purposes',
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.reply).toBeDefined();
        expect(typeof data.reply).toBe('string');
        expect(data.reply.length).toBeGreaterThan(0);
    });
});
