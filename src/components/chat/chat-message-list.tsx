"use client";

import type { UIMessage } from "ai";
import { useEffect, useRef, type ReactNode } from "react";
import Markdown from "react-markdown";
import { cn } from "@/lib/utils";
import { ToolStatusBadge, type ToolPartLike } from "./tool-status-badge";

export type ChatMessageListProps = {
  messages: UIMessage[];
  renderToolPart?: (part: ToolPartLike, messageId: string) => ReactNode;
  renderMessageFooter?: (message: UIMessage, index: number) => ReactNode;
  emptyState?: ReactNode;
  proactiveMessage?: string;
};

export function ChatMessageList({
  messages,
  renderToolPart,
  renderMessageFooter,
  emptyState,
  proactiveMessage,
}: ChatMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto" ref={listRef}>
      <div className="flex flex-col gap-3">
        {messages.length === 0 && proactiveMessage && (
          <div className="mr-4 rounded-lg bg-muted px-3 py-2">
            <div className="message-text text-sm">{proactiveMessage}</div>
          </div>
        )}

        {messages.length === 0 && !proactiveMessage && emptyState}

        {messages.map((message, msgIndex) => (
          <div
            key={message.id || `msg-${msgIndex}`}
            className={cn(
              "flex flex-col gap-2 rounded-lg px-3 py-2",
              message.role === "user" ? "ml-8 bg-primary/10" : "mr-4 bg-muted",
            )}
          >
            {message.parts.map((part, index) => {
              if (part.type === "text") {
                return (
                  <div key={`text-${index}`} className="message-text text-sm">
                    <Markdown>{part.text}</Markdown>
                  </div>
                );
              }

              if (part.type.startsWith("tool-")) {
                const toolPart = part as unknown as ToolPartLike;
                const key = toolPart.toolCallId || `tool-${index}`;

                if (renderToolPart) {
                  return <div key={key}>{renderToolPart(toolPart, message.id)}</div>;
                }

                return <ToolStatusBadge key={key} toolPart={toolPart} />;
              }

              return null;
            })}

            {message.role === "assistant" && renderMessageFooter?.(message, msgIndex)}
          </div>
        ))}
      </div>
    </div>
  );
}
