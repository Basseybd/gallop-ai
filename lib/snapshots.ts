import "server-only";
import { z } from "zod";
import claude from "@/data/claude.json";
import gemini from "@/data/gemini.json";
import openai from "@/data/openai.json";
import perplexity from "@/data/perplexity.json";
import { aliases } from "@/content";
import {
  MODELS,
  changeMonths,
  latestLists,
  rankGrid,
  summarize,
  type Model,
  type Question,
  type RankRow,
  type Summary,
} from "@/lib/analysis";

const fileSchema = z.array(
  z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    category: z.string(),
    question: z.string(),
    dataEnds: z.string(),
    modelRankings: z.record(z.string(), z.record(z.string(), z.array(z.string()).min(1).max(5))),
  }),
);

const files: Record<Model, unknown> = { OpenAI: openai, Claude: claude, Gemini: gemini, Perplexity: perplexity };

export type QuestionView = Question & {
  latest: Record<Model, string[]>;
  grid: RankRow[];
  summary: Summary;
  changes: Record<Model, boolean[]>;
};

function load(): QuestionView[] {
  const parsed = Object.fromEntries(
    MODELS.map((m) => [m, fileSchema.parse(files[m])]),
  ) as Record<Model, z.infer<typeof fileSchema>>;

  const base = parsed.OpenAI;
  const views = base.map((entry): QuestionView => {
    const months = Object.keys(entry.modelRankings.OpenAI);
    const lists = {} as Record<Model, string[][]>;
    for (const m of MODELS) {
      const match = parsed[m].find((e) => e.id === entry.id);
      const series = match?.modelRankings[m];
      if (!series) throw new Error(`Snapshot missing ${m} for ${entry.id}`);
      const theirMonths = Object.keys(series);
      if (theirMonths.join() !== months.join()) throw new Error(`Month mismatch for ${m} on ${entry.id}`);
      lists[m] = months.map((mo) => series[mo]);
    }
    const q: Question = { id: entry.id, question: entry.question, category: entry.category, months, lists };
    const latest = latestLists(q, aliases);
    return {
      ...q,
      latest,
      grid: rankGrid(latest),
      summary: summarize(latest),
      changes: Object.fromEntries(MODELS.map((m) => [m, changeMonths(lists[m], aliases)])) as Record<
        Model,
        boolean[]
      >,
    };
  });

  return views.sort((a, b) => a.summary.agreement - b.summary.agreement);
}

const questions = load();

/** All questions, least agreement first. */
export function getQuestions(): QuestionView[] {
  return questions;
}

export function getQuestion(id: string): QuestionView | undefined {
  return questions.find((q) => q.id === id);
}

export function getRange(): { from: string; to: string } {
  const months = questions[0].months;
  return { from: months[0], to: months[months.length - 1] };
}

export { MODELS, type Model };
