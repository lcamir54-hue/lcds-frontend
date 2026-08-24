const STOPWORDS = new Set([
  "و",
  "در",
  "به",
  "از",
  "که",
  "این",
  "را",
  "با",
  "برای",
  "است",
  "هست",
  "یک",
  "تا",
  "هم",
  "یا",
  "اگر",
  "آیا",
  "می",
  "شد",
  "شده",
  "شود",
  "کن",
  "کنم",
  "کنید",
  "بده",
  "بگو",
  "لطفا",
  "خواهش",
  "the",
  "and",
  "for",
  "with",
]);

export function normalizeFa(text: string) {
  return text
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\u200f]/g, " ")
    .toLowerCase()
    .trim();
}

export function tokenize(text: string): string[] {
  return normalizeFa(text)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

export function plainTextFromMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>#-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?؟\n])\s+/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length > 18);
}

export function overlapScore(text: string, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const haystack = normalizeFa(text);
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += 1;
  }
  return score;
}

export function titleFromQuery(query: string) {
  const compact = query.replace(/\s+/g, " ").trim();
  if (compact.length <= 42) return compact;
  return `${compact.slice(0, 42).trimEnd()}…`;
}
