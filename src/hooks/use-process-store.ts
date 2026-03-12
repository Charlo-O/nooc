"use client";

import { useSyncExternalStore, useCallback, useRef } from "react";
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

function makeInitialSteps(): StepState[] {
  return STEP_DEFINITIONS.map((def, i) => ({
    id: i,
    name: def.name,
    description: def.description,
    status: "pending",
    output: "",
  }));
}

// ---- Global singleton state ----
let globalSteps: StepState[] = makeInitialSteps();
let globalIsRunning = false;
let globalResult: ProcessResult | null = null;
let globalAbort: AbortController | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function getSnapshot() {
  return { steps: globalSteps, isRunning: globalIsRunning, result: globalResult };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function updateStep(id: number, update: Partial<StepState>) {
  globalSteps = globalSteps.map((s) => (s.id === id ? { ...s, ...update } : s));
  emit();
}

async function startProcess(
  text: string,
  settings: ProcessSettings
) {
  globalSteps = makeInitialSteps();
  globalIsRunning = true;
  globalResult = null;
  emit();

  const abort = new AbortController();
  globalAbort = abort;

  try {
    for await (const event of runProcess(text, settings, abort.signal)) {
      if (event.type === "step_start") {
        updateStep(event.step!, { status: "running", startTime: Date.now() });
      } else if (event.type === "step_chunk") {
        globalSteps = globalSteps.map((s) =>
          s.id === event.step ? { ...s, output: s.output + event.content } : s
        );
        emit();
      } else if (event.type === "step_done") {
        updateStep(event.step!, { status: "done", endTime: Date.now() });
      } else if (event.type === "step_error") {
        updateStep(event.step!, { status: "error", output: event.error!, endTime: Date.now() });
      } else if (event.type === "result") {
        globalResult = { files: event.files! };
        emit();
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name !== "AbortError") {
      const first = globalSteps.find((s) => s.status === "running" || s.status === "pending");
      if (first) {
        updateStep(first.id, {
          status: "error",
          output: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  } finally {
    globalIsRunning = false;
    globalAbort = null;
    emit();
  }
}

function cancelProcess() {
  globalAbort?.abort();
  globalIsRunning = false;
  emit();
}

function resetProcess() {
  globalIsRunning = false;
  globalResult = null;
  globalSteps = makeInitialSteps();
  emit();
}

// ---- React hook ----
export function useProcessStore() {
  const snapshotRef = useRef(getSnapshot());

  const snap = useSyncExternalStore(
    subscribe,
    () => {
      const current = getSnapshot();
      if (
        current.steps !== snapshotRef.current.steps ||
        current.isRunning !== snapshotRef.current.isRunning ||
        current.result !== snapshotRef.current.result
      ) {
        snapshotRef.current = current;
      }
      return snapshotRef.current;
    },
    () => snapshotRef.current
  );

  return {
    steps: snap.steps,
    isRunning: snap.isRunning,
    result: snap.result,
    startProcess: useCallback(startProcess, []),
    cancelProcess: useCallback(cancelProcess, []),
    resetProcess: useCallback(resetProcess, []),
  };
}
