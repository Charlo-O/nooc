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
    <div className="py-4">
      {/* Role label */}
      <div className="text-xs text-muted-foreground mb-2 font-medium">
        {isUser ? "You" : characterName ?? "Model"}
      </div>
      {/* Content */}
      <div className={cn(
        "text-sm leading-relaxed break-words whitespace-pre-wrap",
        !isUser && !message.content && "inline-flex"
      )}>
        {message.content}
        {!isUser && !message.content && (
          <span className="inline-block w-1.5 h-4 bg-foreground/40 animate-pulse" />
        )}
      </div>
    </div>
  );
}
