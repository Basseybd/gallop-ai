# Threat model

- **Data:** public snapshot JSON, plus on `/ask` the visitor's question and their own OpenRouter key or provider keys. Gallop stores none of it and has no backend that could.
- **Routes:** every page is prerendered except `/ask` (dynamic, for the CSP nonce). No API routes or Server Actions. Unknown question ids 404 (`dynamicParams = false`).
- **Keys:** Gallop has none. Visitor keys live only in React state on `/ask` and are sent only to their own host (OpenRouter or the provider), in one header, with `credentials: "omit"` and no referrer. sessionStorage holds only the PKCE verifier and state during the OpenRouter redirect.
- **Spend:** the visitor pays. Each call is capped (400 output tokens, 700 for top 10, plus 600 for Gemini), times out at 45s, never follows a redirect, and runs once per click. Gallop pays only for serving the `/ask` page itself, which does no model work.
- **`/ask` CSP:** per-request nonce with `'strict-dynamic'`, `connect-src` limited to self, openrouter.ai and the four provider hosts, `form-action 'none'`, no-referrer, no-store, `Cross-Origin-Opener-Policy: same-origin`. `next.config.ts` puts the static policy on every path, and `proxy.ts` replaces it only on the exact `/ask`, including prefetch requests.
- **Must never ship:** a Gallop API route that proxies keys, any key in storage, cookies, URLs or logs, analytics or third-party scripts on `/ask`, model output rendered as HTML, a `NEXT_PUBLIC_` secret, or a wildcard `images.remotePatterns`.
- **Accepted:**
  - Static pages keep `'unsafe-inline'` scripts (no nonce) because they take no input and nonces would force per-request rendering. `/ask` replaces that policy.
  - The OpenRouter one-time `?code=` reaches Gallop's request log before the page scrubs the URL. It's single use, expires in 10 minutes and is useless without the verifier, which never leaves the tab.
  - The OAuth `state` is checked whenever OpenRouter echoes it. If it doesn't, PKCE plus COOP carry the login-CSRF protection.
  - An OpenRouter key made by Connect stays live on the visitor's account until they delete it. The page says so.
