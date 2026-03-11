"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSettings } from "./use-settings";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_PREFIX = "nooc-chat-";

function loadMessages(storageKey: string): ChatMessage[] {
  if (!storageKey) return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(storageKey: string, messages: ChatMessage[]) {
  if (!storageKey) return;
  try {
    if (messages.length === 0) {
      localStorage.removeItem(STORAGE_PREFIX + storageKey);
    } else {
      localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(messages));
    }
  } catch {}
}

/**
 * @param systemPrompt - The system prompt for the AI
 * @param storageKey - Unique key for persisting messages (e.g. "entryId-characterId")
 */
export function useChat(systemPrompt: string, storageKey: string = "") {
  const { settings } = useSettings();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const storageKeyRef = useRef(storageKey);

  // Load messages when storageKey changes
  useEffect(() => {
    storageKeyRef.current = storageKey;
    abortRef.current?.abort();
    setStreaming(false);
    setMessages(loadMessages(storageKey));
  }, [storageKey]);

  // Save messages whenever they change (skip empty assistant during streaming)
  useEffect(() => {
    if (streaming) return; // don't save mid-stream
    saveMessages(storageKeyRef.current, messages);
  }, [messages, streaming]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !settings.baseUrl || !settings.apiKey) return;

      const userMsg: ChatMessage = { role: "user", content };
      const history = [...messages, userMsg];
      setMessages([...history, { role: "assistant", content: "" }]);
      setStreaming(true);

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const apiMessages = [
          { role: "system" as const, content: systemPrompt },
          ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ];

        const baseUrl = settings.baseUrl.replace(/\/+$/, "");
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${settings.apiKey}`,
          },
          body: JSON.stringify({
            model: settings.modelName,
            messages: apiMessages,
            stream: true,
            temperature: 0.7,
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => res.statusText);
          throw new Error(`API 请求失败: ${res.status} ${errText}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("无法读取响应流");

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

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
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                accumulated += delta;
                const current = accumulated;
                setMessages([...history, { role: "assistant", content: current }]);
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const errorMsg = (err as Error).message ?? "发送失败";
        setMessages([...history, { role: "assistant", content: `⚠️ ${errorMsg}` }]);
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, settings, systemPrompt]
  );

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    saveMessages(storageKeyRef.current, []);
    setStreaming(false);
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, streaming, sendMessage, clearMessages, stopStreaming };
}
