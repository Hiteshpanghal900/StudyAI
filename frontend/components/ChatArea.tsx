"use client";

import { useState } from "react";
import {
  Bot,
  CornerDownLeft,
  MessageCircle,
  Send,
  User,
} from "lucide-react";
import type {
  DocumentType,
  Message,
} from "@/app/page";
import { apiUrl } from "@/lib/api";

type Props = {
  selectedDocument: DocumentType | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
};

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
}

function MarkdownMessage({ content }: { content: string }) {
  const lines = content.trim().split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      blocks.push(
        <p key={index} className="font-semibold">
          {renderInlineMarkdown(line.replace(/^#{1,3}\s+/, ""))}
        </p>
      );
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }

      blocks.push(
        <ul key={index}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }

      blocks.push(
        <ol key={index}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^#{1,3}\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }

    blocks.push(
      <p key={index}>
        {renderInlineMarkdown(paragraph.join(" "))}
      </p>
    );
  }

  return <div className="markdown-answer">{blocks}</div>;
}

export default function ChatArea({
  selectedDocument,
  messages,
  setMessages,
}: Props) {
  const [input, setInput] = useState("");

  const [loading, setLoading] =
    useState(false);

  async function sendMessage() {
    if (!input.trim() || !selectedDocument || loading) return;

    const userMessage = {
      role: "user" as const,
      content: input,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    const currentInput = input;

    setInput("");

    setLoading(true);

    try {
      const response = await fetch(
        apiUrl("/chat"),
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question: currentInput,
            document_id: selectedDocument.id,
            chat_history: messages.slice(-10),
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || data?.error || "Failed to get an answer");
      }

      if (!data?.answer) {
        throw new Error("The server did not return an answer.");
      }

      const assistantMessage = {
        role: "assistant" as const,
        content: data.answer,
      };

      setMessages((prev) => [
        ...prev,
        assistantMessage,
      ]);
    } catch (error) {
      console.error(error);

      const assistantMessage = {
        role: "assistant" as const,
        content:
          error instanceof Error
            ? error.message
            : "Failed to get an answer",
      };

      setMessages((prev) => [
        ...prev,
        assistantMessage,
      ]);
    }

    setLoading(false);
  }

  return (
    <section className="flex h-full flex-col bg-zinc-950/80 backdrop-blur-xl surface-glow">
      <div className="flex h-14 items-center justify-between border-b border-cyan-900/30 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-300 to-cyan-300 text-zinc-950 brand-glow">
            <MessageCircle size={15} />
          </div>

          <div>
            <h2 className="text-sm font-medium text-zinc-200">
              Chat
            </h2>

            <p className="text-xs text-zinc-500">
              {selectedDocument
                ? selectedDocument.name
                : "Waiting for a document"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex max-w-[92%] gap-2 sm:max-w-[90%] sm:gap-3

            ${
              message.role === "user"
                ? "ml-auto flex-row-reverse"
                : ""
            }`}
          >
            <div
              className={`mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                message.role === "user"
                  ? "bg-gradient-to-br from-cyan-300 to-emerald-300 text-zinc-950"
                  : "border border-cyan-800/40 bg-zinc-900/80 text-cyan-200"
              }`}
            >
              {message.role === "user" ? (
                <User size={14} />
              ) : (
                <Bot size={14} />
              )}
            </div>

            <div
              className={`min-w-0 [overflow-wrap:anywhere] rounded-2xl px-3 py-2.5 text-sm leading-6 shadow-sm sm:px-4 sm:py-3 ${
                message.role === "user"
                  ? "bg-gradient-to-r from-cyan-300 to-emerald-300 text-zinc-950 shadow-lg shadow-cyan-950/20"
                  : "border border-cyan-800/30 bg-zinc-900/80 text-zinc-100"
              }`}
            >
              {message.role === "assistant" ? (
                <MarkdownMessage content={message.content} />
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}

        {!selectedDocument && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-xs text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-cyan-300 text-zinc-950 brand-glow">
                <MessageCircle size={22} />
              </div>

              <p className="text-sm font-medium text-zinc-300">
                Upload a PDF to start chatting
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Answers will be based only on the document you select.
              </p>
            </div>
          </div>
        )}

        {selectedDocument && messages.length === 0 && !loading && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-amber-300 text-zinc-950 brand-glow">
                <Bot size={22} />
              </div>

              <p className="text-sm font-medium text-zinc-300">
                Ask a question about this document
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Try asking for a summary, key points, definitions, or anything specific from the PDF.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex max-w-[90%] gap-3">
            <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-cyan-800/40 bg-zinc-900 text-cyan-200">
              <Bot size={14} />
            </div>

            <div className="rounded-2xl border border-cyan-800/40 bg-zinc-900/80 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-300 [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-amber-300" />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Input */}
      <div className="border-t border-cyan-900/30 bg-zinc-950/80 p-4">

        <div className="rounded-2xl border border-cyan-800/30 bg-zinc-900/80 p-3 transition focus-within:border-cyan-300/70 focus-within:shadow-lg focus-within:shadow-cyan-950/30">

          <textarea
            placeholder={
              selectedDocument
                ? "Ask a question about this document..."
                : "Upload a PDF first"
            }
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={!selectedDocument || loading}
            className="max-h-[120px] min-h-[44px] w-full resize-none bg-transparent px-1 text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed"
            rows={1}
          />

          <div className="mt-2 flex items-center justify-between">
            <div className="hidden items-center gap-1.5 text-xs text-zinc-600 sm:flex">
              <CornerDownLeft size={13} />
              Enter to send
            </div>

            <button
              onClick={sendMessage}
              disabled={!selectedDocument || loading}
              className="ml-auto flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-300 to-emerald-300 text-zinc-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
