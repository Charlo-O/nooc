"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Trash2, ArrowLeft } from "lucide-react";
import { ChatComposer } from "@/components/chat-composer";
import { ChatMessage } from "@/components/chat-message";
import { HistoryCardSelect } from "@/components/history-card-select";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/use-chat";
import { HistoryEntry } from "@/hooks/use-history";
import { useSettings } from "@/hooks/use-settings";
import { buildCharacterSystemPrompt } from "@/lib/chat-prompts";
import { parseGraphFromFiles, KnowledgeGraph } from "@/lib/knowledge-graph";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const { isConfigured } = useSettings();

  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const graph: KnowledgeGraph | null = useMemo(
    () => (entry ? parseGraphFromFiles(entry.files) : null),
    [entry]
  );

  const systemPrompt = useMemo(() => {
    if (!graph || !selectedCharId) return "";
    return buildCharacterSystemPrompt(graph, selectedCharId);
  }, [graph, selectedCharId]);

  const chatKey = entry && selectedCharId ? `${entry.id}-${selectedCharId}` : "";
  const { messages, streaming, sendMessage, clearMessages, stopStreaming } =
    useChat(systemPrompt, chatKey);

  const selectedChar = graph?.characters.find((char) => char.id === selectedCharId);
  const pageTitle = selectedChar ? `与「${selectedChar.name}」对话` : "角色聊天";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectChar = (id: string) => {
    setSelectedCharId(id);
  };

  const handleSend = () => {
    if (!input.trim() || streaming) return;
    sendMessage(input.trim());
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  };

  if (!entry) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-6">
        <div>
          <h1 className="text-2xl font-bold">角色聊天</h1>
          <p className="text-muted-foreground">
            选择一条分析记录，与小说中的角色继续对话。
          </p>
        </div>
        <HistoryCardSelect selectedId={null} onSelect={setEntry} />
      </div>
    );
  }

  if (!graph?.characters.length) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setEntry(null);
              setSelectedCharId(null);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">角色聊天</h1>
            <p className="text-muted-foreground">这条分析结果里还没有可聊天的角色。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => {
                setEntry(null);
                setSelectedCharId(null);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="truncate font-medium">{pageTitle}</span>
            <span className="truncate text-xs text-muted-foreground">{entry.title}</span>
          </div>

          {selectedCharId && messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="text-muted-foreground"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              清空
            </Button>
          )}
        </div>

        <div className="soft-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6">
            {!selectedCharId ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                从右侧选择一个角色开始对话。
              </div>
            ) : messages.length === 0 ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                开始与「{selectedChar?.name}」对话吧。
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={index}
                    message={message}
                    characterName={selectedChar?.name}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {selectedCharId && (
          <div className="shrink-0 px-6 pb-6 pt-2">
            {!isConfigured ? (
              <div className="text-center text-sm text-muted-foreground">
                请先在 API 设置里完成配置。
              </div>
            ) : (
              <ChatComposer
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`对「${selectedChar?.name}」说些什么...`}
                streaming={streaming}
                onSend={handleSend}
                onStop={stopStreaming}
              />
            )}
          </div>
        )}
      </div>

      <div className="flex min-h-0 w-[260px] shrink-0 flex-col overflow-hidden bg-muted/20">
        <div className="flex h-14 shrink-0 items-center px-4">
          <span className="text-sm font-medium">选择角色</span>
        </div>
        <div className="soft-scrollbar flex-1 space-y-2 overflow-y-auto px-3 pb-3">
          {graph.characters.map((char) => {
            const isSelected = selectedCharId === char.id;

            return (
              <button
                key={char.id}
                onClick={() => handleSelectChar(char.id)}
                className={cn(
                  "w-full rounded-lg bg-background px-3 py-3 text-left text-sm transition-all",
                  isSelected
                    ? "border border-black"
                    : "border border-border hover:border-foreground/30"
                )}
              >
                <div
                  className={cn(
                    "font-medium",
                    isSelected ? "text-black" : "text-foreground"
                  )}
                >
                  {char.name}
                </div>
                {char.core_must?.[0] && (
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {char.core_must[0]}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
