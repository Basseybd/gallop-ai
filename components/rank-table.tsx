import { question as copy } from "@/content";
import type { RankRow } from "@/lib/analysis";

/** Every pick any model listed, with each model's rank. Shared by question pages and live answers. */
export function RankTable({ grid, models, labelledBy }: { grid: RankRow[]; models: readonly string[]; labelledBy: string }) {
  return (
    <table aria-labelledby={labelledBy} className="mt-6 w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-ink text-sm text-secondary">
          <th scope="col" className="py-3 pr-2 font-normal">
            <span className="sr-only">{copy.pickColumn}</span>
          </th>
          {models.map((m) => (
            <th key={m} scope="col" className="w-[3.25rem] py-3 text-center font-normal sm:w-28">
              <span className="sm:hidden" aria-hidden="true">
                {copy.shortModel[m] ?? m}
              </span>
              <span className="sr-only sm:not-sr-only">{m}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {grid.map((row) => (
          <tr key={row.name} className="border-b border-hairline">
            <th
              scope="row"
              className={`py-3 pr-2 align-baseline font-normal leading-snug ${row.count === models.length ? "font-display text-lg" : row.count === 1 ? "text-secondary" : ""}`}
            >
              {row.name}
            </th>
            {models.map((m) => (
              <td key={m} className="py-3 text-center align-baseline font-mono text-sm">
                {row.ranks[m] ?? <span className="sr-only">{copy.notListed}</span>}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
