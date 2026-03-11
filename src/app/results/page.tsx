"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, FolderTree, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DownloadButton } from "@/components/download-button";
import { FilePreviewList } from "@/components/file-preview-list";
import { FileTree } from "@/components/file-tree";
import { FileViewer } from "@/components/file-viewer";
import { HistoryCardSelect } from "@/components/history-card-select";
import { HistoryEntry, useHistory } from "@/hooks/use-history";

function ResultsContent() {
  const searchParams = useSearchParams();
  const { loaded, getEntry } = useHistory();
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [view, setView] = useState<"tree" | "preview">("tree");
  const initializedRef = useRef(false);
  const historyId = searchParams.get("history");

  useEffect(() => {
    if (initializedRef.current || entry || !loaded) return;
    initializedRef.current = true;

    if (!historyId) return;

    const initialEntry = getEntry(historyId);
    if (!initialEntry) return;

    setEntry(initialEntry);
    const paths = Object.keys(initialEntry.files);
    setSelectedFile(paths[0] ?? null);
  }, [entry, getEntry, historyId, loaded]);

  if (!entry) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-6">
        <div>
          <h1 className="text-2xl font-bold">分析结果</h1>
          <p className="text-muted-foreground">
            选择一条分析记录，查看生成的结构化文件。
          </p>
        </div>
        <HistoryCardSelect
          selectedId={null}
          onSelect={(nextEntry) => {
            setEntry(nextEntry);
            const paths = Object.keys(nextEntry.files);
            setSelectedFile(paths[0] ?? null);
          }}
        />
      </div>
    );
  }

  const files = entry.files;
  const fileCount = Object.keys(files).length;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden p-6">
      <div className="mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              setEntry(null);
              setSelectedFile(null);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">分析结果</h1>
            <p className="truncate text-sm text-muted-foreground">
              {entry.title} · 共 {fileCount} 个文件
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex rounded-md border">
            <Button
              variant={view === "tree" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setView("tree")}
            >
              <FolderTree className="mr-1 h-4 w-4" />
              树形
            </Button>
            <Button
              variant={view === "preview" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setView("preview")}
            >
              <List className="mr-1 h-4 w-4" />
              预览
            </Button>
          </div>
          <DownloadButton files={files} />
        </div>
      </div>

      {view === "tree" ? (
        <div className="mx-auto mt-6 grid min-h-0 w-full max-w-6xl flex-1 grid-cols-[280px_minmax(0,1fr)] gap-4 overflow-hidden">
          <Card className="min-h-0 overflow-hidden">
            <CardContent className="h-full min-h-0 p-2">
              <ScrollArea className="h-full">
                <FileTree
                  files={files}
                  selectedFile={selectedFile}
                  onSelect={setSelectedFile}
                />
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="min-h-0 overflow-hidden">
            {selectedFile && files[selectedFile] ? (
              <FileViewer path={selectedFile} content={files[selectedFile]} />
            ) : (
              <CardContent className="flex h-full items-center justify-center text-muted-foreground">
                从左侧选择一个文件查看内容。
              </CardContent>
            )}
          </Card>
        </div>
      ) : (
        <div className="soft-scrollbar mx-auto mt-6 min-h-0 w-full max-w-6xl flex-1 overflow-y-auto pr-1">
          <FilePreviewList files={files} />
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense>
      <ResultsContent />
    </Suspense>
  );
}
