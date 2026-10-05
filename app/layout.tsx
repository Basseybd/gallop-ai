import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource/shippori-mincho/400.css";
import "@fontsource/shippori-mincho/500.css";
import "@fontsource/zen-kaku-gothic-new/400.css";
import "@fontsource/zen-kaku-gothic-new/500.css";
import "@fontsource/fragment-mono/400.css";
import "./globals.css";
import { footer, site } from "@/content";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s. ${site.name}` },
  description: site.description,
  openGraph: { title: site.title, description: site.description, url: site.url, siteName: site.name, type: "website" },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
};

export const viewport: Viewport = {
  themeColor: "#E3E4E2",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-raised focus:px-4 focus:py-3"
        >
          Skip to content
        </a>
        <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-6 sm:px-8 sm:pt-8">
          <Link href="/" className="font-display -ml-1 inline-flex min-h-11 items-center px-1 text-xl tracking-tight">
            {site.name}
          </Link>
          <a
            href={site.repo}
            className="-mr-2 inline-flex min-h-11 items-center px-2 text-sm text-secondary hover:text-ink"
          >
            GitHub
          </a>
        </header>
        <main id="main">{children}</main>
        <footer className="mx-auto mt-24 max-w-5xl px-5 sm:px-8">
          <div className="flex flex-col gap-1 border-t border-hairline py-6 text-sm text-secondary sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex min-h-11 items-center">
              {footer.builtBy}&nbsp;
              <a href={site.author.url} className="text-ink underline">
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
