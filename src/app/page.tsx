"use client";

import { useRouter } from "next/navigation";
import { TextUpload } from "@/components/text-upload";
import { useSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, AlertCircle } from "lucide-react";
import Link from "next/link";

const TEXT_STORAGE_KEY = "nooc-pending-text";

export default function HomePage() {
  const router = useRouter();
  const { isConfigured, loaded } = useSettings();

  const handleSubmit = (text: string) => {
    sessionStorage.setItem(TEXT_STORAGE_KEY, text);
    router.push("/process");
  };

  if (!loaded) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nooc - 小说结构化分析</h1>
        <p className="text-muted-foreground">
          上传长文本，自动生成结构化的角色、关系、事件、时间线文件
        </p>
      </div>

      {!isConfigured && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">尚未配置 API</p>
              <p className="text-sm text-muted-foreground">
                请先在设置页面配置 API 端点信息
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">
                <Settings className="mr-1 h-4 w-4" />
                前往设置
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <TextUpload onSubmit={handleSubmit} />

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
