"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/hooks/use-chat";

interface ChatMessageProps {
  message: ChatMessageType;
  characterName?: string;
}

export function ChatMessage({ message, characterName }: ChatMessageProps) {
  const isUser = message.role === "user";
  const roleLabel = isUser ? "你" : characterName ?? "助手";

  return (
    <div className={cn("flex py-4", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div className="text-xs font-medium text-muted-foreground">{roleLabel}</div>
        <div
          className={cn(
            "rounded-2xl border bg-card px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap shadow-sm",
            isUser ? "rounded-br-md" : "rounded-bl-md",
            !isUser && !message.content && "inline-flex min-w-10 items-center"
          )}
        >
          {message.content}
          {!isUser && !message.content && (
            <span className="inline-block h-4 w-1.5 animate-pulse bg-foreground/40" />
          )}
        </div>
      </div>
    </div>
  );
}
