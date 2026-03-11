"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/hooks/use-settings";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function SettingsForm() {
  const { settings, setSettings, loaded } = useSettings();
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("");
  const [testing, setTesting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (loaded && !initialized) {
    setBaseUrl(settings.baseUrl);
    setApiKey(settings.apiKey);
    setModelName(settings.modelName);
    setInitialized(true);
  }

  const handleSave = () => {
    if (!baseUrl || !apiKey || !modelName) {
      toast.error("请填写所有字段");
      return;
    }
    setSettings({ baseUrl, apiKey, modelName });
    toast.success("设置已保存");
  };

  const handleTest = async () => {
    if (!baseUrl || !apiKey || !modelName) {
      toast.error("请先填写所有字段");
      return;
    }
    setTesting(true);
    try {
      const testRes = await fetch(baseUrl.replace(/\/+$/, "") + "/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 5,
        }),
      });
      if (testRes.ok) {
        toast.success("连接成功！API 配置正确。");
      } else {
        const err = await testRes.text();
        toast.error(`连接失败: ${testRes.status} - ${err.slice(0, 200)}`);
      }
    } catch (err) {
      toast.error(`连接失败: ${err instanceof Error ? err.message : "未知错误"}`);
    } finally {
      setTesting(false);
    }
  };

  if (!loaded) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>API 配置</CardTitle>
        <CardDescription>
          配置 OpenAI 兼容的 API 端点。支持任何兼容 OpenAI API 格式的服务。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">API Base URL</label>
          <Input
            placeholder="https://api.openai.com/v1"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            例如: https://api.openai.com/v1 或其他兼容端点
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">API Key</label>
          <Input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Model Name</label>
          <Input
            placeholder="gpt-4o"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave}>保存设置</Button>
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            测试连接
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
