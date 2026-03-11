"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, ArrowRight } from "lucide-react";

interface TextUploadProps {
  onSubmit: (text: string) => void;
}

export function TextUpload({ onSubmit }: TextUploadProps) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
        alert("请上传 .txt 或 .md 文件");
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setText(content);
      };
      reader.readAsText(file, "utf-8");
    },
    []
  );

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
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                支持 .txt 和 .md 文件
              </p>
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button variant="outline" asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  选择文件
                </label>
              </Button>
              {fileName && (
                <p className="mt-2 text-sm text-muted-foreground">
                  已加载: {fileName}
                </p>
              )}
            </div>
            {text && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-1">文本预览：</p>
                <div className="max-h-[200px] overflow-auto rounded border bg-muted/50 p-3 text-sm font-mono whitespace-pre-wrap">
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
              字符数: {charCount.toLocaleString()} | 字数（估计）: {wordEstimate.toLocaleString()}
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
