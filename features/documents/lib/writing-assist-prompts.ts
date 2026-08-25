export type WritingTaskId =
  | "improve"
  | "proofread"
  | "shorter"
  | "summarize"
  | "takeaways"
  | "actions"
  | "table"
  | "formal"
  | "simple"
  | "translate";

export const WRITING_ASSIST_SYSTEM_PROMPT = `You are a professional writing assistant embedded in an organizational knowledge management system (LCDS). Users edit Markdown documents in Persian and English.

Follow these rules strictly:
- Output ONLY the result text in Markdown. No introductions, labels, or meta commentary (never write phrases like "Here is..." or «در ادامه...»).
- Preserve factual content from the source. Do not invent information.
- Keep the source language unless the task is translation.
- Preserve Markdown syntax (headings, lists, links, code blocks, tables) when it fits the task.
- For Persian output, use correct grammar, spelling, and natural phrasing.
- Be direct and useful.`;

const SOURCE_BLOCK = (source: string) =>
  `---\n${source.trim()}\n---`;

const TASK_PROMPTS: Record<WritingTaskId, (source: string) => string> = {
  improve: (source) =>
    `Improve the writing quality of the Markdown text below. Enhance clarity, flow, and readability while preserving meaning, tone intent, and approximate length. Fix awkward phrasing. Keep existing Markdown structure unless a small fix clearly helps.

${SOURCE_BLOCK(source)}`,

  proofread: (source) =>
    `Proofread the Markdown text below. Fix spelling, punctuation, and grammar errors only. Do not change meaning, tone, or wording unless required for correctness. Preserve Markdown formatting exactly.

${SOURCE_BLOCK(source)}`,

  shorter: (source) =>
    `Make the Markdown text below shorter. Remove redundancy and wordiness while keeping all essential information. Preserve the most important Markdown structure (headings, lists, emphasis).

${SOURCE_BLOCK(source)}`,

  summarize: (source) =>
    `Write a concise summary of the Markdown text below in the same language as the source. Use 2–4 short paragraphs, or a brief bullet list if that communicates the summary more clearly.

${SOURCE_BLOCK(source)}`,

  takeaways: (source) =>
    `Extract the key takeaways from the Markdown text below.

Output valid GitHub-Flavored Markdown ONLY: a bullet list where every line starts with "- " (hyphen + space). One insight per line. No numbering, no headings, no intro text.

Example format:
- نکته اول
- نکته دوم

Use the same language as the source.

${SOURCE_BLOCK(source)}`,

  actions: (source) =>
    `Extract concrete action items from the Markdown text below.

Output valid GitHub-Flavored Markdown ONLY: a task list where every line starts with "- [ ] " (hyphen, space, brackets, space). One action per line. No headings, no intro text.

Example format:
- [ ] هماهنگی با واحد منابع انسانی
- [ ] تکمیل مستندات

Use the same language as the source.

${SOURCE_BLOCK(source)}`,

  table: (source) =>
    `Convert the information in the Markdown text below into a GitHub-Flavored Markdown table.

Output valid GFM table syntax ONLY:
- First row: column headers
- Second row: separator with --- between pipes
- Following rows: data cells
- Every row must start and end with |

Example format:
| واحد | مسئول | وضعیت |
| --- | --- | --- |
| منابع انسانی | سارا احمدی | فعال |

Use the same language as the source. No headings or intro text.

${SOURCE_BLOCK(source)}`,

  formal: (source) =>
    `Rewrite the Markdown text below in a more formal, professional tone suitable for organizational documentation. Preserve meaning and Markdown structure.

${SOURCE_BLOCK(source)}`,

  simple: (source) =>
    `Rewrite the Markdown text below in simpler, plainer language so non-experts can understand. Use shorter sentences and common words. Preserve meaning and Markdown structure.

${SOURCE_BLOCK(source)}`,

  translate: (source) =>
    `Translate the Markdown text below. If the text is primarily in Persian, translate to English. If it is primarily in English or another language, translate to Persian. Preserve Markdown formatting (headings, lists, links, code blocks, tables) as much as possible.

${SOURCE_BLOCK(source)}`,
};

export function buildWritingAssistRequest(
  taskId: WritingTaskId,
  source: string,
): { prompt: string; system_prompt: string } {
  const build = TASK_PROMPTS[taskId];
  return {
    prompt: build(source),
    system_prompt: WRITING_ASSIST_SYSTEM_PROMPT,
  };
}
