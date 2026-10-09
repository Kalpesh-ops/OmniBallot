# OmniBallot — Election Process Education Assistant

**Live:** https://omni-ballot.vercel.app

OmniBallot is an AI chat assistant that explains voter registration, polling locations, election timelines, ballot procedures and voter ID rules. It is educational only and not official legal or electoral advice. Built for the PromptWars hackathon; now maintained as a hobby project.

## How it works

1. The user asks a question in the chat (English, Spanish or Hindi).
2. `POST /api/chat` rejects cross-site requests, rate limits per client IP, and validates the payload.
3. The full conversation goes to Gemini with a system prompt that keeps it on election topics and tells it which language to reply in.
4. The reply is rendered in the chat. If Gemini fails, the user sees a clear error. There is no fake fallback answer.

## Stack

- Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion
- `@google/generative-ai` (Gemini). The model defaults to `gemini-3.8-flash` and can be changed with `GEMINI_MODEL`.
- Hosting: Vercel

## Run locally

```bash
npm install
cp .env.example .env.local   # then set GEMINI_API_KEY
npm run dev
```

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | yes | Free key from https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | no | Override the model without a code change |

Other commands: `npm test`, `npm run lint`, `npm run build`.

## Security

- **Strict CSP and headers** in `next.config.ts` (no `unsafe-eval` in production, no framing, `connect-src 'self'`).
- **Same-origin check:** browser requests whose `Origin` does not match the host get a 403.
- **Rate limit:** one request per 3 seconds per client IP (last `x-forwarded-for` entry, which the platform sets). It is in memory and per serverless instance, so it is a speed bump, not a hard quota.
- **Input limits:** at most 20 messages of 1000 characters each.
- **Prompt hardening:** the system prompt restricts the model to election topics and tells it to ignore override attempts. This lowers the risk but does not remove it.
- **No secrets in the browser:** the API key lives only in the server environment. Replies render as plain React text, never as HTML.

## Project layout

```text
app/api/chat/route.ts   POST endpoint (validation, rate limit, Gemini)
app/page.tsx            Main UI, two-state landing/chat layout
components/             ChatMessage, DisclaimerModal, Sidebar
hooks/useChat.ts        Chat state and API calls
next.config.ts          Security headers
__tests__/              Jest tests
AGENTS.md               Context for AI coding assistants
```
