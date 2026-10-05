import localFont from "next/font/local";

// Latin subsets only, self-hosted. next/font preloads them and sizes a fallback to match, so text doesn't jump on swap.
export const display = localFont({
  src: [
    { path: "./fonts/shippori-mincho-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/shippori-mincho-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-shippori",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const sans = localFont({
  src: [{ path: "./fonts/zen-kaku-gothic-new-latin-400-normal.woff2", weight: "400", style: "normal" }],
  variable: "--font-zen",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const mono = localFont({
  src: [{ path: "./fonts/fragment-mono-latin-400-normal.woff2", weight: "400", style: "normal" }],
  variable: "--font-fragment",
  display: "swap",
  preload: false,
});
