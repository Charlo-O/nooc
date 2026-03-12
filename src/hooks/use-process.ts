"use client";

import { useState, useCallback, useRef } from "react";
import { runProcess, type ProcessSettings } from "@/lib/process-runner";

export type StepStatus = "pending" | "running" | "done" | "error";

export interface StepState {
  id: number;
  name: string;
  description: string;
  status: StepStatus;
  output: string;
  startTime?: number;
  endTime?: number;
}

export interface ProcessResult {
  files: Record<string, string>;
}

const STEP_DEFINITIONS = [
  { name: "Scene 切分", description: "将原文按时间/地点/视角变化切分为独立场景" },
  { name: "Scene 卡片", description: "为每个场景生成结构化卡片（事实、推断、关系变化等）" },
  { name: "全局汇总", description: "从场景卡片汇总角色、关系、事件、时间线等最终文件" },
  { name: "一致性检查", description: "检查所有文件的一致性并输出报告" },
];

export function useProcess() {
  const [steps, setSteps] = useState<StepState[]>(
    STEP_DEFINITIONS.map((def, i) => ({
      id: i,
      name: def.name,
      description: def.description,
      status: "pending",
      output: "",
    }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const updateStep = useCallback((id: number, update: Partial<StepState>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...update } : s))
    );
  }, []);

  const startProcess = useCallback(
    async (
      text: string,
      settings: ProcessSettings
    ) => {
      setIsRunning(true);
      setResult(null);
      setSteps(
        STEP_DEFINITIONS.map((def, i) => ({
          id: i,
          name: def.name,
          description: def.description,
          status: "pending",
          output: "",
        }))
      );

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        for await (const event of runProcess(text, settings, abort.signal)) {
          if (event.type === "step_start") {
            updateStep(event.step!, {
              status: "running",
              startTime: Date.now(),
            });
          } else if (event.type === "step_chunk") {
            setSteps((prev) =>
              prev.map((s) =>
                s.id === event.step
                  ? { ...s, output: s.output + event.content }
                  : s
              )
            );
          } else if (event.type === "step_done") {
            updateStep(event.step!, {
              status: "done",
              endTime: Date.now(),
            });
          } else if (event.type === "step_error") {
            updateStep(event.step!, {
              status: "error",
              output: event.error!,
              endTime: Date.now(),
            });
          } else if (event.type === "result") {
            setResult({ files: event.files! });
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setSteps((prev) => {
            const first = prev.find(
              (s) => s.status === "running" || s.status === "pending"
            );
            if (first) {
              return prev.map((s) =>
                s.id === first.id
                  ? { ...s, status: "error" as const, output: err instanceof Error ? err.message : "Unknown error" }
                  : s
              );
            }
            return prev;
          });
        }
      } finally {
        setIsRunning(false);
        abortRef.current = null;
      }
    },
    [updateStep]
  );

  const cancelProcess = useCallback(() => {
    abortRef.current?.abort();
    setIsRunning(false);
  }, []);

  const resetProcess = useCallback(() => {
    setIsRunning(false);
    setResult(null);
    setSteps(
      STEP_DEFINITIONS.map((def, i) => ({
        id: i,
        name: def.name,
        description: def.description,
        status: "pending",
        output: "",
      }))
    );
  }, []);

  return { steps, isRunning, result, startProcess, cancelProcess, resetProcess };
}
