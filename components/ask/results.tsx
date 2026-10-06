"use client";

import { forwardRef, useId } from "react";
import { AgreementMeter } from "@/components/agreement";
import { RankTable } from "@/components/rank-table";
import { aliases, ask as copy, summaryCopy } from "@/content";
import { canonical, overlapSentence, rankGrid, summarize, topPickSentence, type Lists } from "@/lib/analysis";
import type { AskError, Lane } from "@/lib/ask";

export type LaneStatus = { state: "waiting" } | { state: "done"; list: string[] } | { state: "error"; error: AskError };

// Same lead as the home page: picks side by side, vertical hairlines, one rule underneath.
// Two columns on a phone; on wider screens as many as fit (four, or three for five and six).
const smCols: Record<number, string> = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4", 5: "sm:grid-cols-3", 6: "sm:grid-cols-3" };
function cellClass(i: number, n: number): string {
  const sm = n === 4 ? 4 : n === 2 ? 2 : 3;
  return [
    "min-w-0 border-hairline py-5",
    // phone: 2 columns
    i % 2 === 1 ? "border-l pl-4" : "pr-4",
    i >= 2 ? "border-t" : "",
    // wider: reset, then lay out for `sm` columns
    "sm:border-l-0 sm:border-t-0 sm:pl-0 sm:pr-5",
    i % sm !== 0 ? "sm:border-l sm:pl-5" : "",
    i >= sm ? "sm:border-t" : "",
  ].join(" ");
}

export const Results = forwardRef<HTMLElement, { question: string; lanes: Lane[]; status: Record<string, LaneStatus | undefined> }>(
  function Results({ question, lanes, status }, ref) {
    const id = useId();
    const settled = lanes.filter((l) => status[l.label] && status[l.label]!.state !== "waiting").length;
    const failed = lanes.filter((l) => status[l.label]?.state === "error").length;
    const busy = settled < lanes.length;
    // A null-prototype object, so a model label like "__proto__" can't touch Object.prototype.
    const lists: Lists = Object.create(null);
    for (const l of lanes) {
      const s = status[l.label];
      if (s?.state === "done") lists[l.label] = s.list.map((n) => canonical(n, aliases));
    }
    const answered = Object.keys(lists);
    const summary = answered.length >= 2 ? summarize(lists) : null;
    const wide = answered.length > 4;

    return (
      <section ref={ref} tabIndex={-1} aria-labelledby={`${id}-q`} aria-busy={busy} className="mt-16 outline-none sm:mt-20">
        <h2 id={`${id}-q`} className="font-display text-[clamp(1.6rem,4.5vw,2.5rem)] leading-tight tracking-[-0.01em]">
          {question}
        </h2>
        <div className="chrome-rule mt-5" aria-hidden="true" />
        <ol className={`grid grid-cols-2 border-b border-hairline ${smCols[lanes.length] ?? smCols[6]}`}>
          {lanes.map((l, i) => {
            const s = status[l.label];
            return (
              <li key={l.label} className={cellClass(i, lanes.length)}>
                <p className="text-sm break-words text-secondary" title={l.model}>
                  {l.label}
                </p>
                {s?.state === "done" && <p className="font-display mt-2 text-xl leading-snug break-words sm:text-2xl">{canonical(s.list[0], aliases)}</p>}
                {s?.state === "waiting" && <p className="mt-2 animate-pulse text-secondary motion-reduce:animate-none">{copy.waiting}</p>}
                {s?.state === "error" && <p className="mt-2 text-sm leading-relaxed">{copy.errors[s.error](l.label)}</p>}
              </li>
            );
          })}
        </ol>

        <div className="pt-5">
          <p aria-live="polite" className="text-sm text-secondary">
            {copy.progress(settled, lanes.length, failed)}
          </p>
          {summary && (
            <>
              <p className="mt-3 max-w-[62ch] text-secondary">
                {topPickSentence(summary, summaryCopy)} {overlapSentence(summary, summaryCopy)}
              </p>
              <div className="mt-4 max-w-md">
                <AgreementMeter value={summary.agreement} />
              </div>
            </>
          )}
          {!busy && answered.length === 1 && <p className="mt-3 text-secondary">{copy.onlyOne}</p>}
        </div>

        {summary && (
          <section aria-labelledby={`${id}-grid`} className="mt-14">
            <h3 id={`${id}-grid`} className="font-display text-2xl tracking-[-0.01em]">
              {copy.gridHeading}
            </h3>
            <p className="mt-2 max-w-[60ch] text-sm text-secondary">{copy.gridCaption}</p>
            {/* Past four models the table keeps its width and scrolls sideways inside this region on a phone. */}
            <div
              className="overflow-x-auto"
              {...(wide ? { role: "region", tabIndex: 0, "aria-label": copy.gridScroll } : {})}
            >
              <div className={wide ? "min-w-[40rem]" : undefined}>
                <RankTable grid={rankGrid(lists)} models={answered} labelledBy={`${id}-grid`} wide={wide} />
              </div>
            </div>
          </section>
        )}
      </section>
    );
  },
);
