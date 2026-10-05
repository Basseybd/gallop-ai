import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgreementMeter } from "@/components/agreement";
import { aliases, question as copy } from "@/content";
import { canonical, overlapSentence, topPickSentence } from "@/lib/analysis";
import { MODELS, getQuestion, getQuestions } from "@/lib/snapshots";

export const dynamicParams = false;

export function generateStaticParams() {
  return getQuestions().map((q) => ({ id: q.id }));
}

export async function generateMetadata(props: PageProps<"/q/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const q = getQuestion(id);
  if (!q) return {};
  return { title: q.question, description: `${topPickSentence(q.summary)} ${overlapSentence(q.summary)}` };
}

export default async function QuestionPage(props: PageProps<"/q/[id]">) {
  const { id } = await props.params;
  const q = getQuestion(id);
  if (!q) notFound();

  const all = getQuestions();
  const index = all.findIndex((x) => x.id === q.id);
  const prev = all[index - 1];
  const next = all[index + 1];
  const first = q.months[0];
  const last = q.months[q.months.length - 1];

  return (
    <article className="mx-auto max-w-5xl px-5 sm:px-8">
      <Link href="/" className="-ml-1 mt-10 inline-flex min-h-11 items-center gap-2 px-1 text-sm text-secondary hover:text-ink">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M9 2.5 4.5 7 9 11.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {copy.back}
      </Link>

      <header className="mt-8 sm:mt-12">
        <h1 className="font-display max-w-[20ch] text-[clamp(2.25rem,7vw,4.25rem)] leading-[1.05] font-medium tracking-[-0.02em]">
          {q.question}
        </h1>
        <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-secondary">
          {topPickSentence(q.summary)} {overlapSentence(q.summary)}
        </p>
        <div className="mt-6 max-w-md">
          <AgreementMeter value={q.summary.agreement} />
        </div>
      </header>

      <section aria-labelledby="grid" className="mt-16 sm:mt-20">
        <h2 id="grid" className="font-display text-2xl tracking-[-0.01em]">
          {copy.gridHeading}
        </h2>
        <p className="mt-2 max-w-[60ch] text-sm text-secondary">
          {copy.gridCaption} As of <span className="font-mono">{last}</span>.
        </p>
        <table className="mt-6 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-ink text-sm text-secondary">
              <th scope="col" className="py-3 pr-2 font-normal">
                <span className="sr-only">Pick</span>
              </th>
              {MODELS.map((m) => (
                <th key={m} scope="col" className="w-[3.25rem] py-3 text-center font-normal sm:w-28">
                  <span className="sm:hidden" aria-hidden="true">
                    {m === "Perplexity" ? "Perp." : m === "OpenAI" ? "OpenAI" : m}
                  </span>
                  <span className="sr-only sm:not-sr-only">{m}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {q.grid.map((row) => (
              <tr key={row.name} className="border-b border-hairline">
                <th
                  scope="row"
                  className={`py-3 pr-2 font-normal leading-snug ${row.count === MODELS.length ? "font-display text-lg" : row.count === 1 ? "text-secondary" : ""}`}
                >
                  {row.name}
                </th>
                {MODELS.map((m) => (
                  <td key={m} className="py-3 text-center font-mono text-sm">
                    {row.ranks[m] ?? <span className="sr-only">Not listed</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="changes" className="mt-16 sm:mt-20">
        <h2 id="changes" className="font-display text-2xl tracking-[-0.01em]">
          {copy.changesHeading}
        </h2>
        <p className="mt-2 text-sm text-secondary">
          Monthly, <span className="font-mono">{first}</span> to <span className="font-mono">{last}</span>. A dark tick
          is a month the top five changed.
        </p>
        <ul className="mt-6 space-y-6">
          {MODELS.map((m, row) => {
            const changes = q.changes[m];
            const count = changes.filter(Boolean).length;
            return (
              <li key={m} className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 sm:grid-cols-[8rem_1fr_9rem] sm:items-center">
                <p>{m}</p>
                <p className="text-sm text-secondary sm:order-last sm:text-right">
                  {count === 0 ? copy.never : copy.changed(count)}
                </p>
                <div className="col-span-2 sm:col-span-1">
                  <div className="flex h-5 items-end gap-[3px]" aria-hidden="true">
                    {changes.map((c, i) => (
                      <span
                        key={q.months[i]}
                        title={q.months[i]}
                        className={`flex-1 ${c ? "h-5 bg-graphite" : "h-1.5 bg-hairline"}`}
                      />
                    ))}
                  </div>
                  {row === MODELS.length - 1 && (
                    <div className="mt-1.5 flex justify-between font-mono text-[11px] text-secondary" aria-hidden="true">
                      <span>{first}</span>
                      <span>{last}</span>
                    </div>
                  )}
                </div>
                {count > 0 && (
                  <details className="group col-span-2 sm:order-last sm:col-span-3 sm:pl-[calc(8rem+1.5rem)]">
                    <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm underline [&::-webkit-details-marker]:hidden">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                        className="transition-transform duration-300 group-open:rotate-90"
                      >
                        <path d="M4.5 2.5 8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                      </svg>
                      {copy.showChanges}
                      <span className="sr-only"> for {m}</span>
                    </summary>
                    <ol className="mt-2 space-y-3 border-l border-hairline pl-4">
                      {changes.map((c, i) =>
                        c ? (
                          <li key={q.months[i]} className="text-sm">
                            <span className="font-mono text-secondary">{q.months[i]}</span>
                            <p className="mt-1 leading-relaxed">
                              {q.lists[m][i].map((n) => canonical(n, aliases)).join(", ")}
                            </p>
                          </li>
                        ) : null,
                      )}
                    </ol>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <nav aria-label="More questions" className="mt-20 grid gap-4 border-t border-hairline pt-6 sm:grid-cols-2">
        {prev ? (
          <Link href={`/q/${prev.id}`} className="group block min-h-11 py-2">
            <span className="text-sm text-secondary">{copy.previous}</span>
            <span className="font-display mt-1 block text-lg group-hover:text-secondary">{prev.question}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/q/${next.id}`} className="group block min-h-11 py-2 sm:text-right">
            <span className="text-sm text-secondary">{copy.next}</span>
            <span className="font-display mt-1 block text-lg group-hover:text-secondary">{next.question}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
