import { test } from "node:test";
import assert from "node:assert/strict";
import { summaryCopy as c } from "../content.ts";
import { agreement, canonical, changeMonths, diffLists, overlapSentence, rankGrid, summarize, topPickSentence } from "./analysis.ts";

const same = ["AWS", "Azure", "GCP", "IBM", "Oracle"];

test("identical lists agree completely", () => {
  const latest = { OpenAI: same, Claude: same, Gemini: same, Perplexity: same };
  assert.equal(agreement(latest), 1);
  const s = summarize(latest);
  assert.equal(s.distinct, 5);
  assert.equal(overlapSentence(s, c), "All four give the same five.");
  assert.equal(topPickSentence(s, c), "AWS is #1 for all four.");
});

test("disjoint lists agree not at all", () => {
  const latest = {
    OpenAI: ["a", "b", "c", "d", "e"],
    Claude: ["f", "g", "h", "i", "j"],
    Gemini: ["k", "l", "m", "n", "o"],
    Perplexity: ["p", "q", "r", "s", "t"],
  };
  assert.equal(agreement(latest), 0);
  const s = summarize(latest);
  assert.equal(overlapSentence(s, c), "Across 20 picks, 20 different names. Nothing makes every list.");
  assert.equal(topPickSentence(s, c), "Four different #1 picks.");
});

test("hand count: one item swapped in one model", () => {
  // OpenAI vs the rest share 4 of 6, the rest share 5 of 5.
  const latest = { OpenAI: ["AWS", "Azure", "GCP", "IBM", "DigitalOcean"], Claude: same, Gemini: same, Perplexity: same };
  const expected = (3 * (4 / 6) + 3 * 1) / 6;
  assert.ok(Math.abs(agreement(latest) - expected) < 1e-9);
  const grid = rankGrid(latest);
  assert.equal(grid.length, 6);
  assert.equal(grid[0].name, "AWS");
  assert.equal(grid.at(-1)?.name, "DigitalOcean");
  assert.deepEqual(grid.at(-1)?.ranks, { OpenAI: 5, Claude: null, Gemini: null, Perplexity: null });
  assert.equal(overlapSentence(summarize(latest), c), "Across 20 picks, 6 different names. Four make every list.");
});

test("split #1 reads naturally", () => {
  const latest = {
    OpenAI: ["Anthropic", "x", "y", "z", "w"],
    Claude: ["Anthropic", "x", "y", "z", "w"],
    Gemini: ["Nvidia", "x", "y", "z", "w"],
    Perplexity: ["Anthropic", "x", "y", "z", "w"],
  };
  assert.equal(topPickSentence(summarize(latest), c), "Three of four put Anthropic first. Gemini says Nvidia.");
});

test("aliases merge spelling variants and case", () => {
  const aliases = { "Blue Bottle": "Blue Bottle Coffee" };
  const months = [["Blue Bottle", "b"], ["blue bottle coffee", "b"], ["Blue Bottle Coffee", "c"]];
  assert.deepEqual(changeMonths(months, aliases), [false, false, true]);
});

test("an even split names both sides", () => {
  const latest = {
    OpenAI: ["A", "x", "y", "z", "w"],
    Claude: ["B", "x", "y", "z", "w"],
    Gemini: ["B", "x", "y", "z", "w"],
    Perplexity: ["A", "x", "y", "z", "w"],
  };
  assert.equal(topPickSentence(summarize(latest), c), "OpenAI and Perplexity say A. Claude and Gemini say B.");
});

test("diff reports what came in and what fell out, with curly apostrophes", () => {
  const d = diffLists(["Zuni", "Beep's Burgers", "Nopa"], ["Zuni", "Nopa", "Prospect"], {});
  assert.deepEqual(d, { added: ["Prospect"], dropped: ["Beep\u2019s Burgers"] });
  assert.equal(canonical("Gott's Roadside", {}), "Gott\u2019s Roadside");
});

test("works with a subset of models", () => {
  const latest = { OpenAI: ["A", "B", "C", "D", "E"], Claude: ["A", "B", "C", "D", "F"] };
  const s = summarize(latest);
  assert.deepEqual(s.models, ["OpenAI", "Claude"]);
  assert.equal(s.picks, 10);
  assert.equal(agreement(latest), 4 / 6);
  assert.equal(topPickSentence(s, c), "A is #1 for both.");
  assert.equal(overlapSentence(s, c), "Across 10 picks, 6 different names. Four make every list.");
  assert.deepEqual(rankGrid(latest).at(-1)?.ranks, { OpenAI: null, Claude: 5 });
});

test("three models, split #1", () => {
  const latest = { OpenAI: ["A", "x"], Gemini: ["B", "x"], Perplexity: ["A", "x"] };
  const s = summarize(latest);
  assert.equal(topPickSentence(s, c), "Two of three put A first. Gemini says B.");
  assert.equal(overlapSentence({ ...s }, c), "Across 6 picks, 3 different names. One makes every list.");
});

test("a missing or empty list is ignored", () => {
  assert.deepEqual(summarize({ OpenAI: ["A"], Claude: [], Gemini: undefined, Perplexity: ["A"] }).models, ["OpenAI", "Perplexity"]);
});

test("any labels work, including two lanes from the same company", () => {
  const latest = { "Claude Haiku 4.5": ["A", "B", "C"], "Claude Sonnet 5.5": ["B", "A", "D"], "GPT-4.1 mini": ["A", "E", "F"] };
  const s = summarize(latest);
  assert.deepEqual(s.models, ["Claude Haiku 4.5", "Claude Sonnet 5.5", "GPT-4.1 mini"]);
  assert.equal(topPickSentence(s, c), "Two of three put A first. Claude Sonnet 5.5 says B.");
  assert.equal(rankGrid(latest)[0].name, "A");
  assert.deepEqual(rankGrid(latest)[0].ranks, { "Claude Haiku 4.5": 1, "Claude Sonnet 5.5": 2, "GPT-4.1 mini": 1 });
});

test("top ten lists work the same way", () => {
  const ten = Array.from({ length: 10 }, (_, i) => `x${i}`);
  const s = summarize({ a: ten, b: ten });
  assert.equal(s.picks, 20);
  assert.equal(agreement({ a: ten, b: ten }), 1);
});

test("same list wording follows the list length", () => {
  const three = ["a", "b", "c"];
  assert.equal(overlapSentence(summarize({ x: three, y: three, z: three }), c), "All three give the same three.");
  assert.equal(overlapSentence(summarize({ x: three, y: three }), c), "Both give the same three.");
});

test("many lone dissenters collapse into one sentence", () => {
  const latest = { a: ["X"], b: ["X"], c: ["P"], d: ["Q"], e: ["R"], f: ["S"] };
  assert.equal(topPickSentence(summarize(latest), c), "Two of six put X first. The other four all pick something different.");
});
