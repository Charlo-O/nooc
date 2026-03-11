"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/hooks/use-chat";

interface ChatMessageProps {
  message: ChatMessageType;
  characterName?: string;
}

export function ChatMessage({ message, characterName }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2.5",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {!isUser && characterName && (
          <div className="text-xs font-medium text-muted-foreground mb-1">
            {characterName}
          </div>
        )}
        <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
          {message.content}
          {!isUser && !message.content && (
            <span className="inline-block w-1.5 h-4 bg-foreground/40 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
