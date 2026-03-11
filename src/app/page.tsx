"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TextUpload } from "@/components/text-upload";
import { useSettings } from "@/hooks/use-settings";
import { findBuiltinHistoryEntry, useHistory } from "@/hooks/use-history";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const TEXT_STORAGE_KEY = "nooc-pending-text";

export default function HomePage() {
  const router = useRouter();
  const { isConfigured, loaded } = useSettings();
  const { entries, loaded: historyLoaded } = useHistory();
  const builtinSample = findBuiltinHistoryEntry(entries);

  const handleSubmit = (text: string) => {
    if (!isConfigured) {
      router.push("/settings");
      return;
    }
    sessionStorage.setItem(TEXT_STORAGE_KEY, text);
    router.push("/process");
  };

  if (!loaded) return null;

  return (
    <div className="space-y-6 px-6 py-6 mx-auto max-w-5xl w-full">
      <div>
        <h1 className="text-2xl font-bold">Nooc - 小说结构化分析</h1>
        <p className="text-muted-foreground">
          上传长文本，自动生成结构化的角色、关系、事件、时间线文件
        </p>
      </div>

      <TextUpload onSubmit={handleSubmit} />

      {historyLoaded && builtinSample && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h3 className="font-medium">内置示例：白夜</h3>
              <p className="text-sm text-muted-foreground">
                软件首次打开会自带一份《白夜》的分析历史，方便直接参考生成结果、文件结构和后续功能效果。
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/history">历史记录</Link>
              </Button>
              <Button asChild>
                <Link href={`/results?history=${builtinSample.id}`}>查看示例</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">处理流程说明</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li><strong>Scene 切分</strong> — 将原文按时间/地点/视角变化切分为独立场景</li>
            <li><strong>Scene 卡片</strong> — 为每个场景生成结构化分析卡片</li>
            <li><strong>全局汇总</strong> — 从场景卡片汇总角色、关系、事件等文件</li>
            <li><strong>一致性检查</strong> — 检查所有文件的一致性并输出报告</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
