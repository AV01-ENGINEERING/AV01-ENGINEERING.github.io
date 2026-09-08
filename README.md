# NEO Beta v2.1

## Local NEO interface

Run `npm start`, then open `http://localhost:3000` in Chrome or Edge. Create a local `.env` file containing `GROQ_API_KEY=your_key`; `.env`, `.env.local`, and other secret environment files are ignored by Git. The browser never contains or sends a Groq key.

Voice input is best on Windows Chrome/Edge and may require microphone and speech-recognition permissions. Text input remains usable when either is unavailable. Change `DEBUG` to `true` for safe diagnostic events; it never logs the API key.

Beta v2.1 keeps one microphone stream, audio context, analyser, and recognition instance for the page session. TTS pauses only the existing recognition lifecycle, then resumes it through one guarded restart timer; it never calls `getUserMedia()` after initial setup. Long answers now use a focused, independently scrollable response viewport.

## Secure public beta

This directory is a self-contained Node 18+ deployment. The browser receives `public/index.html`, which calls only `/api/chat`. `server.js` handles local development; `api/chat.js` is the Vercel serverless endpoint. Both accept bounded conversation data, apply a server-controlled NEO instruction, and call Groq using the server-only `GROQ_API_KEY` environment secret. They do not accept a browser-selected API key, endpoint, or model.

1. Copy `.env.example` to an environment-secret configuration supported by your chosen host; set the real `GROQ_API_KEY` there.
2. Run `npm start` (no package installation is needed).
3. For Vercel, import this directory/repository, add `GROQ_API_KEY` under **Settings → Environment Variables** for Production (and Preview if needed), then deploy. Vercel serves `public/` and `api/chat.js` at the same origin.

No Vercel project or authorized Vercel CLI session was found in this workspace, so this deliverable has not been deployed. Verify `/` and a text request before testing microphone permissions over HTTPS.

## Limits and behavior

The public endpoint uses Groq's supported `openai/gpt-oss-120b` model. It limits request size, messages, message content, and request duration. The client maintains a short history and truncates file context. Text-based uploads supported: TXT, CSV, JSON, Markdown, HTML, JS, CSS, XML. PDF, Office, and image parsing are honestly reported as unsupported.

Beta v2.1 now uses Groq's supported `openai/gpt-oss-120b` model for both local and server-side requests. The status HUD includes independent MIC and VOICE controls: disabling MIC stops recognition but retains the existing browser capture stream for the session; disabling VOICE only suppresses spoken output.

