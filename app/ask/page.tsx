import type { Metadata } from "next";
import { connection } from "next/server";
import { AskForm } from "@/components/ask/ask-form";
import { ask, site } from "@/content";

export const metadata: Metadata = {
  title: ask.title,
  description: ask.description,
  // Keys are typed here. Keep this URL out of anything the visitor clicks through to.
  referrer: "no-referrer",
  // Setting openGraph here replaces the root block, so it carries the image, url and site name too.
  openGraph: {
    title: `${ask.title} | ${site.name}`,
    description: ask.description,
    url: "/ask",
    siteName: site.name,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: site.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${ask.title} | ${site.name}`,
    description: ask.description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: site.title }],
  },
};

export default async function AskPage() {
  // Render per request so the proxy's nonce lands on every script tag.
  await connection();
  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <header className="pt-8 sm:pt-16">
        <h1 className="font-display max-w-[17ch] text-[clamp(2.5rem,7vw,4.25rem)] leading-[1.03] font-medium tracking-[-0.025em]">
          {ask.heading}
        </h1>
        <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-secondary sm:text-lg">{ask.intro}</p>
      </header>
      <AskForm />
    </div>
  );
}
