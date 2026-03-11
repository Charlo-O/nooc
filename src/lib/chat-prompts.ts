import { KnowledgeGraph, getCharacterContext, getWorldContext } from "./knowledge-graph";

export function buildCharacterSystemPrompt(
  graph: KnowledgeGraph,
  characterId: string
): string {
  const charCtx = getCharacterContext(graph, characterId);
  const char = graph.characters.find((c) => c.id === characterId);
  const worldCtx = graph.worldRules
    ? `\n\n# 世界观背景\n${graph.worldRules}`
    : "";

  return `你现在扮演小说中的角色「${char?.name ?? characterId}」与用户对话。

请严格遵循以下设定，保持角色一致性，不要 OOC（Out of Character）。

${charCtx}${worldCtx}

# 扮演要求
- 以第一人称回复，完全代入角色
- 语气、用词必须符合角色的说话风格
- 遵守角色的核心特质和价值观排序
- 绝不做出角色"绝不会做"的行为
- 回复自然流畅，像真实对话
- 可以引用角色的关键经历作为回忆
- 不要在回复中暴露你是 AI`;
}

export function buildWritingSystemPrompt(graph: KnowledgeGraph): string {
  const worldCtx = getWorldContext(graph);

  return `你是一位专业的小说创作助手。用户正在基于以下世界观和角色设定进行创作，请帮助续写或润色内容。

${worldCtx}

# 创作要求
- 保持所有角色的性格一致性，不要 OOC
- 遵循已有的世界观规则和设定
- 文风与原作保持一致
- 情节发展合理，符合角色动机
- 保持叙事连贯性
- 注意角色之间的关系动态`;
}
