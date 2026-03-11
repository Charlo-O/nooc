"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { CopyButton } from "@/components/copy-button";

interface FileViewerProps {
  path: string;
  content: string;
}

export function FileViewer({ path, content }: FileViewerProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
        <span className="text-sm font-mono text-muted-foreground">{path}</span>
        <CopyButton text={content} />
      </div>
      <ScrollArea className="flex-1">
        <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words leading-relaxed">
          {content}
        </pre>
      </ScrollArea>
    </div>
  );
}
