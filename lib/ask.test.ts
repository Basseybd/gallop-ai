import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GEMINI_EXTRA,
  OPENROUTER_HOST,
  PROVIDERS,
  PROVIDER_HOSTS,
  buildRequest,
  cleanKey,
  cleanModel,
  cleanQuestion,
  errorFor,
  extractText,
  outputCap,
  parseList,
  uniqueLabels,
  type Lane,
} from "./ask.ts";
import { authUrl, challengeFor, parseCatalog, readStash, searchCatalog } from "./openrouter.ts";

const KEY = "sk-test-1234567890";
const lanes: Lane[] = [
  { label: "Any", transport: "openrouter", model: "anthropic/claude-haiku-4.5" },
  ...PROVIDERS.map((p): Lane => ({ label: p, transport: p, model: "some-model" })),
];

test("every request goes to its own host, carries its key once in a header, and is capped", () => {
  for (const lane of lanes) {
    for (const n of [3, 5, 10] as const) {
      const { url, init } = buildRequest(lane, KEY, "best pizza in NYC", n);
      const host = lane.transport === "openrouter" ? OPENROUTER_HOST : PROVIDER_HOSTS[lane.transport];
      assert.ok(url.startsWith(`${host}/`), `${lane.label} url`);
      assert.equal(Object.values(init.headers).filter((v) => v.includes(KEY)).length, 1, `${lane.label} key in one header`);
      assert.ok(!init.body.includes(KEY) && !url.includes(KEY), `${lane.label} key not in body or url`);
      const body = JSON.parse(init.body);
      const cap = body.max_completion_tokens ?? body.max_tokens ?? body.generationConfig?.maxOutputTokens;
      assert.equal(cap, outputCap(n) + (lane.transport === "Gemini" ? GEMINI_EXTRA : 0), `${lane.label} cap`);
      assert.ok(init.body.includes(`top ${n}`) && init.body.includes("best pizza in NYC"));
    }
  }
});

test("Claude opts in to direct browser access; OpenRouter gets the full model id", () => {
  assert.equal(buildRequest(lanes[2], KEY, "q?", 5).init.headers["anthropic-dangerous-direct-browser-access"], "true");
  assert.equal(JSON.parse(buildRequest(lanes[0], KEY, "q?", 5).init.body).model, "anthropic/claude-haiku-4.5");
});

test("input cleaning", () => {
  assert.equal(cleanKey("  sk-abc12345  "), "sk-abc12345");
  assert.equal(cleanKey("short"), null);
  assert.equal(cleanKey("sk-abc 12345"), null);
  assert.equal(cleanKey("sk-abc12345\r\nx-evil: 1"), null);
  assert.equal(cleanModel("openai/gpt-4.1-mini"), "openai/gpt-4.1-mini");
  assert.equal(cleanModel("anthropic/claude-sonnet-5.5:batch"), "anthropic/claude-sonnet-5.5:batch");
  assert.equal(cleanModel("../../v1/files"), null);
  assert.equal(cleanModel("a b"), null);
  assert.equal(cleanQuestion("  best   pizza  "), "best pizza");
  assert.equal(cleanQuestion("hi"), null);
  assert.equal(cleanQuestion("x".repeat(141)), null);
});

test("parse a numbered list up to the requested length", () => {
  const text = "1. A\n2. B\n3. C\n4. D\n5. E\n6. F";
  assert.deepEqual(parseList(text, 5), ["A", "B", "C", "D", "E"]);
  assert.deepEqual(parseList(text, 3), ["A", "B", "C"]);
  assert.deepEqual(parseList(Array.from({ length: 12 }, (_, i) => `${i + 1}. n${i}`).join("\n"), 10).length, 10);
});

test("parse strips markdown, citations, descriptions and duplicates", () => {
  const text = ["Here you go:", "1. **Joe's Pizza** [1][2]", "2) Di Fara - classic Brooklyn slice", "3. L'Industrie (Williamsburg)", "4. joe's pizza", "#5: Lucali"].join("\n");
  assert.deepEqual(parseList(text, 5), ["Joe's Pizza", "Di Fara", "L'Industrie", "Lucali"]);
  assert.deepEqual(parseList("I can't rank that.", 5), []);
});

test("underscores inside a name survive; emphasis around it doesn't", () => {
  assert.deepEqual(parseList("1. snake_case_lib\n2. _Lucali_\n3. __Bold__", 5), ["snake_case_lib", "Lucali", "Bold"]);
});

test("markup in an answer stays plain text", () => {
  assert.deepEqual(parseList("1. <img src=x onerror=alert(1)>", 5), ["<img src=x onerror=alert(1)>"]);
});

test("extract text from each response shape", () => {
  assert.equal(extractText("openrouter", { choices: [{ message: { content: "1. Z" } }] }), "1. Z");
  assert.equal(extractText("OpenAI", { choices: [{ message: { content: "1. A" } }] }), "1. A");
  assert.equal(extractText("Claude", { content: [{ type: "text", text: "1. C" }] }), "1. C");
  assert.equal(extractText("Gemini", { candidates: [{ content: { parts: [{ text: "1. " }, { text: "D" }] } }] }), "1. D");
  assert.equal(extractText("OpenAI", null), "");
});

test("errors map to something actionable", () => {
  assert.equal(errorFor(401, ""), "key");
  assert.equal(errorFor(404, ""), "model");
  assert.equal(errorFor(400, "The model `x` does not exist"), "model");
  assert.equal(errorFor(400, "API key not valid"), "key");
  assert.equal(errorFor(402, ""), "limit");
  assert.equal(errorFor(429, ""), "limit");
  assert.equal(errorFor(500, ""), "provider");
});

test("duplicate lane labels get numbered", () => {
  const out = uniqueLabels([
    { label: "Sonar", transport: "openrouter", model: "perplexity/sonar" },
    { label: "Sonar", transport: "openrouter", model: "perplexity/sonar" },
  ]);
  assert.deepEqual(out.map((l) => l.label), ["Sonar", "Sonar (2)"]);
});

test("PKCE: S256 challenge matches the RFC 7636 example", async () => {
  assert.equal(await challengeFor("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
});

test("auth url carries the challenge, state and callback, and nothing secret", () => {
  const url = new URL(authUrl("https://gallop.example/ask", "chal", "st8"));
  assert.equal(url.origin, OPENROUTER_HOST);
  assert.equal(url.searchParams.get("code_challenge"), "chal");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("state"), "st8");
  assert.equal(url.searchParams.get("callback_url"), "https://gallop.example/ask");
});

test("PKCE stash expires and rejects junk", () => {
  const now = 1_000_000_000;
  const ok = JSON.stringify({ verifier: "v", state: "s", at: now - 1000 });
  assert.deepEqual(readStash(ok, now), { verifier: "v", state: "s", at: now - 1000 });
  assert.equal(readStash(JSON.stringify({ verifier: "v", state: "s", at: now - 11 * 60 * 1000 }), now), null);
  assert.equal(readStash("not json", now), null);
  assert.equal(readStash(null, now), null);
});

test("catalog keeps text models with clean ids, shortens names, prices per million", () => {
  const cat = parseCatalog({
    data: [
      { id: "anthropic/claude-haiku-4.5", name: "Anthropic: Claude Haiku 4.5", pricing: { prompt: "0.000001", completion: "0.000005" }, architecture: { output_modalities: ["text"] } },
      { id: "x/image-only", name: "Image", architecture: { output_modalities: ["image"] } },
      { id: "../evil", name: "Evil" },
      { id: "perplexity/sonar", name: "Perplexity: Sonar", pricing: { prompt: "0.000001", completion: "0.000001" } },
    ],
  });
  assert.deepEqual(cat.map((m) => m.id), ["anthropic/claude-haiku-4.5", "perplexity/sonar"]);
  assert.equal(cat[0].name, "Claude Haiku 4.5");
  assert.equal(cat[0].outPerMillion, 5);
  assert.deepEqual(searchCatalog(cat, "haiku").map((m) => m.id), ["anthropic/claude-haiku-4.5"]);
  assert.deepEqual(searchCatalog(cat, "perplexity sonar").map((m) => m.id), ["perplexity/sonar"]);
  assert.deepEqual(parseCatalog(null), []);
});
