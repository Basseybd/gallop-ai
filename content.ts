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
  askNav: "Ask",
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
  askYourOwn: "Ask your own question",
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

export const ask = {
  title: "Ask your own",
  description: "Ask any AI models the same question with your own OpenRouter account or API keys, and see where they agree.",
  heading: "Ask your own question.",
  intro: "Pick two to six models, ask one question, and see where their rankings line up. It runs on your own OpenRouter credit or API keys.",
  questionLabel: "Your question",
  questionHint: (max: number) => `Something with more than one good answer, like best pizza in New York. Up to ${max} characters.`,
  lengthLegend: "How many each",
  lengthOption: (n: number) => `Top ${n}`,

  connectHeading: "Connect",
  connectButton: "Connect OpenRouter",
  connecting: "Connecting",
  connected: "Connected to OpenRouter.",
  disconnect: "Disconnect",
  disconnected: "Disconnected. The key is gone from this page.",
  connectBody:
    "One click. OpenRouter gives this page a key that only lives in this tab and only goes back to OpenRouter. Gallop’s server never sees it, nothing is saved, and it’s gone when you reload.",
  connectNote:
    "Each connection adds a key named Gallop to your OpenRouter account. Delete old ones there any time, or set a credit limit when you connect.",
  connectFailed: "OpenRouter didn’t finish connecting. Try again.",
  connectExpired: "That connection link expired or came from somewhere else. Connect again.",
  privacyLink: "Read how keys are used",
  privacyHref: "https://github.com/Basseybd/gallop-ai/blob/main/lib/ask.ts",

  modeKeys: "Use your own provider keys instead",
  modeOpenRouter: "Use OpenRouter instead",
  keysHeading: "Your API keys",
  keysBody:
    "Each key goes straight from this browser to its own provider. Gallop’s server never sees them, nothing is saved, and they’re gone when you reload.",
  keyLabel: (provider: string) => `${provider} API key`,
  keyHint: "Leave blank to skip. Each answer is capped at a few hundred tokens on your account.",
  clearKeys: "Clear keys",
  cleared: "Keys cleared.",
  providerModelsSummary: "Model names",
  providerModelLabel: (provider: string) => `${provider} model`,
  providerModelHint: "Change these if a provider renames its models.",

  lanesHeading: "Models",
  lanesHint: (min: number, max: number) => `Compare ${min} to ${max}. Any model on OpenRouter works, even two from the same company.`,
  removeLane: (label: string) => `Remove ${label}`,
  addModel: "Add a model",
  pickerLabel: "Search models",
  pickerHint: "Try a company or a model, like claude, gpt or llama.",
  pickerLoading: "Loading OpenRouter’s models",
  pickerFailed: "Couldn’t load the model list. Type a model id instead, like mistralai/mistral-small.",
  pickerEmpty: "No models match. Try a shorter search.",
  pickerUseId: (id: string) => `Use ${id}`,
  pickerPrice: (out: number | null) => (out === null ? "" : out === 0 ? "free" : `$${out} per 1M out`),
  pickerClose: "Done",
  lanesFull: (max: number) => `That’s ${max}, the most this page compares at once.`,

  submit: "Ask",
  asking: "Asking",
  needConnection: "Connect OpenRouter first, or switch to your own keys.",
  needTwo: (min: number) => `Pick at least ${min} models to compare.`,
  needTwoKeys: "Add keys for at least two providers to compare them.",
  badQuestion: (max: number) => `Ask something between 3 and ${max} characters.`,
  badKey: (provider: string) => `That ${provider} key has spaces or odd characters. Paste it again.`,
  badModel: (label: string) => `The model name for ${label} can only use letters, numbers, dots, dashes, slashes and colons.`,

  waiting: "Waiting",
  gridHeading: "Every pick",
  gridCaption: "Each model’s rank for everything any of them listed. A blank means that model left it out.",
  onlyOne: "Only one model answered, so there’s nothing to compare. Fix the others and ask again.",
  errors: {
    key: (m: string) => `${m}: the key was rejected. Reconnect or check it, then try again.`,
    model: (m: string) => `${m}: that model wasn’t found. Swap it for another and try again.`,
    limit: (m: string) => `${m}: out of credit or rate limited. Wait a minute or top up, then try again.`,
    network: (m: string) =>
      m === "Perplexity"
        ? "Couldn’t reach Perplexity from the browser. Its API may not allow direct browser calls. Use OpenRouter for Perplexity instead."
        : `Couldn’t reach ${m}. Check your connection and try again.`,
    timeout: (m: string) => `${m} took longer than 45 seconds. Try again or pick a faster model.`,
    unreadable: (m: string) => `${m} answered, but not with a numbered list. Try rewording the question.`,
    provider: (m: string) => `${m} had a problem on its end. Try again in a moment.`,
  },
};

/** Sentence parts for the summaries in lib/analysis.ts, which stays pure and takes these as an argument. */
export const summaryCopy = {
  numbers: ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"],
  totals: ["none", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"],
  and: " and ",
  allAgree: (name: string, total: number, totalWord: string) =>
    total === 2 ? `${name} is #1 for both.` : `${name} is #1 for all ${totalWord}.`,
  allDifferent: (countWord: string) => `${countWord} different #1 picks.`,
  says: (models: string, name: string, plural: boolean) => `${models} ${plural ? "say" : "says"} ${name}`,
  majority: (count: string, name: string, totalWord: string) => `${count} of ${totalWord} put ${name} first.`,
  sameList: (total: number, totalWord: string, lengthWord: string) =>
    total === 2 ? `Both give the same ${lengthWord}.` : `All ${totalWord} give the same ${lengthWord}.`,
  noneShared: "Nothing makes every list.",
  shared: (count: string, n: number) => `${count} ${n === 1 ? "makes" : "make"} every list.`,
  across: (picks: number, distinct: number) => `Across ${picks} picks, ${distinct} different names.`,
};

export const footer = {
  builtBy: "Built by",
  source: "Source on GitHub",
};
