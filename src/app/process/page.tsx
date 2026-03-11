"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pipeline } from "@/components/pipeline";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/use-settings";
import { useProcessStore } from "@/hooks/use-process-store";
import { AlertCircle, StopCircle, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useHistory } from "@/hooks/use-history";
import Link from "next/link";

const TEXT_STORAGE_KEY = "nooc-pending-text";
const RESULT_STORAGE_KEY = "nooc-result-files";

export default function ProcessPage() {
  const router = useRouter();
  const { settings, isConfigured, loaded } = useSettings();
  const { steps, isRunning, result, startProcess, cancelProcess, resetProcess } =
    useProcessStore();
  const { addEntry } = useHistory();
  const startedRef = useRef(false);
  const savedRef = useRef(false);
  const [noText, setNoText] = useState(false);

  useEffect(() => {
    if (!loaded || startedRef.current) return;
    if (!isConfigured) return;
    // If already running (came back to page), don't restart
    if (isRunning) {
      startedRef.current = true;
      return;
    }
    // If already has result, don't restart
    if (result) {
      startedRef.current = true;
      return;
    }

    const text = sessionStorage.getItem(TEXT_STORAGE_KEY);
    if (!text) {
      setNoText(true);
      return;
    }

    startedRef.current = true;
    startProcess(text, settings);
  }, [loaded, isConfigured, settings, startProcess, isRunning, result]);

  // When done, save result and add to history
  useEffect(() => {
    if (result && !savedRef.current) {
      savedRef.current = true;
      sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result.files));
      const text = sessionStorage.getItem(TEXT_STORAGE_KEY) || "";
      addEntry(text, result.files);
    }
  }, [result, addEntry]);

  if (!loaded) return null;

  if (!isConfigured) {
    return (
      <div className="space-y-6 px-6 py-6 mx-auto max-w-5xl w-full">
        <h1 className="text-2xl font-bold">处理流水线</h1>
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <p className="text-sm">请先配置 API 设置</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">前往设置</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (noText && !isRunning && !result) {
    return (
      <div className="space-y-6 px-6 py-6 mx-auto max-w-5xl w-full">
        <h1 className="text-2xl font-bold">处理流水线</h1>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm">没有待处理的文本，请先上传</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">上传文本</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 py-6 mx-auto max-w-5xl w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">处理流水线</h1>
        <div className="flex gap-2">
          {isRunning && (
            <Button variant="destructive" size="sm" onClick={cancelProcess}>
              <StopCircle className="mr-1 h-4 w-4" />
              停止
            </Button>
          )}
          {!isRunning && result && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  startedRef.current = false;
                  savedRef.current = false;
                  resetProcess();
                  router.push("/");
                }}
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                重新开始
              </Button>
              <Button size="sm" onClick={() => router.push("/results")}>
                查看结果
              </Button>
            </>
          )}
        </div>
      </div>
      <Pipeline steps={steps} />
    </div>
  );
}
