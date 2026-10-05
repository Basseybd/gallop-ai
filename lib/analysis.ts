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
  ranks: Record<Model, number | null>;
  /** How many models list this item. */
  count: number;
};

export type Aliases = Record<string, string>;

/** Map spelling variants to one display name, then compare case-insensitively. */
export function canonical(name: string, aliases: Aliases): string {
  const trimmed = name.trim();
  return curly(aliases[trimmed] ?? trimmed);
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
export function agreement(latest: Record<Model, string[]>): number {
  const sets = MODELS.map((m) => new Set(latest[m].map(key)));
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
export function rankGrid(latest: Record<Model, string[]>): RankRow[] {
  const rows = new Map<string, RankRow>();
  for (const m of MODELS) {
    latest[m].forEach((name, i) => {
      const k = key(name);
      let row = rows.get(k);
      if (!row) {
        row = {
          name,
          ranks: { OpenAI: null, Claude: null, Gemini: null, Perplexity: null },
          count: 0,
        };
        rows.set(k, row);
      }
      if (row.ranks[m] === null) {
        row.ranks[m] = i + 1;
        row.count++;
      }
    });
  }
  const avg = (r: RankRow) => {
    const ranks = MODELS.map((m) => r.ranks[m]).filter((x): x is number => x !== null);
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
  distinct: number;
  picks: number;
  onEveryList: string[];
  /** #1 pick and the models that chose it, most popular first. */
  topPicks: { name: string; models: Model[] }[];
  agreement: number;
};

export function summarize(latest: Record<Model, string[]>): Summary {
  const grid = rankGrid(latest);
  const tops = new Map<string, { name: string; models: Model[] }>();
  for (const m of MODELS) {
    const name = latest[m][0];
    const k = key(name);
    const entry = tops.get(k) ?? { name, models: [] };
    entry.models.push(m);
    tops.set(k, entry);
  }
  return {
    distinct: grid.length,
    picks: MODELS.reduce((s, m) => s + latest[m].length, 0),
    onEveryList: grid.filter((r) => r.count === MODELS.length).map((r) => r.name),
    topPicks: [...tops.values()].sort((a, b) => b.models.length - a.models.length),
    agreement: agreement(latest),
  };
}

const NUMBER_WORDS = ["No", "One", "Two", "Three", "Four", "Five"];

const join = (models: string[]) =>
  models.length <= 2 ? models.join(" and ") : `${models.slice(0, -1).join(", ")} and ${models.at(-1)}`;

/** One plain sentence about who agrees on #1. */
export function topPickSentence(s: Summary): string {
  const [first, ...rest] = s.topPicks;
  if (rest.length === 0) return `${first.name} is #1 for all four.`;
  if (first.models.length === 1) return "Four different #1 picks.";
  if (rest[0].models.length === first.models.length) {
    return `${s.topPicks.map((t) => `${join(t.models)} say ${t.name}`).join(". ")}.`;
  }
  const count = NUMBER_WORDS[first.models.length] ?? String(first.models.length);
  const others = rest.map((r) => `${join(r.models)} ${r.models.length > 1 ? "say" : "says"} ${r.name}`);
  return `${count} of four put ${first.name} first. ${others.join(". ")}.`;
}

/** One plain sentence about overlap across the full top 5s. */
export function overlapSentence(s: Summary): string {
  if (s.distinct === 5 && s.onEveryList.length === 5) return "All four give the same five.";
  const n = s.onEveryList.length;
  const shared = n === 0 ? "Nothing makes every list." : `${NUMBER_WORDS[n] ?? n} ${n === 1 ? "makes" : "make"} every list.`;
  return `Across ${s.picks} picks, ${s.distinct} different names. ${shared}`;
}
