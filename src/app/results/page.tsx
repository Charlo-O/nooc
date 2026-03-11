"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { FileTree } from "@/components/file-tree";
import { FileViewer } from "@/components/file-viewer";
import { FilePreviewList } from "@/components/file-preview-list";
import { DownloadButton } from "@/components/download-button";
import { Button } from "@/components/ui/button";
import { List, FolderTree, ArrowLeft } from "lucide-react";
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

  // Card selection view
  if (!entry) {
    return (
      <div className="px-6 py-6 mx-auto max-w-5xl w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold">分析结果</h1>
          <p className="text-muted-foreground">选择一条分析记录，查看生成的结构化文件</p>
        </div>
        <HistoryCardSelect selectedId={null} onSelect={(e) => {
          setEntry(e);
          const paths = Object.keys(e.files);
          if (paths.length > 0) setSelectedFile(paths[0]);
        }} />
      </div>
    );
  }

  const files = entry.files;
  const fileCount = Object.keys(files).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => { setEntry(null); setSelectedFile(null); }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">分析结果</h1>
            <p className="text-sm text-muted-foreground">
              {entry.title} · 共 {fileCount} 个文件
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-md">
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
        <div className="grid grid-cols-[260px_1fr] gap-4 min-h-[600px]">
          <Card className="overflow-hidden">
            <CardContent className="p-2">
              <FileTree
                files={files}
                selectedFile={selectedFile}
                onSelect={setSelectedFile}
              />
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            {selectedFile && files[selectedFile] ? (
              <FileViewer path={selectedFile} content={files[selectedFile]} />
            ) : (
              <CardContent className="flex items-center justify-center h-full text-muted-foreground">
                选择左侧文件查看内容
              </CardContent>
            )}
          </Card>
        </div>
      ) : (
        <FilePreviewList files={files} />
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
