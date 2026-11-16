// Vercel Function entry. All logic lives in lib/core.js so it can be tested with mocked fetch.
import { handleAsk } from '../lib/core.js';

const run = (request) => handleAsk(request, { env: process.env, fetch: globalThis.fetch, now: () => new Date() });

export const POST = run;
export const OPTIONS = run;
