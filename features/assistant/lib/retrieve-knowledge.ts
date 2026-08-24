import type { KnowledgeSource } from "@/features/assistant/types";
import {
  overlapScore,
  plainTextFromMarkdown,
  splitSentences,
  tokenize,
} from "@/features/assistant/lib/text";
import { getMarkdownBody } from "@/features/documents/lib/frontmatter";
import { knowledgeItemHref } from "@/features/documents/lib/knowledge-routes";
import { flattenKnowledgeTree } from "@/features/documents/lib/tree";
import type { DocumentMeta } from "@/features/documents/types";
import { getKnowledgeTree, getPage, getTopic } from "@/lib/api/knowledge";

type IndexedItem = DocumentMeta & {
  topicTitle: string;
  body: string;
};

const bodyCache = new Map<string, string>();
let treeCache: { at: number; items: DocumentMeta[] } | null = null;
const TREE_TTL_MS = 30_000;

export async function loadAssistantKnowledgeItems(): Promise<DocumentMeta[]> {
  const now = Date.now();
  if (treeCache && now - treeCache.at < TREE_TTL_MS) {
    return treeCache.items;
  }
  const tree = await getKnowledgeTree();
  const items = flattenKnowledgeTree(tree.topics);
  treeCache = { at: now, items };
  return items;
}

function topicTitleFor(item: DocumentMeta, items: DocumentMeta[]) {
  if (item.kind === "topic") return item.title;
  const parent = items.find((candidate) => candidate.id === item.parent);
  return parent?.title ?? "";
}

async function readBody(item: DocumentMeta): Promise<string> {
  const cached = bodyCache.get(item.id);
  if (cached !== undefined) return cached;

  try {
    if (item.kind === "page") {
      const page = await getPage(item.id);
      const body = plainTextFromMarkdown(getMarkdownBody(page.markdown));
      bodyCache.set(item.id, body);
      return body;
    }
    if (item.kind === "topic") {
      const topic = await getTopic(item.id);
      const body = plainTextFromMarkdown(getMarkdownBody(topic.markdown));
      bodyCache.set(item.id, body);
      return body;
    }
  } catch {
    bodyCache.set(item.id, "");
    return "";
  }

  bodyCache.set(item.id, "");
  return "";
}

function excerptFrom(body: string, tokens: string[]) {
  const sentences = splitSentences(body);
  if (sentences.length === 0) {
    return body.slice(0, 180).trim();
  }
  const ranked = [...sentences]
    .map((sentence) => ({
      sentence,
      score: overlapScore(sentence, tokens),
    }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (best && best.score > 0) return best.sentence.slice(0, 220);
  return sentences[0]!.slice(0, 180);
}

function scoreItem(item: IndexedItem, tokens: string[], query: string) {
  const normalizedQuery = query.trim();
  const titleScore = overlapScore(item.title, tokens) * 6;
  const topicScore = overlapScore(item.topicTitle, tokens) * 3;
  const bodyScore = overlapScore(item.body.slice(0, 4000), tokens);
  const phraseBonus =
    normalizedQuery.length > 2 && item.title.includes(normalizedQuery) ? 12 : 0;
  const publishedBonus = item.status === "published" ? 2 : 0;
  const kindBonus = item.kind === "page" ? 2 : item.kind === "process" ? 1 : 0;
  return (
    titleScore + topicScore + bodyScore + phraseBonus + publishedBonus + kindBonus
  );
}

export async function retrieveOrganizationalKnowledge(
  query: string,
  limit = 4,
): Promise<{ sources: KnowledgeSource[]; note: string }> {
  const tokens = tokenize(query);
  const items = await loadAssistantKnowledgeItems();
  if (items.length === 0) {
    return {
      sources: [],
      note: "درخت دانش سازمانی خالی است؛ منبعی برای پیشنهاد وجود نداشت.",
    };
  }

  const prelim = items
    .map((item) => {
      const topicTitle = topicTitleFor(item, items);
      const titleScore =
        overlapScore(item.title, tokens) * 6 +
        overlapScore(topicTitle, tokens) * 3 +
        (item.status === "published" ? 1 : 0);
      return { item, topicTitle, titleScore };
    })
    .sort((a, b) => b.titleScore - a.titleScore);

  const hydrated: IndexedItem[] = await Promise.all(
    prelim.slice(0, Math.min(12, prelim.length)).map(async ({ item, topicTitle }) => ({
      ...item,
      topicTitle,
      body: item.kind === "process" ? "" : await readBody(item),
    })),
  );

  const ranked = hydrated
    .map((item) => ({
      item,
      score: scoreItem(item, tokens, query),
    }))
    .filter((entry) => entry.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const sources: KnowledgeSource[] = ranked.map(({ item, score }) => ({
    id: item.id,
    kind: item.kind,
    title: item.title,
    icon: item.icon || (item.kind === "process" ? "⚙️" : "📄"),
    topicId: item.kind === "topic" ? item.id : (item.parent ?? null),
    topicTitle: item.topicTitle,
    href: knowledgeItemHref(item),
    excerpt:
      item.kind === "process"
        ? "این مورد یک فرآیند سازمانی است. جزئیات در صفحهٔ فرآیند قابل مشاهده است."
        : excerptFrom(item.body, tokens) || "متن این دانش برای تطبیق بارگذاری شد.",
    score,
  }));

  if (sources.length === 0) {
    return {
      sources: [],
      note: "برای این پرسش، دانش سازمانی مرتبطی پیشنهاد نشد.",
    };
  }

  return {
    sources,
    note: `${new Intl.NumberFormat("fa-IR").format(sources.length)} دانش سازمانی برای این پرسش پیشنهاد شد.`,
  };
}
