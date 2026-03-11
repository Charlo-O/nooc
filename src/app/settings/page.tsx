import { SettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API 设置</h1>
        <p className="text-muted-foreground">
          配置用于分析的 AI API 端点信息
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
