# Threat model

- **Data:** public snapshot JSON only. No visitor data, forms, cookies, analytics or logins.
- **Routes:** every page is prerendered. No API routes or Server Actions. Unknown question ids 404 (`dynamicParams = false`).
- **Keys:** none. If a live model feature is added, keys live only in Vercel as Secret, are read in `server-only` modules, and every call is rate limited, capped by `maxOutputTokens` and a timeout, behind a kill switch, with a spend cap at the provider.
- **Must never ship:** a `NEXT_PUBLIC_` secret, an uncapped model route, user input rendered as HTML, or a wildcard `images.remotePatterns`.
- **Accepted:** script CSP uses `'unsafe-inline'` (no nonce) because the site is fully static with no user input or third-party scripts. Any user input or third-party script means switching to a nonce or hashes first.
