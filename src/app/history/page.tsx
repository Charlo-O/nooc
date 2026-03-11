"use client";

import { useHistory } from "@/hooks/use-history";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Eye, History } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const { entries, loaded, deleteEntry, clearAll } = useHistory();

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">历史记录</h1>
        {entries.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAll}>
            清空全部
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <History className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">暂无历史记录</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{entry.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString("zh-CN")} · {Object.keys(entry.files).length} 个文件
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/results?history=${entry.id}`}>
                      <Eye className="mr-1 h-4 w-4" />
                      查看
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteEntry(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
