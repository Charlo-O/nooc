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
import {
  Send,
  Trash2,
  Square,
  ArrowLeft,
  PanelRightClose,
  PanelRight,
  ChevronDown,
  ChevronRight,
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

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  // ---- Selection page: centered layout ----
  if (!entry) {
    return (
      <div className="px-6 py-6 mx-auto max-w-5xl w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold">创作模式</h1>
          <p className="text-muted-foreground">选择一条分析记录，基于世界观与角色设定进行创作</p>
        </div>
        <HistoryCardSelect selectedId={null} onSelect={setEntry} />
      </div>
    );
  }

  // ---- Chat layout: AI Studio style ----
  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setEntry(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">创作模式</span>
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{entry.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearMessages} className="text-muted-foreground">
                <Trash2 className="h-4 w-4 mr-1" />
                清空
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPanel(!showPanel)}>
              {showPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6">
            {messages.length === 0 ? (
              <div className="py-20 text-center">
                <div className="text-muted-foreground text-sm space-y-3 max-w-md mx-auto">
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
              <div className="divide-y divide-border/50">
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
          </div>
        </div>

        {/* Input area */}
        <div className="px-6 pb-6 pt-2 shrink-0">
          {!isConfigured ? (
            <div className="text-center text-sm text-muted-foreground">
              请先在「API 设置」中配置 API
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex gap-2 items-center">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="输入你的创作需求，如续写、改编、提问..."
                rows={1}
                className="flex-1 resize-none rounded-xl border bg-muted/30 px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px] max-h-[150px]"
              />
              {streaming ? (
                <Button size="icon" variant="outline" onClick={stopStreaming} className="h-[44px] w-[44px] shrink-0 rounded-xl">
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="icon" onClick={handleSend} disabled={!input.trim()} className="h-[44px] w-[44px] shrink-0 rounded-xl">
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: graph summary */}
      {showPanel && graph && (
        <div className="w-[280px] shrink-0 flex flex-col bg-muted/20 overflow-hidden">
          <div className="h-14 flex items-center px-4 text-sm font-medium shrink-0">
            图谱概要
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
            {graph.characters.length > 0 && (
              <div className="rounded-lg border bg-background">
                <button
                  onClick={() => toggleSection("characters")}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors rounded-lg"
                >
                  <span>角色 ({graph.characters.length})</span>
                  {expandedSections.characters ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>
                {!expandedSections.characters && (
                  <div className="px-3 pb-2.5 text-xs text-muted-foreground truncate">
                    {graph.characters.map((c) => c.name).join("、")}
                  </div>
                )}
                {expandedSections.characters && (
                  <div className="px-3 pb-3 space-y-1.5 border-t pt-2">
                    {graph.characters.map((c) => (
                      <div key={c.id} className="text-muted-foreground text-xs">
                        <span className="text-foreground font-medium">{c.name}</span>
                        {c.core_must?.[0] && <span className="ml-1">— {c.core_must[0]}</span>}
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
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors rounded-lg"
                >
                  <span>关系 ({graph.relations.length})</span>
                  {expandedSections.relations ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>
                {!expandedSections.relations && (
                  <div className="px-3 pb-2.5 text-xs text-muted-foreground truncate">
                    {graph.relations.map((r) => r.pair?.join("↔")).join("、")}
                  </div>
                )}
                {expandedSections.relations && (
                  <div className="px-3 pb-3 space-y-1 border-t pt-2 text-muted-foreground text-xs">
                    {graph.relations.map((r) => (
                      <div key={r.id}>{r.pair?.join(" ↔ ")}：{r.baseline}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {graph.worldRules && (
              <div className="rounded-lg border bg-background">
                <button
                  onClick={() => toggleSection("worldRules")}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors rounded-lg"
                >
                  <span>世界观</span>
                  {expandedSections.worldRules ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>
                {!expandedSections.worldRules && (
                  <div className="px-3 pb-2.5 text-xs text-muted-foreground line-clamp-2">{graph.worldRules.slice(0, 100)}...</div>
                )}
                {expandedSections.worldRules && (
                  <div className="px-3 pb-3 border-t pt-2 text-xs text-muted-foreground whitespace-pre-wrap">{graph.worldRules.slice(0, 1000)}</div>
                )}
              </div>
            )}

            {graph.timeline && (
              <div className="rounded-lg border bg-background">
                <button
                  onClick={() => toggleSection("timeline")}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors rounded-lg"
                >
                  <span>时间线</span>
                  {expandedSections.timeline ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>
                {!expandedSections.timeline && (
                  <div className="px-3 pb-2.5 text-xs text-muted-foreground line-clamp-2">{graph.timeline.slice(0, 100)}...</div>
                )}
                {expandedSections.timeline && (
                  <div className="px-3 pb-3 border-t pt-2 text-xs text-muted-foreground whitespace-pre-wrap">{graph.timeline.slice(0, 1000)}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
