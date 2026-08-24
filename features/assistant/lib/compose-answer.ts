import type {
  AssistantModelChoice,
  KnowledgeSource,
} from "@/features/assistant/types";

function kindLabel(kind: KnowledgeSource["kind"]) {
  if (kind === "topic") return "عنوان";
  if (kind === "process") return "فرآیند";
  return "صفحه";
}

function sourceHeading(source: KnowledgeSource) {
  const topic = source.topicTitle ? ` · ${source.topicTitle}` : "";
  return `**${source.title}** (${kindLabel(source.kind)}${topic})`;
}

export function composeKnowledgeAnswer(input: {
  query: string;
  sources: KnowledgeSource[];
  model: AssistantModelChoice;
}): string {
  const { query, sources, model } = input;
  const trimmed = query.trim();

  if (sources.length === 0) {
    return [
      "در دانش سازمانی فعلی منبع مرتبطی برای این پرسش پیدا نشد.",
      "",
      "پاسخ مدل ثبت شد، اما چون دانش پیشنهادشده‌ای وجود نداشت، ادعای جدیدی ساخته نشد.",
      "",
      "می‌توانید پرسش را با نام صفحه، عنوان یا فرآیند دقیق‌تر تکرار کنید.",
    ].join("\n");
  }

  const intro = `پرسش شما با ${sources.length} دانش سازمانی پیشنهادی پاسخ داده شد.`;

  if (model.id === "lcds-concise") {
    const first = sources[0]!;
    const extra =
      sources.length > 1
        ? `منابع دیگر: ${sources
            .slice(1)
            .map((source) => source.title)
            .join("، ")}.`
        : "";
    return [
      intro,
      "",
      first.excerpt
        ? `بر اساس «${first.title}»: ${first.excerpt}`
        : `مرتبط‌ترین منبع، «${first.title}» است.`,
      extra,
    ]
      .filter(Boolean)
      .join("\n");
  }

  const blocks = sources.map((source) => {
    const quote = source.excerpt ? `\n\n> ${source.excerpt}` : "";
    if (model.id === "lcds-detailed") {
      return `### ${source.title}${quote}\n\n${sourceHeading(source)}`;
    }
    return `${sourceHeading(source)}${quote}`;
  });

  return [
    intro,
    "",
    trimmed ? `پرسش ثبت‌شده: «${trimmed}»` : "",
    "",
    "پاسخ فقط از دانش‌های پیشنهادشده در همین نوبت استخراج شده است:",
    "",
    blocks.join("\n\n"),
  ]
    .filter((line) => line !== "")
    .join("\n");
}
