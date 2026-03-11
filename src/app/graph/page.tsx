"use client";

import { Suspense, useMemo, useState } from "react";
import { parseGraphFromFiles, KnowledgeGraph } from "@/lib/knowledge-graph";
import { HistoryCardSelect } from "@/components/history-card-select";
import { HistoryEntry } from "@/hooks/use-history";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Simple deterministic color from string
function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

export default function GraphPage() {
  return (
    <Suspense>
      <GraphPageInner />
    </Suspense>
  );
}

function GraphPageInner() {
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  const graph: KnowledgeGraph | null = useMemo(
    () => (entry ? parseGraphFromFiles(entry.files) : null),
    [entry]
  );

  const selectedChar = graph?.characters.find((c) => c.id === selectedCharId);

  // Card selection view
  if (!entry) {
    return (
      <div className="px-6 py-6 mx-auto max-w-5xl w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold">知识图谱</h1>
          <p className="text-muted-foreground">选择一条分析记录，查看角色、关系、事件可视化</p>
        </div>
        <HistoryCardSelect selectedId={null} onSelect={setEntry} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-1 overflow-hidden">
      {/* Main graph area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="h-14 flex items-center gap-3 px-6 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => { setEntry(null); setSelectedCharId(null); }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">知识图谱</span>
          <span className="text-xs text-muted-foreground">
            {graph?.characters.length ?? 0} 角色 · {graph?.relations.length ?? 0} 关系 ·{" "}
            {graph?.events.length ?? 0} 事件
          </span>
          <span className="text-xs text-muted-foreground ml-auto truncate max-w-[200px]">
            {entry.title}
          </span>
        </div>

        <ScrollArea className="min-h-0 flex-1 p-6">
          {/* Character cards grid */}
          {(graph?.characters.length ?? 0) > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-medium text-muted-foreground mb-4">
                角色节点
              </h2>
              <div className="flex flex-wrap gap-3">
                {graph!.characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() =>
                      setSelectedCharId(
                        selectedCharId === char.id ? null : char.id
                      )
                    }
                    className={cn(
                      "relative rounded-lg border p-4 text-left transition-all hover:shadow-md w-[200px]",
                      selectedCharId === char.id
                        ? "ring-2 ring-primary shadow-md"
                        : "hover:border-foreground/20"
                    )}
                  >
                    <div
                      className="absolute top-0 left-0 w-full h-1 rounded-t-lg"
                      style={{ backgroundColor: hashColor(char.name) }}
                    />
                    <div className="font-medium mt-1">{char.name}</div>
                    {char.core_must?.[0] && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {char.core_must[0]}
                      </div>
                    )}
                    {char.speech_style && (
                      <div className="text-xs text-muted-foreground/70 mt-1 truncate">
                        语风：{char.speech_style}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* No characters hint */}
          {graph && graph.characters.length === 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-medium text-muted-foreground mb-4">
                角色节点
              </h2>
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                未解析到角色数据。请检查分析结果中是否包含 characters.yaml
              </div>
            </section>
          )}

          {/* Relations */}
          {(graph?.relations.length ?? 0) > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-medium text-muted-foreground mb-4">
                关系网络
              </h2>
              <div className="space-y-2">
                {graph!.relations.map((rel) => {
                  const highlighted =
                    selectedCharId &&
                    rel.pair?.some(
                      (p) =>
                        p === selectedChar?.name || p === selectedCharId
                    );
                  return (
                    <div
                      key={rel.id}
                      className={cn(
                        "flex items-center gap-3 rounded-md border px-4 py-2.5 text-sm transition-colors",
                        highlighted
                          ? "border-primary/50 bg-primary/5"
                          : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: hashColor(rel.pair?.[0] ?? ""),
                          }}
                        />
                        <span className="font-medium">{rel.pair?.[0]}</span>
                      </div>
                      <span className="text-muted-foreground">↔</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: hashColor(rel.pair?.[1] ?? ""),
                          }}
                        />
                        <span className="font-medium">{rel.pair?.[1]}</span>
                      </div>
                      <span className="text-muted-foreground text-xs ml-2 truncate">
                        {rel.baseline}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Events */}
          {(graph?.events.length ?? 0) > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-medium text-muted-foreground mb-4">
                事件时间线
              </h2>
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
                {graph!.events.map((evt) => {
                  const highlighted =
                    selectedCharId &&
                    evt.participants?.some(
                      (p) =>
                        p === selectedChar?.name || p === selectedCharId
                    );
                  return (
                    <div
                      key={evt.id}
                      className={cn(
                        "relative rounded-md border px-4 py-3 text-sm transition-colors",
                        highlighted
                          ? "border-primary/50 bg-primary/5"
                          : "border-border"
                      )}
                    >
                      <div className="absolute -left-[18px] top-4 w-2.5 h-2.5 rounded-full bg-border border-2 border-background" />
                      <div className="font-medium">{evt.title}</div>
                      {evt.chapter_range && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {evt.chapter_range}
                        </div>
                      )}
                      {evt.participants?.length ? (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {evt.participants.map((p) => (
                            <span
                              key={p}
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-muted"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {evt.after && (
                        <div className="text-xs text-muted-foreground mt-1">
                          结果：{evt.after}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* World rules summary */}
          {graph?.worldRules && (
            <section className="mb-8">
              <h2 className="text-sm font-medium text-muted-foreground mb-4">
                世界观
              </h2>
              <div className="rounded-md border p-4 text-sm whitespace-pre-wrap text-muted-foreground">
                {graph.worldRules.slice(0, 2000)}
              </div>
            </section>
          )}
        </ScrollArea>
      </div>

      {/* Right detail panel (shown when character selected) - soft separator */}
      {selectedChar && (
        <div className="flex min-h-0 w-[280px] shrink-0 flex-col bg-muted/30">
          <div className="h-14 flex items-center justify-between px-4">
            <span className="font-medium">{selectedChar.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSelectedCharId(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ScrollArea className="min-h-0 flex-1 p-4">
            <div className="space-y-4 text-sm">
              {selectedChar.core_must?.length ? (
                <section>
                  <h3 className="font-medium mb-1">核心特质</h3>
                  <ul className="list-disc list-inside text-muted-foreground text-xs space-y-0.5">
                    {selectedChar.core_must.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {selectedChar.core_must_not?.length ? (
                <section>
                  <h3 className="font-medium mb-1">绝不会做</h3>
                  <ul className="list-disc list-inside text-muted-foreground text-xs space-y-0.5">
                    {selectedChar.core_must_not.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {selectedChar.values_rank?.length ? (
                <section>
                  <h3 className="font-medium mb-1">价值观排序</h3>
                  <ol className="list-decimal list-inside text-muted-foreground text-xs space-y-0.5">
                    {selectedChar.values_rank.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ol>
                </section>
              ) : null}

              {selectedChar.speech_style && (
                <section>
                  <h3 className="font-medium mb-1">说话风格</h3>
                  <p className="text-muted-foreground text-xs">
                    {selectedChar.speech_style}
                  </p>
                </section>
              )}

              {selectedChar.arc_phases &&
                typeof selectedChar.arc_phases === "object" &&
                Object.keys(selectedChar.arc_phases).length > 0 && (
                <section>
                  <h3 className="font-medium mb-1">角色弧光</h3>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {Object.entries(selectedChar.arc_phases).map(
                      ([phase, desc]) => (
                        <div key={phase}>
                          <span className="font-medium text-foreground">
                            {phase}
                          </span>
                          ：{String(desc)}
                        </div>
                      )
                    )}
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
