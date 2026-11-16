# Aside demo API

The server behind live answers in the landing page's "try it" preview. It is
the only server-side code in this repository. The extension never talks to it,
and it is not part of the release ZIP.

When a visitor types a question into the preview, the page sends
`{ "question": "...", "lang": "en" | "he" }` to `POST /api/ask`. The server
answers with `{ answer, provider, model }`, or with `{ fallback: true, reason }`,
in which case the page shows its ready-made text instead.

## Why it cannot run up a bill

- **The server owns the prompt.** The visitor sends a question of at most 300
  characters and a language. The system prompt and the facts about Aside are
  on the server (`lib/context.generated.js`), so this is not a general chatbot
  with someone else's key.
- **Hard daily caps, kept in Redis.** Per visitor, for all visitors together,
  and a separate smaller one for the paid provider. Counters are increased
  before any model is called.
- **Fail closed.** No Redis, a Redis error, a missing key: no model call.
- **Free tiers first.** Groq, then Gemini, then Claude. Claude is called only
  if `ANTHROPIC_API_KEY` is set and its own daily cap has room.
- **Small answers.** 700 output tokens at most, with a 70-word instruction.
  An answer cut off by that cap is discarded, not shown.
- Nothing logs a question, an answer, an IP address or a key. The visitor
  counter is stored under a one-way hash of the IP and the date.

One more thing to do by hand: **set a monthly spend limit in the Anthropic
console before adding the Claude key.** The caps here bound the number of
calls; the console limit bounds the money, whatever happens to this code.

## Environment variables

Set these in the Vercel project settings. Never commit them.

| Name | Needed | What it is |
|---|---|---|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | yes | From the database's REST API section in the Upstash console. Paste the values without quotes, and use the regular token, not the read-only one: counting writes. (`KV_REST_API_URL` / `KV_REST_API_TOKEN` also work.) Without them every request falls back. |
| `DEMO_SALT` | yes | A long random string, kept secret. It is mixed into the visitor hash so stored counters cannot be traced back to an IP address. Without it every request falls back. |
| `GROQ_API_KEY` | at least one provider key | Groq free tier. |
| `GEMINI_API_KEY` | | Gemini free tier. Skipped for visitors from the EEA, the UK and Switzerland, and when the country is unknown: Google's terms allow only paid services there. |
| `ANTHROPIC_API_KEY` | | Claude. Paid per token. Leave it out to keep Claude off. |
| `DEMO_PER_VISITOR_PER_DAY` | no (5) | Live answers per visitor per day. |
| `DEMO_ALL_VISITORS_PER_DAY` | no (300) | Live answers for everyone per day. `0` turns live answers off. |
| `DEMO_CLAUDE_PER_DAY` | no (30) | Claude calls per day. |
| `DEMO_PROVIDERS` | no (`groq,gemini,claude`) | Which providers to try, in order. `gemini` alone tests one provider; `groq,gemini` keeps Claude off without deleting its key. |
| `DEMO_ALLOWED_ORIGINS` | no | Comma-separated origins allowed to call the API. Default `https://royc4515.github.io`. |

Days are UTC days.

## Deploy

1. Create a Vercel project from this repository with **Root Directory**
   `demo-api`. No framework, no build command.
2. Create a Redis database directly at console.upstash.com on the **Free**
   plan (500K commands a month, no card), region `us-east-1`. Do not use
   Vercel's Storage tab for this: it only offers paid plans. On the free plan
   a flood of requests just exhausts the quota, the server then refuses, and
   nothing is billed. Copy the REST URL and token into Vercel.
3. Add `DEMO_SALT` (for example the output of `openssl rand -hex 32`) and
   the provider keys as environment variables. Create the Gemini key in a
   Google project without billing, and the Claude key in its own Anthropic
   workspace with a monthly spend limit and an expiry date.
   Environment variables take effect only after a redeploy.
4. Deploy, then check from a terminal that a wrong origin is refused:

   ```bash
   curl -s -X POST https://<project>.vercel.app/api/ask -H 'Origin: https://example.com' -d '{"question":"Is Aside free?"}'
   ```

   It should print `{"fallback":true,"reason":"origin"}`.
5. Put the URL in `site/assets/demo-config.js`
   (`window.ASIDE_DEMO_API = "https://<project>.vercel.app/api/ask";`), bump
   the `?v=` on the scripts in `site/index.html`, run
   `node scripts/build-site.mjs`, and merge. To switch live answers off again,
   empty that string, or set `DEMO_ALL_VISITORS_PER_DAY=0` in Vercel for an
   immediate stop.

## Models

`lib/catalog.generated.js` and `lib/context.generated.js` are written by
`scripts/build-site.mjs` from `providers/models.js` and the site dictionary.
Do not edit them. To change which model answers, edit `DEMO_PICKS` in that
script. The monthly model update keeps them current, but the deployed server
only changes when Vercel redeploys (it does on every push to `main` once the
project is connected to the repository).

## Tests

```bash
node --test
```

Every test runs the handler with a mocked `fetch`: no keys, no network.
