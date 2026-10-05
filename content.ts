// Every claim, link, and piece of copy on the site lives here.

export const site = {
  name: "Gallop",
  title: "Gallop. Ask four AIs the same question.",
  description:
    "OpenAI, Claude, Gemini and Perplexity answer the same questions with their top fives. Sometimes they agree. Mostly they don't.",
  url: "https://gallop-ai.vercel.app",
  repo: "https://github.com/Basseybd/gallop-ai",
  author: { name: "Bassey Duke", url: "https://basseyduke.io" },
};

export const home = {
  heading: "Ask four AIs the same question.",
  subheading: "They don't agree.",
  intro:
    "Gallop asks OpenAI, Claude, Gemini and Perplexity the same questions and keeps each one's top five. Same words in, four different answers out.",
  listHeading: "Six questions, sorted from least to most agreement",
  seeRanking: "See the full ranking",
};

export const method = {
  heading: "How it works",
  body: [
    "Each model gets the same prompt: rank the top five for a question. Gallop keeps every list and compares them.",
    "Agreement is the average overlap between each pair of top fives. Same five in any order counts as full agreement. Names that only differ in spelling, like Blue Bottle and Blue Bottle Coffee, are merged first.",
    "This is a snapshot, not a poll. Rankings come from the models, not from reviews, sales or anyone checking the answers.",
  ],
};

/** Spelling variants seen in the data, mapped to one display name. */
export const aliases: Record<string, string> = {
  "Blue Bottle": "Blue Bottle Coffee",
  Intelligentsia: "Intelligentsia Coffee",
  "Marlowe's burger": "Marlowe",
  Stumptown: "Stumptown Coffee Roasters",
  "Verve Coffee": "Verve Coffee Roasters",
};

export const question = {
  back: "All questions",
  gridHeading: "Every pick",
  gridCaption: "Each model's rank for everything any of them listed. A blank means that model left it out.",
  changesHeading: "How often each list changed",
  never: "Never changed",
  changed: (n: number) => (n === 1 ? "Changed once" : `Changed ${n} times`),
  showChanges: "Show each change",
  previous: "Previous question",
  next: "Next question",
};

export const footer = {
  builtBy: "Built by",
  source: "Source on GitHub",
};
