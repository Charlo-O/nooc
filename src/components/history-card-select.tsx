"use client";

import { useHistory, HistoryEntry } from "@/hooks/use-history";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";

interface HistoryCardSelectProps {
  selectedId: string | null;
  onSelect: (entry: HistoryEntry) => void;
}

export function HistoryCardSelect({
  selectedId,
  onSelect,
}: HistoryCardSelectProps) {
  const { entries, loaded } = useHistory();

  if (!loaded) return null;

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <BookOpen className="h-8 w-8 mx-auto opacity-50" />
          <p className="text-sm">暂无分析记录</p>
          <p className="text-xs">请先在首页上传文本并完成分析</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 grid gap-3 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
        {entries.map((entry) => (
          <button
            key={entry.id}
            onClick={() => onSelect(entry)}
            className={cn(
              "text-left rounded-lg border p-4 transition-all hover:shadow-md",
              selectedId === entry.id
                ? "ring-2 ring-primary border-primary/50 shadow-md"
                : "hover:border-foreground/20"
            )}
          >
            <div className="font-medium text-sm truncate">{entry.title}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(entry.timestamp).toLocaleString("zh-CN")}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {Object.keys(entry.files).length} 个文件
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
