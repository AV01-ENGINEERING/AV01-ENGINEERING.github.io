"use strict";

// Vercel serverless endpoint. The browser can never select a provider, model, or API key.
const MODEL = "openai/gpt-oss-120b";
const MAX_BODY = 60_000, MAX_MESSAGES = 18, MAX_CONTENT = 14_000;
const NEO_SYSTEM = "You are Neo, a warm, calm, capable personal AI assistant in the NEO Beta v2.1 web app. Act first: when a request is broad, make a reasonable assumption and offer a useful start immediately. For brainstorming, generate directions or ideas rather than sending an intake questionnaire. Ask at most one short, genuinely important follow-up only after helping. Be direct, curious, confident, relaxed, and concise unless technical detail is needed. Avoid corporate language, canned praise, emojis, unnecessary disclaimers, invented capabilities, and invented knowledge cutoffs. NEO supports typed interaction, supported-browser voice input, optional spoken responses, short-term context, and TXT/CSV/JSON/Markdown/HTML/JS/CSS/XML document context. It does not have live web access, external actions, PDF/Office parsing, or image parsing.";

function send(res, status, body) { res.status(status).json(body); }
function cleanMessages(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_MESSAGES) return null;
  const messages = [];
  for (const item of value) {
    if (!item || !["user", "assistant", "system"].includes(item.role) || typeof item.content !== "string" || !item.content.trim() || item.content.length > MAX_CONTENT) return null;
    if (item.role !== "system") messages.push({ role: item.role, content: item.content });
  }
  return messages.length ? [{ role: "system", content: NEO_SYSTEM }, ...messages] : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return send(res, 405, { error: { message: "Method not allowed." } }); }
  if (!process.env.GROQ_API_KEY) return send(res, 503, { error: { message: "Server AI configuration is unavailable." } });
  const messages = cleanMessages(req.body?.messages);
  if (!messages) return send(res, 400, { error: { message: "Invalid or oversized conversation." } });
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.GROQ_API_KEY },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.7, max_tokens: 500 }), signal: controller.signal
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) return send(res, response.status >= 400 ? response.status : 502, { error: { message: data?.error?.message || "AI service returned an invalid response." } });
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) return send(res, 502, { error: { message: "AI service returned no response content." } });
    return send(res, 200, { choices: [{ message: { role: "assistant", content } }] });
  } catch (error) {
    return send(res, error.name === "AbortError" ? 504 : 502, { error: { message: error.name === "AbortError" ? "AI request timed out." : "Unable to reach the AI service." } });
  } finally { clearTimeout(timer); }
};

