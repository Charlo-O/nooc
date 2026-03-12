import {
  SYSTEM_PROMPT,
  getSceneSplitPrompt,
  getSceneCardPrompt,
  getGlobalSummaryPrompt,
  getConsistencyCheckPrompt,
} from "@/lib/prompts";

export interface ProcessSettings {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

export interface ProcessEvent {
  type: "step_start" | "step_chunk" | "step_done" | "step_error" | "result";
  step?: number;
  content?: string;
  error?: string;
  files?: Record<string, string>;
}

async function* streamChat(
  settings: ProcessSettings,
  systemPrompt: string,
  userMessage: string,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const baseUrl = settings.baseUrl.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      stream: true,
      temperature: 0.3,
    }),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`API error: ${res.status} ${errText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // skip malformed chunks
      }
    }
  }
}

export async function* runProcess(
  text: string,
  settings: ProcessSettings,
  signal?: AbortSignal
): AsyncGenerator<ProcessEvent> {
  const files: Record<string, string> = {};
  files["raw/source.md"] = text;

  // Step 0: Scene splitting
  yield { type: "step_start", step: 0 };
  let sceneIndex = "";
  const prompt1 = getSceneSplitPrompt(text);
  for await (const chunk of streamChat(settings, SYSTEM_PROMPT, prompt1, signal)) {
    sceneIndex += chunk;
    yield { type: "step_chunk", step: 0, content: chunk };
  }
  files["scenes/index.yaml"] = sceneIndex;
  yield { type: "step_done", step: 0 };

  // Step 1: Scene cards
  yield { type: "step_start", step: 1 };
  let sceneCards = "";
  const prompt2 = getSceneCardPrompt(sceneIndex, text);
  for await (const chunk of streamChat(settings, SYSTEM_PROMPT, prompt2, signal)) {
    sceneCards += chunk;
    yield { type: "step_chunk", step: 1, content: chunk };
  }
  files["scene_cards/all_cards.yaml"] = sceneCards;
  yield { type: "step_done", step: 1 };

  // Step 2: Global summary
  yield { type: "step_start", step: 2 };
  let globalSummary = "";
  const prompt3 = getGlobalSummaryPrompt(sceneCards);
  for await (const chunk of streamChat(settings, SYSTEM_PROMPT, prompt3, signal)) {
    globalSummary += chunk;
    yield { type: "step_chunk", step: 2, content: chunk };
  }
  const fileSections = globalSummary.split(/===\s*(.+?)\s*===/);
  for (let i = 1; i < fileSections.length; i += 2) {
    const fileName = fileSections[i].trim();
    const content = (fileSections[i + 1] || "").trim();
    if (fileName && content) {
      files[fileName] = content;
    }
  }
  yield { type: "step_done", step: 2 };

  // Step 3: Consistency check
  yield { type: "step_start", step: 3 };
  const allFilesStr = Object.entries(files)
    .map(([path, content]) => `=== ${path} ===\n${content}`)
    .join("\n\n");
  let consistencyReport = "";
  const prompt4 = getConsistencyCheckPrompt(allFilesStr);
  for await (const chunk of streamChat(settings, SYSTEM_PROMPT, prompt4, signal)) {
    consistencyReport += chunk;
    yield { type: "step_chunk", step: 3, content: chunk };
  }
  files["consistency_report.md"] = consistencyReport;
  yield { type: "step_done", step: 3 };

  // Final result
  yield { type: "result", files };
}
