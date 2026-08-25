"use client";

import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

import { Crepe } from "@milkdown/crepe";
import { replaceAll } from "@milkdown/kit/utils";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import * as React from "react";

import { MarkdownVoiceControl } from "@/features/documents/components/markdown-voice-control";
import { MarkdownWritingAssist } from "@/features/documents/components/markdown-writing-assist";
import { getMarkdownBody } from "@/features/documents/lib/frontmatter";
import {
  isTokenIncreaseBlocked,
  PAGE_TOKEN_LIMIT_MESSAGE,
  validatePageContent,
} from "@/features/documents/lib/page-tokens";

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
  const [limitReached, setLimitReached] = React.useState(
    () => !validatePageContent(body).allowed,
  );

  const { loading, get } = useEditor(
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
        let reverting = false;

        listener.markdownUpdated((_ctx, nextMarkdown, prevMarkdown) => {
          if (!ready) {
            ready = true;
            return;
          }
          if (reverting) {
            reverting = false;
            return;
          }
          if (nextMarkdown === prevMarkdown) return;

          if (isTokenIncreaseBlocked(prevMarkdown, nextMarkdown)) {
            reverting = true;
            crepe.editor.action(replaceAll(prevMarkdown));
            setLimitReached(!validatePageContent(prevMarkdown).allowed);
            return;
          }

          const validation = validatePageContent(nextMarkdown);
          setLimitReached(!validation.allowed);
          onChange(nextMarkdown);
        });
      });

      return crepe;
    },
    [documentId],
  );

  React.useEffect(() => {
    setLimitReached(!validatePageContent(getMarkdownBody(markdown)).allowed);
  }, [markdown]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {limitReached ? (
        <div
          role="alert"
          className="border-b border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-relaxed text-destructive md:px-5"
        >
          {PAGE_TOKEN_LIMIT_MESSAGE}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="milkdown-host mx-auto w-full max-w-[1200px] px-6 py-8 pb-24 md:px-12 lg:px-16">
          {loading ? (
            <p className="text-sm text-muted-foreground">
              در حال آماده‌سازی ویرایشگر…
            </p>
          ) : null}
          <Milkdown />
        </div>
      </div>
      <MarkdownWritingAssist
        disabled={loading || limitReached}
        getEditor={get}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
        <div className="pointer-events-auto">
          <MarkdownVoiceControl
            disabled={loading || limitReached}
            getEditor={get}
          />
        </div>
      </div>
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
