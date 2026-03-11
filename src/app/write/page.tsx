"use client";

import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { parseGraphFromFiles, KnowledgeGraph } from "@/lib/knowledge-graph";
import { buildWritingSystemPrompt } from "@/lib/chat-prompts";
import { useChat } from "@/hooks/use-chat";
import { useSettings } from "@/hooks/use-settings";
import { HistoryCardSelect } from "@/components/history-card-select";
import { HistoryEntry } from "@/hooks/use-history";
import { ChatMessage } from "@/components/chat-message";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Trash2,
  Square,
  ArrowLeft,
  PanelRightClose,
  PanelRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || streaming) return;
    sendMessage(input.trim());
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  };

  // Card selection view
  if (!entry) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="h-14 flex items-center px-4 border-b font-medium shrink-0">
          创作模式 — 选择分析记录
        </div>
        <HistoryCardSelect selectedId={null} onSelect={setEntry} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setEntry(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">创作模式</span>
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
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
                <Trash2 className="h-4 w-4 mr-1" />
                清空
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowPanel(!showPanel)}
            >
              {showPanel ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground text-sm space-y-3 max-w-md">
                <p>基于小说的世界观和角色设定，与 AI 进行创作对话。</p>
                <div className="text-xs space-y-1">
                  <p>试试这些：</p>
                  <p className="text-foreground/60">「请续写第三章结尾的情节」</p>
                  <p className="text-foreground/60">「如果主角做了不同的选择，故事会如何发展？」</p>
                  <p className="text-foreground/60">「帮我写一段两个角色的对话场景」</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-w-3xl mx-auto">
              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  message={msg}
                  characterName={msg.role === "assistant" ? "创作助手" : undefined}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          {!isConfigured ? (
            <div className="text-center text-sm text-muted-foreground">
              请先在「API 设置」中配置 API
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="输入你的创作需求，如续写、改编、提问..."
                rows={1}
                className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {streaming ? (
                <Button size="icon" variant="outline" onClick={stopStreaming}>
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: graph summary */}
      {showPanel && graph && (
        <div className="w-[280px] shrink-0 border-l flex flex-col">
          <div className="h-14 flex items-center px-4 border-b text-sm font-medium">
            图谱概要
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 text-sm">
              {graph.characters.length > 0 && (
                <section>
                  <h3 className="font-medium mb-2">角色</h3>
                  <div className="space-y-1.5">
                    {graph.characters.map((c) => (
                      <div key={c.id} className="text-muted-foreground">
                        <span className="text-foreground font-medium">
                          {c.name}
                        </span>
                        {c.core_must?.[0] && (
                          <span className="text-xs ml-1">
                            — {c.core_must[0]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {graph.relations.length > 0 && (
                <section>
                  <h3 className="font-medium mb-2">关系</h3>
                  <div className="space-y-1 text-muted-foreground text-xs">
                    {graph.relations.map((r) => (
                      <div key={r.id}>
                        {r.pair?.join(" ↔ ")}：{r.baseline}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {graph.worldRules && (
                <section>
                  <h3 className="font-medium mb-2">世界观</h3>
                  <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {graph.worldRules.slice(0, 1000)}
                  </div>
                </section>
              )}

              {graph.timeline && (
                <section>
                  <h3 className="font-medium mb-2">时间线</h3>
                  <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {graph.timeline.slice(0, 1000)}
                  </div>
                </section>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
