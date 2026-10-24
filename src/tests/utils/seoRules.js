// Shared SEO test rules (see the 2026-10-24 SEO brief).

// Words the DigiDollar legal rules ban anywhere in SEO text: titles,
// descriptions, intros, llms.txt and JSON-LD (brief rule 6, plus "token").
export const BANNED_WORDS = [
  /\btoken/i,
  /\bprice/i,
  /\binvest/i,
  /\breturns?\b/i,
  /scarc/i,
  /world'?s first/i,
  /guarantee/i,
  /\bprofit/i,
];

// Crawlers that must each get their own `Allow: /` group in robots.txt.
export const CRAWLERS = [
  'Googlebot', 'Google-Extended', 'GoogleOther', 'Bingbot', 'Applebot', 'Applebot-Extended',
  'DuckDuckBot', 'DuckAssistBot', 'YandexBot', 'Baiduspider',
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot',
  'anthropic-ai', 'PerplexityBot', 'Perplexity-User',
  'CCBot', 'meta-externalagent', 'FacebookBot', 'Amazonbot', 'MistralAI-User', 'cohere-ai', 'YouBot',
];
