"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Icon } from "./ui";
import { toast } from "@/lib/client";

function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const lang = (className || "").replace("language-", "") || "teks";
  const text = String(children).replace(/\n$/, "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast("Kode disalin", "ok");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Gagal menyalin", "err");
    }
  };

  return (
    <div className="codeblock my-4">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-cream/10">
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-eyebrow text-cream/50">
          <span className="flex gap-1.5">
            <i className="w-2.5 h-2.5 rounded-full bg-cream/20" />
            <i className="w-2.5 h-2.5 rounded-full bg-cream/20" />
            <i className="w-2.5 h-2.5 rounded-full bg-cream/20" />
          </span>
          {lang}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-cream/60 hover:text-cream transition"
        >
          {copied ? Icon.check : Icon.copy}
          {copied ? "tersalin" : "salin"}
        </button>
      </div>
      <pre>
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="md text-[15px] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: false }]]}
        components={{
          pre: ({ node, children }: any) => <>{children}</>,
          code: ({ node, className, children, ...rest }: any) => {
            const cls = className || "";
            const isBlock = /language-/.test(cls) || String(children).includes("\n");
            if (isBlock) return <CodeBlock className={cls}>{children}</CodeBlock>;
            return (
              <code className={cls} {...rest}>
                {children}
              </code>
            );
          },
          a: ({ node, ...props }: any) => <a target="_blank" rel="noreferrer" {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
