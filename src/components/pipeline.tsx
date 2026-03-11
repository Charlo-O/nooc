"use client";

import { StepCard } from "@/components/step-card";
import { Progress } from "@/components/ui/progress";
import type { StepState } from "@/hooks/use-process";

interface PipelineProps {
  steps: StepState[];
}

export function Pipeline({ steps }: PipelineProps) {
  const doneCount = steps.filter((s) => s.status === "done").length;
  const progress = (doneCount / steps.length) * 100;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>
            总进度: {doneCount} / {steps.length} 步完成
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>
      <div className="space-y-3">
        {steps.map((step) => (
          <StepCard key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}
