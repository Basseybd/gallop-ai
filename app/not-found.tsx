import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-24 sm:px-8">
      <h1 className="font-display text-4xl tracking-[-0.02em]">That question isn&apos;t here.</h1>
      <p className="mt-4 text-secondary">It may have been renamed. The full list is on the home page.</p>
      <Link href="/" className="-ml-1 mt-6 inline-flex min-h-11 items-center px-1 underline">
        See all questions
      </Link>
    </div>
  );
}
