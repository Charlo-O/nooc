"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StepState } from "@/hooks/use-process";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

const statusConfig = {
  pending: { label: "等待中", variant: "secondary" as const, icon: Clock },
  running: { label: "处理中", variant: "default" as const, icon: Loader2 },
  done: { label: "已完成", variant: "secondary" as const, icon: CheckCircle2 },
  error: { label: "出错", variant: "destructive" as const, icon: XCircle },
};

function formatDuration(start?: number, end?: number): string {
  if (!start) return "";
  const elapsed = (end || Date.now()) - start;
  const seconds = Math.floor(elapsed / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function StepCard({ step }: { step: StepState }) {
  const config = statusConfig[step.status];
  const Icon = config.icon;

  return (
    <Card className={step.status === "running" ? "ring-2 ring-primary/50" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-sm">
              #{step.id + 1}
            </span>
            {step.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {step.startTime && (
              <span className="text-xs text-muted-foreground">
                {formatDuration(step.startTime, step.endTime)}
              </span>
            )}
            <Badge variant={config.variant} className="gap-1">
              <Icon className={`h-3 w-3 ${step.status === "running" ? "animate-spin" : ""}`} />
              {config.label}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{step.description}</p>
      </CardHeader>
      {step.output && (
        <CardContent>
          <ScrollArea className="h-[200px] w-full rounded border bg-muted/30 p-3">
            <pre className="text-xs font-mono whitespace-pre-wrap break-words">
              {step.output}
            </pre>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}
