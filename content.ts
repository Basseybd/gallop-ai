// Every claim, link, and piece of copy on the site lives here.

export const site = {
  name: "Gallop",
  title: "Gallop. Ask four AIs the same question.",
  titleTemplate: "%s | Gallop",
  description:
    "OpenAI, Claude, Gemini and Perplexity rank the same questions. On big names they mostly agree. On local spots, they barely overlap.",
  url: "https://gallop-ai-eight.vercel.app",
  repo: "https://github.com/Basseybd/gallop-ai",
  author: { name: "Bassey Duke", url: "https://basseyduke.io" },
  skip: "Skip to content",
  github: "GitHub",
};

export const home = {
  heading: "Ask four AIs the same question.",
  subheading: "On local spots, they don’t agree.",
  intro:
    "Gallop lines up the top fives from OpenAI, Claude, Gemini and Perplexity and measures the overlap. Cloud providers, they nearly match. Burgers in San Francisco, not even close.",
  ogAlt: (question: string, picks: string) =>
    `Gallop. Ask four AIs the same question. ${question} ${picks}`,
  listHeading: "Every question, from least to most agreement",
  topPicksLabel: "#1 picks",
  listSeparator: ", ",
  allFourSay: (name: string) => `All four say ${name}`,
  seeRanking: "See the full ranking",
};

export const method = {
  heading: "How it works",
  body: [
    "Each model gives a ranked top five for the same question. Gallop lines the lists up and compares them, nothing more.",
    "Agreement is the average overlap between each pair of top fives. Same five in any order counts as full agreement. Names that only differ in spelling, like Blue Bottle and Blue Bottle Coffee, are merged first.",
    "The rankings come from Gallop’s first prototype and were saved in one batch, labeled by month. How they were made wasn’t recorded: not the prompts, not the model versions, not whether each month was asked in that month. Read it as a sample, not a study. Nobody checked whether any answer is right.",
  ],
  range: (from: string, to: string) => ({ before: "Lists labeled ", from, middle: " to ", to, after: "." }),
};

/** Spelling variants seen in the data, mapped to one display name. */
export const aliases: Record<string, string> = {
  "Blue Bottle": "Blue Bottle Coffee",
  Intelligentsia: "Intelligentsia Coffee",
  "Marlowe's burger": "Marlowe",
  Stumptown: "Stumptown Coffee Roasters",
  "Verve Coffee": "Verve Coffee Roasters",
};

export const agreementLabels = {
  same: "Same five",
  mostly: "Mostly agree",
  some: "Some overlap",
  little: "Little overlap",
  none: "Almost none",
  sr: (pct: number) => `Agreement ${pct} percent.`,
};

export const question = {
  back: "All questions",
  gridHeading: "Every pick",
  gridCaption: (month: string) => ({
    text: "Each model’s rank for everything any of them listed. A blank means that model left it out. From the list labeled ",
    month,
  }),
  pickColumn: "Pick",
  notListed: "Not listed",
  shortModel: { OpenAI: "OpenAI", Claude: "Claude", Gemini: "Gemini", Perplexity: "Perp." } as Record<string, string>,
  changesHeading: "How much each list shifts",
  changesCaption: (from: string, to: string) => ({
    before: "Across the saved months, ",
    from,
    middle: " to ",
    to,
    after: ". A tick marks a month where the list or its order differs from the one before.",
  }),
  never: "Never changed",
  changed: (n: number) => (n === 1 ? "Changed once" : n === 2 ? "Changed twice" : `Changed ${n} times`),
  showChanges: "Show each change",
  showChangesFor: (model: string) => ` for ${model}`,
  dropped: "Dropped",
  newLabel: "New",
  listSeparator: ", ",
  labelSeparator: ":",
  moreQuestions: "More questions",
  previous: "Previous question",
  next: "Next question",
};

export const notFound = {
  title: "Page not found",
  heading: "This page isn’t here.",
  body: "The link may be old. Every question is on the home page.",
  action: "See all questions",
};

/** Sentence parts for the summaries in lib/analysis.ts, which stays pure and takes these as an argument. */
export const summaryCopy = {
  numbers: ["No", "One", "Two", "Three", "Four", "Five"],
  and: " and ",
  allFour: (name: string) => `${name} is #1 for all four.`,
  allDifferent: "Four different #1 picks.",
  says: (models: string, name: string, plural: boolean) => `${models} ${plural ? "say" : "says"} ${name}`,
  majority: (count: string, name: string) => `${count} of four put ${name} first.`,
  sameFive: "All four give the same five.",
  noneShared: "Nothing makes every list.",
  shared: (count: string, n: number) => `${count} ${n === 1 ? "makes" : "make"} every list.`,
  across: (picks: number, distinct: number) => `Across ${picks} picks, ${distinct} different names.`,
};

export const footer = {
  builtBy: "Built by",
  source: "Source on GitHub",
};
