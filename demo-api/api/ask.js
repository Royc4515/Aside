// Vercel Function entry. All logic lives in lib/core.js so it can be tested with mocked fetch.
import { handleAsk } from '../lib/core.js';

// The Web-standard handler shape Vercel documents for functions outside a framework.
export default {
  fetch: (request) => handleAsk(request, { env: process.env, fetch: globalThis.fetch, now: () => new Date() }),
};
