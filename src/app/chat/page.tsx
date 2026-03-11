"use client";

import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { parseGraphFromFiles, KnowledgeGraph } from "@/lib/knowledge-graph";
import { buildCharacterSystemPrompt } from "@/lib/chat-prompts";
import { useChat } from "@/hooks/use-chat";
import { useSettings } from "@/hooks/use-settings";
import { HistoryCardSelect } from "@/components/history-card-select";
import { HistoryEntry } from "@/hooks/use-history";
import { ChatMessage } from "@/components/chat-message";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Trash2, Square, ArrowLeft } from "lucide-react";
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

  const selectedChar = graph?.characters.find((c) => c.id === selectedCharId);

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

  // ---- Selection page: centered layout with title ----
  if (!entry) {
    return (
      <div className="px-6 py-6 mx-auto max-w-5xl w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold">角色聊天</h1>
          <p className="text-muted-foreground">选择一条分析记录，与小说中的角色进行对话</p>
        </div>
        <HistoryCardSelect selectedId={null} onSelect={setEntry} />
      </div>
    );
  }

  if (!graph?.characters.length) {
    return (
      <div className="px-6 py-6 mx-auto max-w-5xl w-full space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEntry(null); setSelectedCharId(null); }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">角色聊天</h1>
            <p className="text-muted-foreground">该分析结果中缺少角色信息</p>
          </div>
        </div>
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
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { setEntry(null); setSelectedCharId(null); }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              {selectedChar ? `与「${selectedChar.name}」对话` : "角色聊天"}
            </span>
            <span className="text-xs text-muted-foreground">{entry.title}</span>
          </div>
          {selectedCharId && messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearMessages} className="text-muted-foreground">
              <Trash2 className="h-4 w-4 mr-1" />
              清空
            </Button>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6">
            {!selectedCharId ? (
              <div className="py-20 text-center text-muted-foreground text-sm">
                从右侧选择一个角色开始对话
              </div>
            ) : messages.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground text-sm">
                开始与「{selectedChar?.name}」对话吧
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {messages.map((msg, i) => (
                  <ChatMessage
                    key={i}
                    message={msg}
                    characterName={selectedChar?.name}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        {selectedCharId && (
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
                  placeholder={`对「${selectedChar?.name}」说些什么...`}
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
        )}
      </div>

      {/* Right: Character selection panel */}
      <div className="w-[260px] shrink-0 flex flex-col bg-muted/20 overflow-hidden">
        <div className="h-14 flex items-center px-4 shrink-0">
          <span className="font-medium text-sm">选择角色</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-3 pb-3 space-y-2">
            {graph.characters.map((char) => {
              const isSelected = selectedCharId === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => handleSelectChar(char.id)}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-3 text-sm transition-all bg-background",
                    isSelected
                      ? "border-2 border-primary shadow-sm"
                      : "border border-border hover:border-foreground/30"
                  )}
                >
                  <div className={cn(
                    "font-medium",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {char.name}
                  </div>
                  {char.core_must?.[0] && (
                    <div className="text-xs mt-0.5 truncate text-muted-foreground">
                      {char.core_must[0]}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
