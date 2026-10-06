import Link from "next/link";
import { AgreementMeter } from "@/components/agreement";
import { home, method, summaryCopy } from "@/content";
import { overlapSentence } from "@/lib/analysis";
import { MODELS, getQuestions, getRange } from "@/lib/snapshots";

export default function HomePage() {
  const questions = getQuestions();
  const lead = questions[0];
  const range = getRange();
  const r = method.range(range.from, range.to);

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <section className="pt-8 sm:pt-16">
        <h1 className="font-display max-w-[17ch] text-[clamp(2.75rem,8vw,4.75rem)] leading-[1.02] font-medium tracking-[-0.025em]">
          {home.heading}
        </h1>
        <p className="font-display mt-3 text-[clamp(1.5rem,4vw,2.25rem)] leading-tight text-secondary">{home.subheading}</p>
      </section>

      <section aria-labelledby="lead-question" className="mt-10 sm:mt-16">
        <h2 id="lead-question" className="font-display text-[clamp(1.6rem,4.5vw,2.5rem)] leading-tight tracking-[-0.01em]">
          {lead.question}
        </h2>
        <div className="chrome-rule mt-5" aria-hidden="true" />
        <ol className="grid grid-cols-2 sm:grid-cols-4">
          {MODELS.map((m, i) => (
            <li
              key={m}
              className={[
                "border-hairline py-5 pr-4",
                i % 2 === 1 ? "border-l pl-4" : "",
                i >= 2 ? "border-t sm:border-t-0" : "",
                i === 2 ? "sm:border-l sm:pl-5" : "",
                i === 1 || i === 3 ? "sm:pl-5" : "",
              ].join(" ")}
            >
              <p className="text-sm text-secondary">{m}</p>
              <p className="font-display mt-2 text-xl leading-snug sm:text-2xl">{lead.latest[m][0]}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-1 border-t border-hairline pt-5 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="text-secondary">{overlapSentence(lead.summary, summaryCopy)}</p>
          <Link
            href={`/q/${lead.id}`}
            className="-ml-1 inline-flex min-h-11 items-center px-1 underline decoration-hairline transition-colors duration-300 hover:decoration-ink"
          >
            {home.seeRanking}
          </Link>
        </div>
        <p className="mt-10 max-w-[58ch] text-base leading-relaxed text-secondary sm:text-lg">{home.intro}</p>
        <a
          href="/ask"
          className="group mt-6 -ml-1 inline-flex min-h-11 items-center gap-2 px-1 text-lg underline decoration-hairline underline-offset-[0.25em] transition-colors duration-300 hover:decoration-ink"
        >
          {home.askYourOwn}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">
            <path d="M5 2.5 9.5 7 5 11.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </section>

      <section aria-labelledby="all-questions" className="mt-24 sm:mt-32">
        <h2 id="all-questions" className="font-display text-2xl tracking-[-0.01em] sm:text-3xl">
          {home.listHeading}
        </h2>
        <ul className="mt-8 border-b border-hairline">
          {questions.map((q) => (
            <li key={q.id} className="border-t border-hairline">
              <Link
                href={`/q/${q.id}`}
                className="group grid gap-3 py-6 sm:grid-cols-[1fr_18rem] sm:items-center sm:gap-10"
              >
                <div>
                  <p className="font-display text-xl leading-snug underline decoration-transparent decoration-1 underline-offset-[0.2em] transition-colors duration-300 group-hover:decoration-ink sm:text-2xl">
                    {q.question}
                  </p>
                  <p className="mt-2 text-sm text-secondary">
                    <span className="sr-only">{home.topPicksLabel}: </span>
                    {q.summary.topPicks.length === 1
                      ? home.allFourSay(q.summary.topPicks[0].name)
                      : q.summary.topPicks.map((t) => t.name).join(home.listSeparator)}
                  </p>
                </div>
                <AgreementMeter value={q.summary.agreement} decorative />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="method" className="mt-24 grid gap-6 sm:mt-32 sm:grid-cols-[1fr_2fr] sm:gap-10">
        <h2 id="method" className="font-display text-2xl tracking-[-0.01em] sm:text-3xl">
          {method.heading}
        </h2>
        <div className="max-w-[62ch] space-y-4 leading-relaxed text-secondary">
          {method.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p>
            {r.before}
            <span className="font-mono text-sm text-ink">{r.from}</span>
            {r.middle}
            <span className="font-mono text-sm text-ink">{r.to}</span>
            {r.after}
          </p>
        </div>
      </section>
    </div>
  );
}
