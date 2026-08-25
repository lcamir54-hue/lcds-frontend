import type { WritingTaskId } from "@/features/documents/lib/writing-assist-prompts";

export const STRUCTURED_MARKDOWN_TASKS = new Set<WritingTaskId>([
  "takeaways",
  "actions",
  "table",
]);

export function usesStructuredMarkdown(taskId: WritingTaskId) {
  return STRUCTURED_MARKDOWN_TASKS.has(taskId);
}

function stripMarkdownFence(text: string) {
  return text
    .trim()
    .replace(/^```(?:markdown|md|gfm)?\s*\n?([\s\S]*?)\n?```$/i, "$1")
    .trim();
}

function normalizeBulletList(text: string) {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (/^[-*+•]\s+/.test(trimmed)) {
        return trimmed.replace(/^[-*+•]\s+/, "- ");
      }
      return `- ${trimmed}`;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeTaskList(text: string) {
  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      if (/^-\s*\[[ xX]\]\s+/.test(trimmed)) {
        return trimmed.replace(/^-\s*\[[ xX]\]\s+/, "- [ ] ");
      }
      if (/^[-*+•]\s+/.test(trimmed)) {
        return trimmed.replace(/^[-*+•]\s+/, "- [ ] ");
      }
      return `- [ ] ${trimmed}`;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countTableColumns(line: string) {
  const trimmed = line.trim();
  const parts = trimmed.startsWith("|")
    ? trimmed.slice(1).split("|")
    : trimmed.split("|");
  return parts.filter((part) => part.trim().length > 0).length;
}

function normalizeMarkdownTable(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const tableLines = lines.filter((line) => line.includes("|"));
  if (tableLines.length === 0) return text.trim();

  const normalized = tableLines.map((line) => {
    let next = line.trim();
    if (!next.startsWith("|")) next = `| ${next}`;
    if (!next.endsWith("|")) next = `${next} |`;
    return next.replace(/\s*\|\s*/g, " | ").replace(/^\|\s*/, "| ").trim();
  });

  const hasSeparator = normalized.some((line) =>
    /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line),
  );

  if (!hasSeparator && normalized.length >= 1) {
    const columns = countTableColumns(normalized[0]!);
    const separator = `| ${Array.from({ length: columns }, () => "---").join(" | ")} |`;
    normalized.splice(1, 0, separator);
  }

  return normalized.join("\n");
}

export function normalizeWritingAssistMarkdown(
  taskId: WritingTaskId,
  text: string,
) {
  const stripped = stripMarkdownFence(text);
  if (!stripped) return "";

  switch (taskId) {
    case "takeaways":
      return normalizeBulletList(stripped);
    case "actions":
      return normalizeTaskList(stripped);
    case "table":
      return normalizeMarkdownTable(stripped);
    default:
      return stripped;
  }
}
