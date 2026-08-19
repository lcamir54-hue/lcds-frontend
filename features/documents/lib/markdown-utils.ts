import { getMarkdownBody } from "@/features/documents/lib/frontmatter";
import type { OutlineHeading } from "@/features/documents/types";

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-");
}

export function extractOutline(markdown: string): OutlineHeading[] {
  const body = getMarkdownBody(markdown);
  const headings: OutlineHeading[] = [];
  const seen = new Map<string, number>();

  for (const line of body.split(/\r?\n/)) {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;

    const level = match[1]!.length as 1 | 2 | 3 | 4 | 5 | 6;
    const text = match[2]!.replace(/#+\s*$/, "").trim();
    if (!text) continue;

    let id = slugify(text) || "heading";
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;

    headings.push({ id, text, level });
  }

  return headings;
}

export function enhanceMarkdownForRender(markdown: string): string {
  return markdown
    .replace(/\[\[([^\]]+)\]\]/g, "[$1](#wiki:$1)")
    .replace(
      /(^|[\s(])@([\w\u0600-\u06FF_]+)/g,
      "$1[@$2](#mention:$2)",
    );
}
