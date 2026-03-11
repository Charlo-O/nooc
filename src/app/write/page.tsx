"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  PanelRight,
  PanelRightClose,
  Trash2,
} from "lucide-react";
import { ChatComposer } from "@/components/chat-composer";
import { ChatMessage } from "@/components/chat-message";
import { HistoryCardSelect } from "@/components/history-card-select";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/use-chat";
import { HistoryEntry } from "@/hooks/use-history";
import { useSettings } from "@/hooks/use-settings";
import { buildWritingSystemPrompt } from "@/lib/chat-prompts";
import { parseGraphFromFiles, KnowledgeGraph } from "@/lib/knowledge-graph";

export default function WritePage() {
  return (
    <Suspense>
      <WritePageInner />
    </Suspense>
  );
}

function WritePageInner() {
  const { isConfigured } = useSettings();

  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [input, setInput] = useState("");
  const [showPanel, setShowPanel] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const graph: KnowledgeGraph | null = useMemo(
    () => (entry ? parseGraphFromFiles(entry.files) : null),
    [entry]
  );

  const systemPrompt = useMemo(
    () => (graph ? buildWritingSystemPrompt(graph) : ""),
    [graph]
  );

  const chatKey = entry ? `write-${entry.id}` : "";
  const { messages, streaming, sendMessage, clearMessages, stopStreaming } =
    useChat(systemPrompt, chatKey);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
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
          <h1 className="text-2xl font-bold">创作模式</h1>
          <p className="text-muted-foreground">
            选择一条分析记录，基于世界观和角色设定继续创作。
          </p>
        </div>
        <HistoryCardSelect selectedId={null} onSelect={setEntry} />
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
              onClick={() => setEntry(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">创作模式</span>
            <span className="max-w-[200px] truncate text-xs text-muted-foreground">
              {entry.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowPanel((prev) => !prev)}
            >
              {showPanel ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="soft-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6">
            {messages.length === 0 ? (
              <div className="py-20 text-center">
                <div className="mx-auto max-w-md space-y-3 text-sm text-muted-foreground">
                  <p>基于小说的世界观和角色设定，与 AI 继续创作对话。</p>
                  <div className="space-y-1 text-xs">
                    <p>可以直接试试这些：</p>
                    <p className="text-foreground/60">「请续写第三章结尾的情节。」</p>
                    <p className="text-foreground/60">
                      「如果主角做了不同的选择，故事会如何发展？」
                    </p>
                    <p className="text-foreground/60">
                      「帮我写一段两个人物之间的对话场景。」
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={index}
                    message={message}
                    characterName={message.role === "assistant" ? "创作助手" : undefined}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

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
              placeholder="输入你的创作需求，例如续写、改写、扩写或提问..."
              streaming={streaming}
              onSend={handleSend}
              onStop={stopStreaming}
            />
          )}
        </div>
      </div>

      {showPanel && graph && (
        <div className="flex min-h-0 w-[280px] shrink-0 flex-col overflow-hidden bg-muted/20">
          <div className="flex h-14 shrink-0 items-center px-4 text-sm font-medium">
            图谱摘要
          </div>
          <div className="soft-scrollbar flex-1 space-y-2 overflow-y-auto px-3 pb-3">
            {graph.characters.length > 0 && (
              <div className="rounded-lg border bg-background">
                <button
                  onClick={() => toggleSection("characters")}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
                >
                  <span>角色 ({graph.characters.length})</span>
                  {expandedSections.characters ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {!expandedSections.characters && (
                  <div className="truncate px-3 pb-2.5 text-xs text-muted-foreground">
                    {graph.characters.map((char) => char.name).join("、")}
                  </div>
                )}
                {expandedSections.characters && (
                  <div className="space-y-1.5 border-t px-3 pb-3 pt-2">
                    {graph.characters.map((char) => (
                      <div key={char.id} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{char.name}</span>
                        {char.core_must?.[0] && (
                          <span className="ml-1">· {char.core_must[0]}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {graph.relations.length > 0 && (
              <div className="rounded-lg border bg-background">
                <button
                  onClick={() => toggleSection("relations")}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
                >
                  <span>关系 ({graph.relations.length})</span>
                  {expandedSections.relations ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {!expandedSections.relations && (
                  <div className="truncate px-3 pb-2.5 text-xs text-muted-foreground">
                    {graph.relations
                      .map((relation) => relation.pair?.join(" → "))
                      .filter(Boolean)
                      .join("、")}
                  </div>
                )}
                {expandedSections.relations && (
                  <div className="space-y-1 border-t px-3 pb-3 pt-2 text-xs text-muted-foreground">
                    {graph.relations.map((relation) => (
                      <div key={relation.id}>
                        {relation.pair?.join(" → ")}：{relation.baseline}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {graph.worldRules && (
              <div className="rounded-lg border bg-background">
                <button
                  onClick={() => toggleSection("worldRules")}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
                >
                  <span>世界观</span>
                  {expandedSections.worldRules ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {!expandedSections.worldRules && (
                  <div className="line-clamp-2 px-3 pb-2.5 text-xs text-muted-foreground">
                    {graph.worldRules.slice(0, 100)}...
                  </div>
                )}
                {expandedSections.worldRules && (
                  <div className="whitespace-pre-wrap border-t px-3 pb-3 pt-2 text-xs text-muted-foreground">
                    {graph.worldRules.slice(0, 1000)}
                  </div>
                )}
              </div>
            )}

            {graph.timeline && (
              <div className="rounded-lg border bg-background">
                <button
                  onClick={() => toggleSection("timeline")}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
                >
                  <span>时间线</span>
                  {expandedSections.timeline ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {!expandedSections.timeline && (
                  <div className="line-clamp-2 px-3 pb-2.5 text-xs text-muted-foreground">
                    {graph.timeline.slice(0, 100)}...
                  </div>
                )}
                {expandedSections.timeline && (
                  <div className="whitespace-pre-wrap border-t px-3 pb-3 pt-2 text-xs text-muted-foreground">
                    {graph.timeline.slice(0, 1000)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
