# Threat model

- **Data:** public snapshot JSON, plus on `/ask` the visitor's question and their own OpenRouter key or provider keys. Gallop stores none of it and has no backend that could.
- **Routes:** every page is prerendered except `/ask` (dynamic, for the CSP nonce). No API routes or Server Actions. Unknown question ids 404 (`dynamicParams = false`).
- **Keys:** Gallop has none. Visitor keys live only in React state on `/ask` and are sent only to their own host (OpenRouter or the provider), in one header, with `credentials: "omit"` and no referrer. sessionStorage holds only the PKCE verifier and state during the OpenRouter redirect.
- **Spend:** the visitor pays. Each call is capped (400 output tokens, 700 for top 10), times out at 45s, and runs once per click. Gallop's own bill can't grow with use.
- **`/ask` CSP:** per-request nonce with `'strict-dynamic'`, `connect-src` limited to self, openrouter.ai and the four provider hosts, `form-action 'none'`, no-referrer, no-store.
- **Must never ship:** a Gallop API route that proxies keys, any key in storage, cookies, URLs or logs, analytics or third-party scripts on `/ask`, model output rendered as HTML, a `NEXT_PUBLIC_` secret, or a wildcard `images.remotePatterns`.
- **Accepted:** static pages keep `'unsafe-inline'` scripts (no nonce) because they take no input and nonces would force per-request rendering. `/ask` is excluded from that policy.
