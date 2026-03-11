"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowRight, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface TextUploadProps {
  onSubmit: (text: string) => void;
}

export function TextUpload({ onSubmit }: TextUploadProps) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
        alert("请上传 .txt 或 .md 文件");
        return;
      }

      setFileName(file.name);

      // Prefer UTF-8, then retry with GBK if the preview looks garbled.
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        const hasGarbled =
          content.includes("\uFFFD") || /[\xC0-\xFF]{4,}/.test(content.slice(0, 2000));

        if (hasGarbled) {
          const gbkReader = new FileReader();
          gbkReader.onload = (ev2) => {
            setText((ev2.target?.result as string) || "");
          };
          gbkReader.readAsText(file, "GBK");
          return;
        }

        setText(content);
      };

      reader.readAsText(file, "utf-8");
    },
    []
  );

  const openFilePicker = useCallback(() => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  }, []);

  const charCount = text.length;
  const wordEstimate = text.replace(/\s+/g, "").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          上传小说文本
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="paste">
          <TabsList>
            <TabsTrigger value="paste">粘贴文本</TabsTrigger>
            <TabsTrigger value="file">上传文件</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-2">
            <Textarea
              placeholder="在此粘贴小说文本..."
              className="min-h-[300px] font-mono text-sm"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setFileName(null);
              }}
            />
          </TabsContent>

          <TabsContent value="file" className="space-y-2">
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">支持 .txt 和 .md 文件</p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />

              <Button type="button" variant="outline" onClick={openFilePicker}>
                选择文件
              </Button>

              {fileName && (
                <p className="mt-2 text-sm text-muted-foreground">已加载: {fileName}</p>
              )}
            </div>

            {text && (
              <div className="mt-4">
                <p className="mb-1 text-sm font-medium">文本预览:</p>
                <div className="max-h-[200px] overflow-auto rounded border bg-muted/50 p-3 font-mono text-sm whitespace-pre-wrap">
                  {text.slice(0, 2000)}
                  {text.length > 2000 && "..."}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {text && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              字符数: {charCount.toLocaleString()} | 字数（估计）:{" "}
              {wordEstimate.toLocaleString()}
            </p>
            <Button onClick={() => onSubmit(text)} size="lg">
              开始分析
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
