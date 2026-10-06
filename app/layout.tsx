import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { display, mono, sans } from "./fonts";
import { footer, site } from "@/content";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: site.titleTemplate },
  description: site.description,
  openGraph: { title: site.title, description: site.description, url: site.url, siteName: site.name, type: "website" },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
};

export const viewport: Viewport = {
  themeColor: "#E3E4E2",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-raised focus:px-4 focus:py-3"
        >
          {site.skip}
        </a>
        <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-6 sm:px-8 sm:pt-8">
          <Link href="/" className="font-display -ml-1 inline-flex min-h-11 items-center px-1 text-xl tracking-tight">
            {site.name}
          </Link>
          <nav aria-label="Site" className="-mr-2 flex items-center">
            {/* A full page load, so /ask always gets its own document and headers. */}
            <a href="/ask" className="inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-sm text-secondary hover:text-ink">
              {site.askNav}
            </a>
            <a href={site.repo} className="inline-flex min-h-11 items-center px-2 text-sm text-secondary hover:text-ink">
              {site.github}
            </a>
          </nav>
        </header>
        <main id="main">{children}</main>
        <footer className="mx-auto mt-24 max-w-5xl px-5 sm:px-8">
          <div className="flex flex-col gap-1 border-t border-hairline py-6 text-sm text-secondary sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex min-h-11 items-center">
              {footer.builtBy}&nbsp;
              <a href={site.author.url} className="inline-flex min-h-11 items-center text-ink underline">
                {site.author.name}
              </a>
            </p>
            <a href={site.repo} className="-ml-1 inline-flex min-h-11 items-center px-1 underline hover:text-ink sm:ml-0">
              {footer.source}
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
