// Every claim, link, and piece of copy on the site lives here.

export const site = {
  name: "Gallop",
  title: "Gallop. Ask four AIs the same question.",
  description:
    "OpenAI, Claude, Gemini and Perplexity rank the same questions. On facts they mostly agree. On taste, they don’t.",
  url: "https://gallop-ai.vercel.app",
  repo: "https://github.com/Basseybd/gallop-ai",
  author: { name: "Bassey Duke", url: "https://basseyduke.io" },
  skip: "Skip to content",
  github: "GitHub",
};

export const home = {
  heading: "Ask four AIs the same question.",
  subheading: "On taste, they don’t agree.",
  intro:
    "Gallop puts OpenAI, Claude, Gemini and Perplexity side by side on the same questions and measures how much their top fives overlap. Cloud providers, they nearly match. Burgers in San Francisco, not even close.",
  ogAlt: "Gallop. Ask four AIs the same question. On taste, they don’t agree.",
  listHeading: "Every question, from least to most agreement",
  topPicksLabel: "#1 picks",
  allFourSay: (name: string) => `All four say ${name}`,
  seeRanking: "See the full ranking",
};

export const method = {
  heading: "How it works",
  body: [
    "Each model gives a ranked top five for the same question. Gallop lines the lists up and compares them, nothing more.",
    "Agreement is the average overlap between each pair of top fives. Same five in any order counts as full agreement. Names that only differ in spelling, like Blue Bottle and Blue Bottle Coffee, are merged first.",
    "The rankings come from Gallop’s first prototype. Its prompts and model versions weren’t recorded, so read this as a sample, not a study. Nobody checked whether any answer is right.",
  ],
  range: (from: string, to: string) => ({ before: "Monthly lists from ", from, middle: " to ", to, after: "." }),
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
    text: "Each model’s rank for everything any of them listed. A blank means that model left it out. As of ",
    month,
  }),
  pickColumn: "Pick",
  notListed: "Not listed",
  shortModel: { OpenAI: "OpenAI", Claude: "Claude", Gemini: "Gemini", Perplexity: "Perp." } as Record<string, string>,
  changesHeading: "How often each list changed",
  changesCaption: (from: string, to: string) => ({
    before: "Monthly, ",
    from,
    middle: " to ",
    to,
    after: ". A tick marks a month where the list or its order changed.",
  }),
  never: "Never changed",
  changed: (n: number) => (n === 1 ? "Changed once" : n === 2 ? "Changed twice" : `Changed ${n} times`),
  showChanges: "Show each change",
  dropped: "Dropped",
  newLabel: "New this month",
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

export const footer = {
  builtBy: "Built by",
  source: "Source on GitHub",
};
