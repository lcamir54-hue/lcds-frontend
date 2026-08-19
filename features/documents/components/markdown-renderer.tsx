"use client";

import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";

import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/features/documents/hooks/use-workspace-store";
import { getMarkdownBody } from "@/features/documents/lib/frontmatter";
import { knowledgeItemHref } from "@/features/documents/lib/knowledge-routes";
import {
  enhanceMarkdownForRender,
  extractOutline,
} from "@/features/documents/lib/markdown-utils";
import { cn } from "@/lib/utils";

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className"]],
    span: [...(defaultSchema.attributes?.span ?? []), ["className"]],
    div: [...(defaultSchema.attributes?.div ?? []), ["className"]],
    a: [...(defaultSchema.attributes?.a ?? []), ["className"], ["href"], ["target"], ["rel"]],
    pre: [...(defaultSchema.attributes?.pre ?? []), ["className"]],
  },
};

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = React.useState(false);
  const text = String(children).replace(/\n$/, "");

  return (
    <div className="group relative my-4 overflow-hidden rounded-md border border-border bg-muted/60">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute end-2 top-2 size-7 opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="کپی کد"
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </Button>
      <pre className="ltr-isolate overflow-x-auto p-4 text-[13px] leading-relaxed" dir="ltr">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

function CalloutBlock({
  type,
  children,
}: {
  type: "note" | "warning" | "error";
  children: React.ReactNode;
}) {
  return (
    <aside
      className={cn(
        "my-4 rounded-md border px-3 py-2 text-sm",
        type === "note" &&
          "border-callout-note-border bg-callout-note text-callout-note-foreground",
        type === "warning" &&
          "border-callout-warning-border bg-callout-warning text-callout-warning-foreground",
        type === "error" &&
          "border-callout-error-border bg-callout-error text-callout-error-foreground",
      )}
    >
      {children}
    </aside>
  );
}

function getCalloutType(children: React.ReactNode): "note" | "warning" | "error" | null {
  const text = React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string") return child;
      if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
        return String(child.props.children ?? "");
      }
      return "";
    })
    .join(" ");

  if (/\[!NOTE\]/i.test(text)) return "note";
  if (/\[!WARNING\]/i.test(text)) return "warning";
  if (/\[!ERROR\]|\[!CAUTION\]/i.test(text)) return "error";
  return null;
}

function stripCalloutMarker(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      return child.replace(/\[!(NOTE|WARNING|ERROR|CAUTION)\]\s*/i, "");
    }
    if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
      return React.cloneElement(child, {
        children: stripCalloutMarker(child.props.children),
      });
    }
    return child;
  });
}

export function MarkdownRenderer({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  const router = useRouter();
  const items = useWorkspaceStore((s) => s.items);
  const setActiveDocument = useWorkspaceStore((s) => s.setActiveDocument);
  const body = enhanceMarkdownForRender(getMarkdownBody(markdown));
  const outline = extractOutline(markdown);
  let headingIndex = 0;

  return (
    <article
      className={cn(
        "markdown-body mx-auto w-full max-w-[1200px] px-6 py-8 md:px-12 lg:px-16",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeKatex,
          rehypeHighlight,
          [rehypeSanitize, sanitizeSchema],
        ]}
        components={{
          h1: ({ children }) => {
            const id = outline[headingIndex++]?.id;
            return (
              <h1 id={id} className="mt-8 mb-3 text-3xl font-semibold tracking-tight">
                {children}
              </h1>
            );
          },
          h2: ({ children }) => {
            const id = outline[headingIndex++]?.id;
            return (
              <h2 id={id} className="mt-7 mb-2 text-xl font-semibold tracking-tight">
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const id = outline[headingIndex++]?.id;
            return (
              <h3 id={id} className="mt-5 mb-2 text-lg font-medium">
                {children}
              </h3>
            );
          },
          h4: ({ children }) => {
            const id = outline[headingIndex++]?.id;
            return (
              <h4 id={id} className="mt-4 mb-2 text-base font-medium">
                {children}
              </h4>
            );
          },
          h5: ({ children }) => {
            const id = outline[headingIndex++]?.id;
            return (
              <h5 id={id} className="mt-3 mb-1.5 text-sm font-medium">
                {children}
              </h5>
            );
          },
          h6: ({ children }) => {
            const id = outline[headingIndex++]?.id;
            return (
              <h6 id={id} className="mt-3 mb-1.5 text-sm font-medium text-muted-foreground">
                {children}
              </h6>
            );
          },
          p: ({ children }) => (
            <p className="my-3 leading-7 text-foreground" dir="auto">
              {children}
            </p>
          ),
          a: ({ href, children }) => {
            if (href?.startsWith("#wiki:")) {
              const title = decodeURIComponent(href.slice(6));
              return (
                <button
                  type="button"
                  className="text-primary underline-offset-2 hover:underline"
                  onClick={() => {
                    const match = items.find((item) => item.title === title);
                    if (!match) return;
                    void setActiveDocument(match.id);
                    const href = knowledgeItemHref(match);
                    if (href) router.push(href);
                  }}
                >
                  {children}
                </button>
              );
            }
            if (href?.startsWith("#mention:")) {
              return (
                <span className="rounded-sm bg-primary/10 px-1 py-0.5 text-primary">
                  {children}
                </span>
              );
            }
            return (
              <a
                href={href}
                className="ltr-isolate text-primary underline-offset-2 hover:underline"
                target={href?.startsWith("http") ? "_blank" : undefined}
                rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                {children}
              </a>
            );
          },
          ul: ({ children }) => (
            <ul className="my-3 list-disc space-y-1 pe-5 ps-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 list-decimal space-y-1 pe-5 ps-1">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-7" dir="auto">{children}</li>,
          blockquote: ({ children }) => {
            const type = getCalloutType(children);
            if (type) {
              return (
                <CalloutBlock type={type}>
                  {stripCalloutMarker(children)}
                </CalloutBlock>
              );
            }
            return (
              <blockquote className="my-4 border-s-2 border-border ps-3 text-muted-foreground">
                {children}
              </blockquote>
            );
          },
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-md border border-border">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border bg-muted px-3 py-2 text-start font-medium">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-3 py-2 align-top" dir="auto">
              {children}
            </td>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = Boolean(className);
            if (isBlock) {
              return <CodeBlock className={className}>{children}</CodeBlock>;
            }
            return (
              <code
                className="ltr-isolate rounded-sm bg-muted px-1 py-0.5 text-[0.85em]"
                dir="ltr"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={alt ?? ""}
              className="my-4 h-auto max-w-full rounded-md border border-border"
            />
          ),
          hr: () => <hr className="my-8 border-border" />,
        }}
      >
        {body}
      </ReactMarkdown>
    </article>
  );
}
