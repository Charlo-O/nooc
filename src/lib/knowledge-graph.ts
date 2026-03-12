import yaml from "js-yaml";

/* ── Types ── */

export interface CharacterNode {
  id: string;
  name: string;
  core_must?: string[];
  core_must_not?: string[];
  values_rank?: string[];
  speech_style?: string;
  arc_phases?: Record<string, string>;
  evidence?: string[];
}

export interface RelationEdge {
  id: string;
  pair: string[];
  baseline?: string;
  history?: string[];
  hard_constraints?: string[];
  evidence?: string[];
}

export interface EventNode {
  id: string;
  title: string;
  chapter_range?: string;
  participants?: string[];
  before?: string;
  after?: string;
  causes?: string[];
  effects?: string[];
  evidence?: string[];
}

export interface KnowledgeGraph {
  characters: CharacterNode[];
  relations: RelationEdge[];
  events: EventNode[];
  worldRules: string;
  timeline: string;
}

/* ── Parsing ── */

/**
 * Aggressively clean AI-generated YAML content:
 * - Strip markdown code fences (```yaml ... ```)
 * - Strip leading prose/description before first YAML list item
 * - Handle multiple code blocks (pick the longest)
 */
function cleanYamlContent(text: string): string {
  // 1. Try extracting from code fences first
  const fenceMatch = text.match(/```(?:ya?ml)?\s*\n([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // 2. Strip any remaining code fence markers
  let cleaned = text
    .replace(/^```(?:ya?ml)?\s*\n?/gm, "")
    .replace(/\n?```\s*$/gm, "")
    .trim();

  // 3. If there's prose before the YAML list, strip it
  //    Find the first line starting with "- " (YAML list item)
  const listStart = cleaned.search(/^- /m);
  if (listStart > 0) {
    cleaned = cleaned.slice(listStart);
  }

  return cleaned;
}

function extractArray(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    // AI sometimes wraps in a top-level key like {characters: [...]}
    const values = Object.values(parsed as Record<string, unknown>);
    for (const v of values) {
      if (Array.isArray(v)) return v;
    }
  }
  return null;
}

function tryParseYaml<T>(content: string | undefined): T[] {
  if (!content) return [];

  const cleaned = cleanYamlContent(content);
  if (!cleaned) return [];

  // Strategy 1: parse as single document
  try {
    const parsed = yaml.load(cleaned);
    const arr = extractArray(parsed);
    if (arr && arr.length > 0) return arr as T[];
  } catch {}

  // Strategy 2: loadAll for multi-document YAML
  try {
    const docs = yaml.loadAll(cleaned);
    for (const doc of docs) {
      const arr = extractArray(doc);
      if (arr && arr.length > 0) return arr as T[];
    }
  } catch {}

  // Strategy 3: try parsing just from the first "- " to end
  try {
    const idx = cleaned.search(/^- /m);
    if (idx >= 0) {
      const subset = cleaned.slice(idx);
      const parsed = yaml.load(subset);
      const arr = extractArray(parsed);
      if (arr && arr.length > 0) return arr as T[];
    }
  } catch {}

  return [];
}

/** Ensure a value is an array of strings (handles YAML returning a bare string for single items). */
function ensureStringArray(val: unknown): string[] | undefined {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") return [val];
  return undefined;
}

/** Normalize a parsed character node so all expected array fields are real arrays. */
function normalizeCharacter(raw: CharacterNode): CharacterNode {
  return {
    ...raw,
    id: raw.id ?? raw.name ?? "",
    core_must: ensureStringArray(raw.core_must),
    core_must_not: ensureStringArray(raw.core_must_not),
    values_rank: ensureStringArray(raw.values_rank),
    evidence: ensureStringArray(raw.evidence),
  };
}

/** Normalize a parsed relation edge. */
function normalizeRelation(raw: RelationEdge): RelationEdge {
  return {
    ...raw,
    pair: ensureStringArray(raw.pair) ?? [],
    history: ensureStringArray(raw.history),
    hard_constraints: ensureStringArray(raw.hard_constraints),
    evidence: ensureStringArray(raw.evidence),
  };
}

/** Normalize a parsed event node. */
function normalizeEvent(raw: EventNode): EventNode {
  return {
    ...raw,
    participants: ensureStringArray(raw.participants),
    causes: ensureStringArray(raw.causes),
    effects: ensureStringArray(raw.effects),
    evidence: ensureStringArray(raw.evidence),
  };
}

export function parseGraphFromFiles(files: Record<string, string>): KnowledgeGraph {
  // Find YAML files by suffix matching (keys may have path prefixes)
  const find = (name: string) =>
    Object.entries(files).find(([k]) => k.endsWith(name))?.[1];

  return {
    characters: tryParseYaml<CharacterNode>(find("characters.yaml")).map(normalizeCharacter),
    relations: tryParseYaml<RelationEdge>(find("relations.yaml")).map(normalizeRelation),
    events: tryParseYaml<EventNode>(find("events.yaml")).map(normalizeEvent),
    worldRules: find("world_rules.md") ?? "",
    timeline: find("timeline.md") ?? "",
  };
}

/* ── Context helpers ── */

export function getCharacterContext(
  graph: KnowledgeGraph,
  characterId: string
): string {
  const char = graph.characters.find((c) => c.id === characterId);
  if (!char) return "";

  const lines: string[] = [`# 角色：${char.name}`];

  if (char.core_must?.length)
    lines.push(`\n## 核心特质（必须）\n${char.core_must.map((s) => `- ${s}`).join("\n")}`);
  if (char.core_must_not?.length)
    lines.push(`\n## 绝不会做\n${char.core_must_not.map((s) => `- ${s}`).join("\n")}`);
  if (char.values_rank?.length)
    lines.push(`\n## 价值观排序\n${char.values_rank.map((s, i) => `${i + 1}. ${s}`).join("\n")}`);
  if (char.speech_style)
    lines.push(`\n## 说话风格\n${char.speech_style}`);
  if (char.arc_phases) {
    lines.push(`\n## 角色弧光`);
    for (const [phase, desc] of Object.entries(char.arc_phases)) {
      lines.push(`- ${phase}：${desc}`);
    }
  }

  // Related relations
  const rels = graph.relations.filter((r) =>
    r.pair?.some((p) => p === char.name || p === char.id)
  );
  if (rels.length) {
    lines.push(`\n## 关键关系`);
    for (const r of rels) {
      const other = r.pair.find((p) => p !== char.name && p !== char.id) ?? "?";
      lines.push(`- 与${other}：${r.baseline ?? ""}`);
      if (r.hard_constraints?.length)
        lines.push(`  约束：${r.hard_constraints.join("；")}`);
    }
  }

  // Related events
  const evts = graph.events.filter((e) =>
    e.participants?.some((p) => p === char.name || p === char.id)
  );
  if (evts.length) {
    lines.push(`\n## 关键经历`);
    for (const e of evts) {
      lines.push(`- ${e.title}${e.chapter_range ? `（${e.chapter_range}）` : ""}`);
      if (e.after) lines.push(`  结果：${e.after}`);
    }
  }

  return lines.join("\n");
}

export function getWorldContext(graph: KnowledgeGraph): string {
  const sections: string[] = [];

  if (graph.worldRules) sections.push(`# 世界观\n${graph.worldRules}`);
  if (graph.timeline) sections.push(`# 时间线\n${graph.timeline}`);

  if (graph.characters.length) {
    sections.push(
      `# 角色列表\n${graph.characters
        .map((c) => `- ${c.name}：${c.core_must?.[0] ?? ""}`)
        .join("\n")}`
    );
  }

  if (graph.relations.length) {
    sections.push(
      `# 关系网络\n${graph.relations
        .map((r) => `- ${r.pair?.join(" ↔ ")}：${r.baseline ?? ""}`)
        .join("\n")}`
    );
  }

  return sections.join("\n\n");
}
