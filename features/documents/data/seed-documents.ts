import {
  buildMarkdownDocument,
  parseDocumentMeta,
} from "@/features/documents/lib/frontmatter";
import type {
  DocumentKind,
  MarkdownDocument,
} from "@/features/documents/types";

const TODAY = "2026-08-15";

function doc(meta: {
  id: string;
  title: string;
  icon: string;
  kind: DocumentKind;
  parent?: string | null;
  order: number;
  ownerId?: string;
  allowedGroupIds?: string[];
  body: string;
}): MarkdownDocument {
  const markdown = buildMarkdownDocument({
    meta: {
      id: meta.id,
      title: meta.title,
      icon: meta.icon,
      kind: meta.kind,
      status: "draft",
      parent: meta.parent ?? null,
      order: meta.order,
      ownerId: meta.ownerId ?? "user-1",
      allowedGroupIds: meta.allowedGroupIds ?? [],
      canWrite: true,
      canCreateChild: meta.kind === "topic",
      createdAt: TODAY,
      updatedAt: TODAY,
    },
    body: meta.body.trim() + "\n",
  });

  return { id: meta.id, markdown };
}

export const SEED_DOCUMENTS: MarkdownDocument[] = [
  doc({
    id: "getting-started",
    title: "راهنمای شروع",
    icon: "📘",
    kind: "topic",
    order: 1,
    ownerId: "user-1",
    allowedGroupIds: ["group-1", "group-2"],
    body: "",
  }),
  doc({
    id: "getting-started-intro",
    title: "مقدمه",
    icon: "📄",
    kind: "page",
    parent: "getting-started",
    order: 1,
    ownerId: "user-1",
    body: `
# راهنمای شروع

این صفحه نمونه‌ای از ساختار مستندات سازمانی است که تمام محتوای آن با Markdown ایجاد و نگهداری می‌شود.

## اقدامات اولیه

- [x] ایجاد فضای کاری
- [x] تعریف ساختار صفحات
- [ ] دعوت از اعضای تیم
- [ ] تکمیل مستندات واحدها

> [!NOTE]
> تمام تغییرات این صفحه به‌صورت خودکار ذخیره می‌شوند.

## نمونه جدول

| واحد | مسئول | وضعیت |
|---|---|---|
| منابع انسانی | سارا احمدی | فعال |
| بازاریابی | علی رضایی | در حال تکمیل |
| فناوری | مریم محمدی | فعال |

## نمونه کد

\`\`\`ts
const document = {
  title: "راهنمای شروع",
  format: "markdown",
};
\`\`\`

## نمونه فرمول

$$
R_A^n - R_B^n = (R_A - R_B)(R_A^{n-1} + \\cdots + R_B^{n-1})
$$

با @علی_رضایی هماهنگ کنید.
`.trim(),
  }),
];

export function assertSeedIntegrity() {
  for (const item of SEED_DOCUMENTS) {
    parseDocumentMeta(item.markdown, item.id);
  }
}
