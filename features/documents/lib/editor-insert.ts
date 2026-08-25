import { type Editor, editorViewCtx } from "@milkdown/kit/core";
import { replaceRange } from "@milkdown/kit/utils";

export type DictationAnchor = {
  from: number;
  length: number;
  pad: string;
};

export function captureEditorSelection(editor: Editor): {
  from: number;
  length: number;
} {
  return editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const { from, to } = view.state.selection;
    return { from, length: Math.max(0, to - from) };
  });
}

export function captureDictationAnchor(editor: Editor): DictationAnchor {
  return editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const { from, to } = view.state.selection;
    const before =
      from > 1 ? view.state.doc.textBetween(from - 1, from, "", "") : "";
    const pad = before && !/\s/.test(before) ? " " : "";
    view.focus();
    return { from, length: Math.max(0, to - from), pad };
  });
}

export function replaceEditorRange(
  editor: Editor,
  from: number,
  length: number,
  text: string,
): number {
  return editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const size = view.state.doc.content.size;
    const start = Math.max(0, Math.min(from, size));
    const end = Math.max(start, Math.min(start + length, size));
    view.dispatch(view.state.tr.insertText(text, start, end).scrollIntoView());
    view.focus();
    return text.length;
  });
}

export function replaceEditorRangeWithMarkdown(
  editor: Editor,
  from: number,
  length: number,
  markdown: string,
) {
  editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const size = view.state.doc.content.size;
    const start = Math.max(0, Math.min(from, size));
    const end = Math.max(start, Math.min(start + length, size));
    replaceRange(markdown, { from: start, to: end })(ctx);
    view.focus();
  });
}
