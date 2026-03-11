import { NextRequest } from "next/server";
import { createAiClient, streamChat } from "@/lib/ai-client";
import {
  SYSTEM_PROMPT,
  getSceneSplitPrompt,
  getSceneCardPrompt,
  getGlobalSummaryPrompt,
  getConsistencyCheckPrompt,
} from "@/lib/prompts";

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  const { text, settings } = await request.json();

  if (!text || !settings?.baseUrl || !settings?.apiKey || !settings?.modelName) {
    return new Response("Missing required fields", { status: 400 });
  }

  const client = createAiClient(settings);
  const model = settings.modelName;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(sseEvent(data)));
      };

      const files: Record<string, string> = {};
      files["raw/source.md"] = text;

      try {
        // Step 0: Scene splitting
        send({ type: "step_start", step: 0 });
        let sceneIndex = "";
        const prompt1 = getSceneSplitPrompt(text);
        for await (const chunk of streamChat(client, model, SYSTEM_PROMPT, prompt1)) {
          sceneIndex += chunk;
          send({ type: "step_chunk", step: 0, content: chunk });
        }
        files["scenes/index.yaml"] = sceneIndex;
        send({ type: "step_done", step: 0 });

        // Step 1: Scene cards
        send({ type: "step_start", step: 1 });
        let sceneCards = "";
        const prompt2 = getSceneCardPrompt(sceneIndex, text);
        for await (const chunk of streamChat(client, model, SYSTEM_PROMPT, prompt2)) {
          sceneCards += chunk;
          send({ type: "step_chunk", step: 1, content: chunk });
        }
        files["scene_cards/all_cards.yaml"] = sceneCards;
        send({ type: "step_done", step: 1 });

        // Step 2: Global summary
        send({ type: "step_start", step: 2 });
        let globalSummary = "";
        const prompt3 = getGlobalSummaryPrompt(sceneCards);
        for await (const chunk of streamChat(client, model, SYSTEM_PROMPT, prompt3)) {
          globalSummary += chunk;
          send({ type: "step_chunk", step: 2, content: chunk });
        }
        // Parse the global summary into separate files
        const fileSections = globalSummary.split(/===\s*(.+?)\s*===/);
        for (let i = 1; i < fileSections.length; i += 2) {
          const fileName = fileSections[i].trim();
          const content = (fileSections[i + 1] || "").trim();
          if (fileName && content) {
            files[fileName] = content;
          }
        }
        send({ type: "step_done", step: 2 });

        // Step 3: Consistency check
        send({ type: "step_start", step: 3 });
        const allFilesStr = Object.entries(files)
          .map(([path, content]) => `=== ${path} ===\n${content}`)
          .join("\n\n");
        let consistencyReport = "";
        const prompt4 = getConsistencyCheckPrompt(allFilesStr);
        for await (const chunk of streamChat(client, model, SYSTEM_PROMPT, prompt4)) {
          consistencyReport += chunk;
          send({ type: "step_chunk", step: 3, content: chunk });
        }
        files["consistency_report.md"] = consistencyReport;
        send({ type: "step_done", step: 3 });

        // Send final result
        send({ type: "result", files });
        send("[DONE]");
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        send({ type: "step_error", step: -1, error: errorMessage });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
