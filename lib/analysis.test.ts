import { test } from "node:test";
import assert from "node:assert/strict";
import { agreement, changeMonths, overlapSentence, rankGrid, summarize, topPickSentence } from "./analysis.ts";

const same = ["AWS", "Azure", "GCP", "IBM", "Oracle"];

test("identical lists agree completely", () => {
  const latest = { OpenAI: same, Claude: same, Gemini: same, Perplexity: same };
  assert.equal(agreement(latest), 1);
  const s = summarize(latest);
  assert.equal(s.distinct, 5);
  assert.equal(overlapSentence(s), "All four give the same five.");
  assert.equal(topPickSentence(s), "AWS is #1 for all four.");
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
  assert.equal(overlapSentence(s), "20 different answers across 20 picks. Nothing makes every list.");
  assert.equal(topPickSentence(s), "Four different #1 picks.");
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
  assert.equal(overlapSentence(summarize(latest)), "6 different answers across 20 picks. Four make every list.");
});

test("split #1 reads naturally", () => {
  const latest = {
    OpenAI: ["Anthropic", "x", "y", "z", "w"],
    Claude: ["Anthropic", "x", "y", "z", "w"],
    Gemini: ["Nvidia", "x", "y", "z", "w"],
    Perplexity: ["Anthropic", "x", "y", "z", "w"],
  };
  assert.equal(topPickSentence(summarize(latest)), "Three of four put Anthropic first. Gemini says Nvidia.");
});

test("aliases merge spelling variants and case", () => {
  const aliases = { "Blue Bottle": "Blue Bottle Coffee" };
  const months = [["Blue Bottle", "b"], ["blue bottle coffee", "b"], ["Blue Bottle Coffee", "c"]];
  assert.deepEqual(changeMonths(months, aliases), [false, false, true]);
});
