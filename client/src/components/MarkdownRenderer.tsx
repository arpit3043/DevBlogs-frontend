import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github-dark.min.css";

declare global {
  interface Window {
    mermaid?: {
      run: (options?: { nodes?: Node[]; querySelector?: string }) => Promise<void>;
      init: (config?: object) => void;
    };
  }
}

function MermaidBlock({ code, onCopy }: { code: string; onCopy?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code?.trim() || !containerRef.current) return;
    setError(null);
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
    containerRef.current.innerHTML = "";
    const el = document.createElement("div");
    el.id = id;
    el.setAttribute("data-mermaid", code);
    containerRef.current.appendChild(el);

    const run = () => {
      if (window.mermaid) {
        window.mermaid
          .run({ querySelector: `#${id}` })
          .catch((err: Error) => setError(err.message || "Diagram failed to render"));
      } else {
        setError("Mermaid not loaded");
      }
    };
    if (typeof window !== "undefined" && window.mermaid) {
      run();
    } else {
      import("mermaid").then((m) => {
        window.mermaid = m.default;
        window.mermaid.init({ startOnLoad: false });
        run();
      }).catch(() => setError("Mermaid failed to load"));
    }
  }, [code]);

  return (
    <div className="my-6 rounded-lg border border-border bg-card/50 p-4 overflow-x-auto">
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          className="mb-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Copy diagram
        </button>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div ref={containerRef} className="min-h-[80px] flex items-center justify-center" />
    </div>
  );
}

type MarkdownRendererProps = {
  content: string;
  onCodeCopy?: () => void;
};

export function MarkdownRenderer({ content, onCodeCopy }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeHighlight]}
      components={{
        pre({ children }) {
          const child = Array.isArray(children) ? children[0] : children;
          const codeProps = typeof child === "object" && child !== null && "props" in child ? (child as React.ReactElement).props : null;
          const lang = codeProps?.className?.match(/language-(\w+)/)?.[1];
          const code = typeof codeProps?.children === "string" ? codeProps.children : String(codeProps?.children ?? "");
          if (lang === "mermaid" && code) {
            return <MermaidBlock code={code} onCopy={onCodeCopy} />;
          }
          const handleCopy = () => {
            if (code && navigator.clipboard) {
              navigator.clipboard.writeText(code);
              onCodeCopy?.();
            }
          };
          return (
            <div className="relative group my-4 rounded-lg border border-border bg-secondary/30 overflow-hidden">
              {code ? (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="absolute right-2 top-2 text-xs text-muted-foreground hover:text-foreground bg-background/80 px-2 py-1 rounded border border-border"
                >
                  Copy
                </button>
              ) : null}
              <pre className="p-4 overflow-x-auto pt-10">{children}</pre>
            </div>
          );
        },
      }}
      className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-code:bg-secondary/50 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none"
    >
      {content}
    </ReactMarkdown>
  );
}
