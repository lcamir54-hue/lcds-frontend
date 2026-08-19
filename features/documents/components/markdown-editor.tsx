"use client";

import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

import { Crepe } from "@milkdown/crepe";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import * as React from "react";

import { getMarkdownBody } from "@/features/documents/lib/frontmatter";

type MilkdownEditorInnerProps = {
  documentId: string;
  markdown: string;
  onChange: (markdown: string) => void;
};

function MilkdownEditorInner({
  documentId,
  markdown,
  onChange,
}: MilkdownEditorInnerProps) {
  const body = getMarkdownBody(markdown);

  const { loading } = useEditor(
    (root) => {
      const crepe = new Crepe({
        root,
        defaultValue: body,
        features: {
          [Crepe.Feature.AI]: false,
          [Crepe.Feature.TopBar]: false,
        },
        featureConfigs: {
          [Crepe.Feature.Placeholder]: {
            text: "بنویسید یا / را تایپ کنید…",
            mode: "block",
          },
          [Crepe.Feature.BlockEdit]: {
            textGroup: {
              label: "متن",
              text: { label: "متن" },
              h1: { label: "عنوان ۱" },
              h2: { label: "عنوان ۲" },
              h3: { label: "عنوان ۳" },
              quote: { label: "نقل‌قول" },
              divider: { label: "جداکننده" },
            },
            listGroup: {
              label: "فهرست",
              bulletList: { label: "فهرست نشانه‌دار" },
              orderedList: { label: "فهرست شماره‌دار" },
              taskList: { label: "چک‌لیست" },
            },
            advancedGroup: {
              label: "پیشرفته",
              codeBlock: { label: "کد" },
              table: { label: "جدول" },
              image: { label: "تصویر" },
              math: { label: "فرمول" },
            },
          },
        },
      });

      crepe.on((listener) => {
        let ready = false;
        listener.markdownUpdated((_ctx, nextMarkdown, prevMarkdown) => {
          if (!ready) {
            ready = true;
            return;
          }
          if (nextMarkdown === prevMarkdown) return;
          onChange(nextMarkdown);
        });
      });

      return crepe;
    },
    [documentId],
  );

  return (
    <div className="milkdown-host mx-auto w-full max-w-[1200px] px-6 py-8 md:px-12 lg:px-16">
      {loading ? (
        <p className="text-sm text-muted-foreground">
          در حال آماده‌سازی ویرایشگر…
        </p>
      ) : null}
      <Milkdown />
    </div>
  );
}

export function MarkdownEditor({
  documentId,
  markdown,
  onChange,
}: MilkdownEditorInnerProps) {
  return (
    <MilkdownProvider>
      <MilkdownEditorInner
        key={documentId}
        documentId={documentId}
        markdown={markdown}
        onChange={onChange}
      />
    </MilkdownProvider>
  );
}
