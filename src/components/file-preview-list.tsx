"use client";

import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";

interface FilePreviewListProps {
  files: Record<string, string>;
}

export function FilePreviewList({ files }: FilePreviewListProps) {
  const paths = Object.keys(files).sort();

  return (
    <div className="space-y-4">
      {paths.map((path) => (
        <Card key={path} className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
            <span className="text-sm font-mono text-muted-foreground">{path}</span>
            <CopyButton text={files[path]} />
          </div>
          <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words leading-relaxed">
            {files[path]}
          </pre>
        </Card>
      ))}
    </div>
  );
}
