// Pure functions over snapshot data. No imports, so `node --test` can run it directly.

export const MODELS = ["OpenAI", "Claude", "Gemini", "Perplexity"] as const;
export type Model = (typeof MODELS)[number];

export type Question = {
  id: string;
  question: string;
  category: string;
  months: string[];
  /** For each model, one top 5 list per month, in month order. */
  lists: Record<Model, string[][]>;
};

export type RankRow = {
  name: string;
  /** Rank per label (a model name or a live lane), null when that one left it out. */
  ranks: Record<string, number | null>;
  /** How many models list this item. */
  count: number;
};

export type Aliases = Record<string, string>;

/**
 * Ranked lists by label. Saved questions use the four model names; live questions use whatever
 * models the visitor picked. Insertion order is display order. Missing or empty lists are ignored.
 */
export type Lists = Record<string, string[] | undefined>;

/** The labels that actually answered, in display order. */
export function present(latest: Lists): string[] {
  return Object.keys(latest).filter((m) => (latest[m]?.length ?? 0) > 0);
}

/** Map spelling variants to one display name, then compare case-insensitively. */
export function canonical(name: string, aliases: Aliases): string {
  const trimmed = name.trim();
  // Own keys only: an answer like "constructor" must not pick up Object.prototype.constructor.
  return curly(Object.hasOwn(aliases, trimmed) ? aliases[trimmed] : trimmed);
}

/** Typographic apostrophes for display. */
export function curly(text: string): string {
  return text.replace(/'/g, "\u2019");
}

/** What came in and what fell out between two months, after merging aliases. */
export function diffLists(prev: string[], next: string[], aliases: Aliases): { added: string[]; dropped: string[] } {
  const a = prev.map((n) => canonical(n, aliases));
  const b = next.map((n) => canonical(n, aliases));
  const inA = new Set(a.map(key));
  const inB = new Set(b.map(key));
  return { added: b.filter((n) => !inA.has(key(n))), dropped: a.filter((n) => !inB.has(key(n))) };
}

const key = (name: string) => name.toLowerCase();

export function latestLists(q: Question, aliases: Aliases): Record<Model, string[]> {
  const out = {} as Record<Model, string[]>;
  for (const m of MODELS) {
    const lists = q.lists[m];
    out[m] = lists[lists.length - 1].map((n) => canonical(n, aliases));
  }
  return out;
}

/** Mean pairwise overlap of the models' latest top 5 sets, from 0 (none shared) to 1 (same five). */
export function agreement(latest: Lists): number {
  const sets = present(latest).map((m) => new Set(latest[m]!.map(key)));
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      const a = sets[i];
      const b = sets[j];
      const shared = [...a].filter((x) => b.has(x)).length;
      const union = new Set([...a, ...b]).size;
      total += union === 0 ? 1 : shared / union;
      pairs++;
    }
  }
  return pairs === 0 ? 1 : total / pairs;
}

/** Every item any model listed, with each model's rank. Most shared first, then best average rank. */
export function rankGrid(latest: Lists): RankRow[] {
  const rows = new Map<string, RankRow>();
  const labels = present(latest);
  for (const m of labels) {
    latest[m]!.forEach((name, i) => {
      const k = key(name);
      let row = rows.get(k);
      if (!row) {
        row = { name, ranks: Object.fromEntries(labels.map((l) => [l, null])), count: 0 };
        rows.set(k, row);
      }
      if (row.ranks[m] === null) {
        row.ranks[m] = i + 1;
        row.count++;
      }
    });
  }
  const avg = (r: RankRow) => {
    const ranks = labels.map((m) => r.ranks[m]).filter((x): x is number => x !== null);
    return ranks.reduce((s, x) => s + x, 0) / ranks.length;
  };
  return [...rows.values()].sort((a, b) => b.count - a.count || avg(a) - avg(b) || a.name.localeCompare(b.name));
}

/** For each month, whether the list differs from the month before. The first month is never a change. */
export function changeMonths(lists: string[][], aliases: Aliases): boolean[] {
  const norm = lists.map((l) => l.map((n) => key(canonical(n, aliases))).join("|"));
  return norm.map((v, i) => i > 0 && v !== norm[i - 1]);
}

export type Summary = {
  /** The labels that answered. */
  models: string[];
  /** Length of the longest list (5 for saved questions; 3, 5 or 10 live). */
  length: number;
  distinct: number;
  picks: number;
  onEveryList: string[];
  /** #1 pick and the models that chose it, most popular first. */
  topPicks: { name: string; models: string[] }[];
  agreement: number;
};

export function summarize(latest: Lists): Summary {
  const models = present(latest);
  const grid = rankGrid(latest);
  const tops = new Map<string, { name: string; models: string[] }>();
  for (const m of models) {
    const name = latest[m]![0];
    const k = key(name);
    const entry = tops.get(k) ?? { name, models: [] };
    entry.models.push(m);
    tops.set(k, entry);
  }
  return {
    models,
    length: Math.max(0, ...models.map((m) => latest[m]!.length)),
    distinct: grid.length,
    picks: models.reduce((s, m) => s + latest[m]!.length, 0),
    onEveryList: grid.filter((r) => r.count === models.length).map((r) => r.name),
    topPicks: [...tops.values()].sort((a, b) => b.models.length - a.models.length),
    agreement: agreement(latest),
  };
}

/** The words the summary sentences are built from. The site passes `summaryCopy` from content.ts. */
export type SummaryCopy = {
  /** Capitalized number words, indexed by value. */
  numbers: string[];
  /** Lowercase number words, indexed by value. */
  totals: string[];
  and: string;
  allAgree: (name: string, total: number, totalWord: string) => string;
  allDifferent: (countWord: string) => string;
  says: (models: string, name: string, plural: boolean) => string;
  majority: (count: string, name: string, totalWord: string) => string;
  othersDiffer: (countWord: string) => string;
  sameList: (total: number, totalWord: string, lengthWord: string) => string;
  noneShared: string;
  shared: (count: string, n: number) => string;
  across: (picks: number, distinct: number) => string;
};

const join = (models: string[], and: string) =>
  models.length <= 2 ? models.join(and) : `${models.slice(0, -1).join(", ")}${and}${models.at(-1)}`;

/** One plain sentence about who agrees on #1. */
export function topPickSentence(s: Summary, c: SummaryCopy): string {
  const total = s.models.length;
  const totalWord = c.totals[total] ?? String(total);
  const [first, ...rest] = s.topPicks;
  if (rest.length === 0) return c.allAgree(first.name, total, totalWord);
  if (first.models.length === 1) return c.allDifferent(c.numbers[total] ?? String(total));
  const says = (t: { name: string; models: string[] }) => c.says(join(t.models, c.and), t.name, t.models.length > 1);
  if (rest[0].models.length === first.models.length) return `${s.topPicks.map(says).join(". ")}.`;
  const count = c.numbers[first.models.length] ?? String(first.models.length);
  // Past a few dissenters, a roll call reads like a log. Summarize them instead.
  if (rest.length >= 3 && rest.every((r) => r.models.length === 1)) {
    const others = rest.length;
    return `${c.majority(count, first.name, totalWord)} ${c.othersDiffer(c.totals[others] ?? String(others))}`;
  }
  return `${c.majority(count, first.name, totalWord)} ${rest.map(says).join(". ")}.`;
}

/** One plain sentence about overlap across the full top 5s. */
export function overlapSentence(s: Summary, c: SummaryCopy): string {
  const total = s.models.length;
  if (s.distinct === s.length && s.onEveryList.length === s.length) {
    return c.sameList(total, c.totals[total] ?? String(total), c.totals[s.length] ?? String(s.length));
  }
  const n = s.onEveryList.length;
  const shared = n === 0 ? c.noneShared : c.shared(c.numbers[n] ?? String(n), n);
  return `${c.across(s.picks, s.distinct)} ${shared}`;
}
