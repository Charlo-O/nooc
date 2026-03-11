"use client";

import { forwardRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  value: string;
  placeholder: string;
  streaming: boolean;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onStop: () => void;
  className?: string;
}

export const ChatComposer = forwardRef<HTMLTextAreaElement, ChatComposerProps>(
  (
    {
      value,
      placeholder,
      streaming,
      disabled = false,
      onChange,
      onKeyDown,
      onSend,
      onStop,
      className,
    },
    ref
  ) => {
    const canSend = value.trim().length > 0 && !disabled && !streaming;
    const sendButtonClass = canSend
      ? "h-10 w-10 rounded-full border-0 bg-black text-white shadow-none hover:bg-black/90"
      : "h-10 w-10 rounded-full border-0 bg-[#b4b4b4] text-white shadow-none hover:bg-[#b4b4b4] disabled:opacity-100 disabled:bg-[#b4b4b4] disabled:text-white";

    return (
      <div className={cn("max-w-3xl mx-auto", className)}>
        <div className="flex items-center gap-2.5 rounded-[32px] border border-black/10 bg-background px-3.5 py-1.5 shadow-sm transition-[border-color,box-shadow] focus-within:border-black/20 focus-within:shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
          <textarea
            ref={ref}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={1}
            className="min-h-9 max-h-[220px] flex-1 resize-none bg-transparent px-2 py-[6px] text-sm leading-6 placeholder:text-muted-foreground focus-visible:outline-none"
          />

          <div className="shrink-0">
            {streaming ? (
              <Button
                type="button"
                size="icon"
                onClick={onStop}
                className="h-10 w-10 rounded-full border-0 bg-[#b4b4b4] text-white shadow-none hover:bg-[#a3a3a3]"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                onClick={onSend}
                disabled={!canSend}
                className={sendButtonClass}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ChatComposer.displayName = "ChatComposer";
