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

    return (
      <div className={cn("max-w-3xl mx-auto", className)}>
        <div className="relative rounded-[28px] border border-black/10 bg-background shadow-sm transition-[border-color,box-shadow] focus-within:border-black/20 focus-within:shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <textarea
            ref={ref}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={1}
            className="min-h-[96px] max-h-[220px] w-full resize-none rounded-[28px] bg-transparent px-5 pb-14 pt-4 text-sm leading-6 placeholder:text-muted-foreground focus-visible:outline-none"
          />

          <div className="absolute bottom-3 right-3">
            {streaming ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={onStop}
                className="h-10 w-10 rounded-full border-black/10 bg-background shadow-none hover:bg-muted"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                onClick={onSend}
                disabled={!canSend}
                className="h-10 w-10 rounded-full border border-transparent bg-black text-white shadow-none hover:bg-black/90 disabled:bg-muted disabled:text-muted-foreground"
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
