# OmniBallot — Agent Context Reference

> Authoritative project context for AI coding assistants (Antigravity, Claude, Copilot, etc.).
> Read this file before writing any code for this project.

---

## Project Overview

**OmniBallot** is an AI-powered election process education assistant built for the PromptWars hackathon (now a maintained hobby project). It helps users understand voter registration, polling locations, election timelines, ballot procedures, and voter ID requirements. It is **not** official legal/electoral advice.

**Vertical:** Election Process Education  
**Live stack:** Next.js 16 (App Router) + Tailwind CSS v4 + Framer Motion + Google Gemini (`gemini-3.8-flash`, override with `GEMINI_MODEL`)  
**Deployment:** Vercel (https://omni-ballot.vercel.app). No GCP services are used.

---

## Tech Stack & Versions

| Layer         | Technology                        | Version / Notes                        |
|---------------|-----------------------------------|----------------------------------------|
| Framework     | Next.js (App Router)              | 16.2.4                                 |
| React         | React 19                          | 19.2.4                                 |
| CSS           | Tailwind CSS **v4**               | Uses `@import "tailwindcss"` + `@theme inline` syntax |
| Animations    | Framer Motion                     | 12.38+                                 |
| Icons         | lucide-react                      | Latest                                 |
| AI Backend    | @google/generative-ai (Gemini)  | Needs `GEMINI_API_KEY`; errors return 502/503 |
| Font: Display | Newsreader (Google Fonts)         | Loaded via `next/font/google`, variable `--font-newsreader` |
| Font: Body    | Satoshi (Fontshare)               | Loaded via `<link>` in `layout.tsx`    |

---

## Critical Architecture Rules

### Tailwind CSS v4 — No tailwind.config.ts at Runtime
**This is the #1 gotcha.** Tailwind v4 uses the `@import "tailwindcss"` + `@theme inline` CSS syntax. The `tailwind.config.ts` file exists for content paths only — **custom utilities defined there are NOT auto-loaded**. 

To register custom Tailwind utilities, use `@utility` in `globals.css`:
```css
@utility font-newsreader {
  font-family: var(--font-newsreader), serif;
}
```

### OmniBallot Title — bg-clip-text Visibility Fix
The hero `<h1>` "OmniBallot" uses `bg-clip-text` with the Newsreader italic font. Without `leading-normal` and `pb-1`, the browser clips the top and bottom of the glyphs (ascenders/descenders). **Always keep these classes on the h1:**
```tsx
className="... leading-normal pb-1 text-transparent bg-clip-text ..."
```

### Two-State Layout Pattern
The page has two visual states, animated with Framer Motion:

1. **Landing state** (no messages): Top + bottom `flex-1` spacers center the hero text + compact chat box (`h-56 md:h-64`) vertically.
2. **Chat state** (after first message): Spacers collapse, subtitle fades out, chat panel expands to `flex-1 min-h-0` filling the viewport.

Key: The `<main>` uses `h-dvh` (not `min-h-screen`) to correctly fit the dynamic viewport on mobile.

### Scrollbar Management
- **Initial load:** `overflow-hidden` on the messages div (no scrollbar visible)
- **After chat starts:** `overflow-y-auto` (scrollbar appears only when content overflows)

---

## Design System — Ocean-Teal Palette

| Element              | Classes                                                        |
|----------------------|----------------------------------------------------------------|
| Background           | `bg-slate-950` (set on `<body>` in `layout.tsx`)               |
| Background glows     | `bg-cyan-700/25` (top-left) + `bg-teal-800/25` (bottom-right) |
| User chat bubble     | `bg-cyan-600/80 text-white shadow-[0_0_20px_rgba(8,145,178,0.2)]` |
| Assistant bubble     | `bg-cyan-950/30 border border-cyan-400/10 text-slate-200`     |
| Send button          | `bg-cyan-600 hover:bg-cyan-500`                               |
| Input focus          | `focus:border-cyan-500/40 focus:ring-cyan-500/20`             |
| Selection highlight  | `selection:bg-cyan-500/25`                                     |
| Chat panel border    | `border-white/[0.07]`                                          |
| Input border         | `border-white/[0.05]` (very subtle)                            |
| Chat shadow          | `shadow-cyan-950/40`                                           |

---

## File Structure

```
OmniBallot/
├── app/
│   ├── api/chat/route.ts     # POST endpoint — origin check, rate limit, validation, Gemini
│   ├── globals.css            # Tailwind v4 imports, @utility directives, bounce-dot animation
│   ├── layout.tsx             # Root layout — Newsreader font, Satoshi CDN link, dark bg
│   ├── page.tsx               # Main UI — two-state layout, sidebar, disclaimer, chat
│   └── favicon.ico
├── components/
│   ├── ChatMessage.tsx        # Single chat bubble with lucide User/Bot avatars + loading dots
│   ├── DisclaimerModal.tsx    # First-visit modal — localStorage persistence, glassmorphism
│   └── Sidebar.tsx            # Collapsible left sidebar with quick-topic suggestions
├── hooks/
│   └── useChat.ts             # Chat state management — messages, loading, submit, suggestions
├── next.config.ts             # Security headers (CSP, X-Frame-Options, etc.)
├── tailwind.config.ts         # Content paths + font family extensions
└── AGENTS.md                  # ← This file
```

---

## Component Contracts

### `useChat()` hook
Returns: `{ input, setInput, messages, isLoading, hasStartedChat, handleSubmit, handleSuggestionClick, messagesEndRef, inputRef }`

### `<ChatMessage message isLatest isLoading />`
- Renders user or assistant bubble with appropriate avatar icon
- Shows bouncing dots when `isLoading && isLatest && role === 'assistant'`

### `<Sidebar isOpen onToggle onSuggestionClick hasStartedChat />`
- Fixed position, slides from left with spring animation
- Mobile: shows backdrop overlay; closes on suggestion click
- Quick topics: Voter Registration, Polling Locations, Election Timelines, Ballot Info, Voter ID

### `<DisclaimerModal />`
- Shows once per device (localStorage key: `omniballot-disclaimer-accepted`)
- Glassmorphic overlay with cyan ShieldAlert icon
- Self-closing: user clicks "I Understand" or clicks backdrop

---

## API Route — `/api/chat`

**Method:** POST  
**Body:** `{ messages: [{ role, content }], language?: 'en' | 'es' | 'hi' }` (1-20 messages, each under 1000 chars, last one from the user)  
**Response:** `{ reply: string }`, or `{ error: string }` with 400 (bad payload), 403 (cross-site Origin), 429 (rate limit), 502 (Gemini failed), 503 (`GEMINI_API_KEY` missing).

**Protection:** Origin must match Host, 1 request per 3 s per client IP (last `x-forwarded-for` entry), bounded input. Replies render as plain React text, so no HTML sanitizing is needed.  
**Language:** the requested language is added to the Gemini system instruction; there is no separate translation service.  
**Errors:** there is deliberately no fake "mock" fallback. Failures are logged with `console.error` (see Vercel runtime logs) and shown to the user.

---

## Security Headers (next.config.ts)

- `Content-Security-Policy` — self + Google Fonts + Fontshare (`connect-src 'self'`; Gemini is called server-side only)
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME-sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — disables geolocation, microphone, camera

---

## Repository Size Constraint

> **HARD LIMIT: The total GitHub repository must stay under 10 MB.**

This is a hackathon submission requirement. The 10 MB cap applies to the **full pushed repo** (all tracked files + git objects), _not_ just the working tree.

### Current Budget (as of last audit)

| Category | Size |
|---|---|
| Tracked files (working tree) | **~0.47 MB** |
| `.git` history | **~0.22 MB** |
| **Total** | **~0.69 MB** |
| Remaining headroom | **~9.31 MB** |

**Largest file:** `package-lock.json` at 453 KB (~66% of tracked size).

### Rules for Agents

1. **No binary blobs** — Do not commit images, videos, fonts, or large data files. Use CDN links (e.g., Fontshare, Google Fonts) instead of bundling font files.
2. **No generated output** — Never commit `node_modules/`, `.next/`, `out/`, or build artifacts. Verify `.gitignore` covers them.
3. **Audit before adding dependencies** — Every `npm install` inflates `package-lock.json`. Before adding a new package, consider if the feature can be achieved with existing deps or vanilla code.
4. **No large test fixtures** — Keep test data inline or minimal. No snapshot files, screenshots, or mock corpora.
5. **Run a size check** after significant changes:
   ```powershell
   git ls-files | ForEach-Object { Get-Item $_ -EA 0 } | Measure-Object Length -Sum | Select-Object Count, @{N='SizeMB';E={[math]::Round($_.Sum/1MB,2)}}
   ```
6. **If approaching 8 MB** — alert the user and propose trimming strategies (squash history, remove unused files, replace assets with CDN links).

---

## Git Commit History Hygiene

To maintain a clean and readable project history, all agents must adhere to the following commit message rules:

1. **Format:** Use Conventional Commits format: `<type>(<scope>): <short description>`.
   - Examples: `feat(api): implement firestore caching`, `fix(ui): resolve title clipping issue`, `docs: update agent context`.
2. **Brevity:** Keep the message concise. Do not exceed one line. 4-5 words or a short phrase is ideal.
3. **Clarity:** Ensure anyone reviewing the commit messages can instantly understand the changes made just by reading the summary line.
4. **Logical Commits:** Group related changes together. For multifaceted tasks, create separate, focused commits (e.g., one for UI changes, one for API logic).

---

## Known Pitfalls

1. **Don't use `min-h-screen` on main** — causes overflow on mobile. Use `h-dvh`.
2. **Don't remove `leading-normal` from the h1** — bg-clip-text will clip the title.
3. **Don't put custom utilities in `tailwind.config.ts`** — they won't load in v4. Use `@utility` in CSS.
4. **Don't use `overflow-y-auto` on initial chat state** — shows an empty scrollbar. Use conditional classes.
5. **Don't set `flex-1` on the initial chat panel** — it swallows space and pushes the title off-screen.
6. **CSP blocks Fontshare** if you forget to whitelist `api.fontshare.com` (styles) and `cdn.fontshare.com` (fonts).
7. **Don't commit binary assets** — the repo must stay under 10 MB. Use CDN links for fonts/images instead.
