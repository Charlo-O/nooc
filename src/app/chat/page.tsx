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

  // Auto-scroll to bottom
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

  // Card selection view
  if (!entry) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="h-14 flex items-center px-4 border-b font-medium shrink-0">
          角色聊天 — 选择分析记录
        </div>
        <HistoryCardSelect selectedId={null} onSelect={setEntry} />
      </div>
    );
  }

  if (!graph?.characters.length) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="h-14 flex items-center px-4 border-b gap-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => { setEntry(null); setSelectedCharId(null); }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">角色聊天</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">未找到角色数据</p>
            <p className="text-sm">该分析结果中缺少角色信息</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Left: Character list */}
      <div className="w-[240px] shrink-0 border-r flex flex-col">
        <div className="h-14 flex items-center gap-2 px-3 border-b">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => { setEntry(null); setSelectedCharId(null); }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-sm truncate">选择角色</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {graph.characters.map((char) => (
              <button
                key={char.id}
                onClick={() => handleSelectChar(char.id)}
                className={cn(
                  "w-full text-left rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-accent",
                  selectedCharId === char.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <div className="font-medium text-foreground">{char.name}</div>
                {char.core_must?.[0] && (
                  <div className="text-xs mt-0.5 truncate opacity-70">
                    {char.core_must[0]}
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b">
          <div className="font-medium">
            {selectedChar ? `与「${selectedChar.name}」对话` : "请选择一个角色"}
          </div>
          {selectedCharId && messages.length > 0 && (
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
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {!selectedCharId ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              从左侧选择一个角色开始对话
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              开始与「{selectedChar?.name}」对话吧
            </div>
          ) : (
            <div className="space-y-3 max-w-3xl mx-auto">
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
        </ScrollArea>

        {/* Input */}
        {selectedCharId && (
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
                  placeholder={`对「${selectedChar?.name}」说些什么...`}
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
        )}
      </div>
    </div>
  );
}
