export const SYSTEM_PROMPT = `你是一个专业的小说结构化分析助手。你的任务是按照严格的规则分析小说文本，生成结构化的 YAML 输出。
重要规则：
- 只基于原文明确写出的内容，不要脑补
- 明确区分"事实"和"推断"
- 所有判断需要能回链到原文位置
- 输出格式为 YAML`;

// Round 1: Scene splitting
export function getSceneSplitPrompt(text: string): string {
  return `下面是一篇长文。请不要总结人物设定，不要写同人，不要补完剧情。
你只做一件事：按"scene"切分。

切分规则：
1. 时间变化、地点变化、视角变化、行动链断开，都可以作为新 scene 的边界。
2. 每个 scene 生成一个 scene_id，格式为 chXX_scXX。
3. 输出格式为 YAML 列表。
4. 每个 scene 只包含：
   - scene_id
   - chapter
   - location
   - time
   - pov
   - characters（列表）
   - summary（100字内摘要）
   - key_turning_points（列表）
   - source_span
5. 不要做性格推断，不要脑补原文没有写的设定。

请直接输出 YAML，不要包裹在代码块中。

原文如下：
<<<原文开始>>>
${text}
<<<原文结束>>>`;
}

// Round 2: Scene cards
export function getSceneCardPrompt(sceneIndex: string, text: string): string {
  return `根据以下 scene 切分结果和原文，为每个 scene 生成 scene card。

要求：
1. 每个 scene card 用 YAML 格式输出，用 --- 分隔不同 scene card。
2. 字段必须包含：
   - scene_id
   - chapter
   - time
   - location
   - pov
   - present_characters
   - explicit_facts（只写原文明确出现的事实）
   - soft_inferences（可能的推断，标注为推断）
   - events（事件 ID + 简述）
   - relation_changes（关系变化，包含 before/after 数值）
   - knowledge_state（每个角色此时知道/不知道什么）
   - character_signals（角色行为信号，支持核心人设的证据）
   - quotes（有代表性的对白，含 speaker/target/mood/text）
   - evidence（source_span + note）
3. 明示事实和推断必须分开。
4. 所有判断尽量回链到 source_span。
5. 不要汇总成人物总设定。

请直接输出 YAML，不要包裹在代码块中。

Scene 切分结果：
${sceneIndex}

原文：
<<<原文开始>>>
${text}
<<<原文结束>>>`;
}

// Round 3: Global summary
export function getGlobalSummaryPrompt(sceneCards: string): string {
  return `现在不要回看原文，只根据已有的 scene cards 汇总全局文件。

请生成以下文件，每个文件用 "=== 文件名 ===" 分隔：

1. === world_rules.md ===
   世界观规则

2. === timeline.md ===
   时间线

3. === characters.yaml ===
   所有角色文件合并为一个 YAML 列表，每个角色包含：
   - id, name, core_must, core_must_not, values_rank, speech_style, arc_phases, evidence

4. === relations.yaml ===
   所有关系文件合并为一个 YAML 列表，每个关系包含：
   - id, pair, baseline, history, hard_constraints, evidence

5. === events.yaml ===
   所有事件文件合并为一个 YAML 列表，每个事件包含：
   - id, title, chapter_range, participants, before, after, causes, effects, evidence

6. === quotes.yaml ===
   有代表性的对白样本，按 speaker+target+mood 分组

7. === uncertain.md ===
   证据不足的判断

规则：
- characters 只保留稳定核心，不把短期状态写进 core。
- relations 要体现变化历史。
- events 要体现 before/after/cause/effect。
- quotes 只收录有代表性的对白样本。
- 对没有足够证据的判断，不要强行写进正式文件，放进 uncertain.md。

Scene Cards：
${sceneCards}`;
}

// Round 4: Consistency check
export function getConsistencyCheckPrompt(allFiles: string): string {
  return `请对前面生成的所有文件做一致性检查，输出 consistency_report.md。

检查项：
1. 同一人物是否有重复命名或别名未合并
2. 某些阶段性特征是否误写进 core_must/core_must_not
3. 时间线是否有前后冲突
4. 关系变化是否跳跃过大
5. 某些人物是否知道了他本不该知道的信息
6. 某些引文是否被错误归属给了别的角色
7. 哪些地方证据不足，应该回到 uncertain.md

请直接输出 markdown 格式的检查报告。

以下是所有已生成的文件：
${allFiles}`;
}
