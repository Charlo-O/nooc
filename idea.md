最稳的做法是：​**先把长文处理成一层“中间文件”**​，再从中间文件汇总成你前面说的 `characters / relations / events / quotes / timeline`。
不要让 AI 直接从原文一步到位生成最终设定库，长文里最容易出错的就是：

* 把“当前状态”误写成“永久人设”
* 把“某一章的关系”误写成“全书默认关系”
* 忘掉时间顺序和知情边界
* 把自己脑补的东西混进事实

所以正确流程是：

**原文 → scene 切分 → scene 卡片 → 全局汇总 → 一致性检查 → 最终文件**

---

# 一套最实用的处理流程

## 1. 先把原文切成 scene，而不是直接抽人物

你发一篇长文给 AI 后，第一步不是问“帮我整理人物设定”，而是先让它做 ​**scene 切分**​。

因为小说里的很多信息，只有放在“这一场戏”里才有意义：

* 这时候谁在场
* 谁知道什么
* 谁误会了什么
* 关系有没有变化
* 有没有关键台词
* 这场戏是不是转折点

### 这一步要产出的文件

先产出两个文件：

```text
raw/source.md
scenes/index.md
```

其中 `scenes/index.md` 类似这样：

```yaml
- scene_id: ch01_sc01
  chapter: 1
  location: 林家院子
  time: 傍晚
  pov: 林岐
  characters:
    - 林岐
    - 沈昭
  summary: 初次正面冲突，林岐对沈昭明显不信任
  key_turning_points:
    - 初次对立建立
  source_span: 第1章前半

- scene_id: ch01_sc02
  chapter: 1
  location: 书房
  time: 夜
  pov: 林岐
  characters:
    - 林岐
    - 小雨
  summary: 林岐对小雨表现出保护倾向
  key_turning_points:
    - 保护欲证据
  source_span: 第1章后半
```

这里的 `scene_id` 非常关键。
后面所有文件都靠它回链。

---

## 2. 每个 scene 生成一张“scene 卡片”

这一步是整个系统最关键的中间层。

目录可以这样：

```text
scene_cards/ch01_sc01.md
scene_cards/ch01_sc02.md
...
```

每张卡片只处理一场戏，格式固定。

### 推荐模板

```yaml
scene_id: ch01_sc01
chapter: 1
time: 傍晚
location: 林家院子
pov: 林岐

present_characters:
  - 林岐
  - 沈昭

explicit_facts:
  - 林岐第一次与沈昭正面交锋
  - 林岐对沈昭持明显戒备态度
  - 沈昭没有直接解释自己的来意

soft_inferences:
  - 林岐倾向于先观察而不是立刻摊牌
  - 沈昭在试探林岐底线

events:
  - ev_001 初次对立建立

relation_changes:
  - rel_lin_qi__shen_zhao:
      before:
        trust: 30
        hostility: 20
      after:
        trust: 15
        hostility: 48
      note: 初次交锋后敌意上升

knowledge_state:
  林岐:
    knows:
      - 沈昭来意可疑
    not_knows:
      - 真相X
  沈昭:
    knows:
      - 林岐对自己有强烈警惕

character_signals:
  林岐:
    supports_core:
      - 先观察再出手
      - 外冷内紧绷
  沈昭:
    supports_core:
      - 不轻易交底

quotes:
  - speaker: 林岐
    target: 沈昭
    mood: tense
    text: "你说完了？那现在轮到我问。"

evidence:
  - source_span: 第1章前半
    note: 对话与动作描写支持“戒备与试探”
```

---

## 3. 再从所有 scene 卡片汇总成最终文件

也就是说：

* **不是从原文直接汇总**
* **而是从 scene\_cards 汇总**

这样会稳很多。

---

# 最终文件怎么生成

目录推荐这样：

```text
project/
  raw/
    source.md
  scenes/
    index.md
  scene_cards/
    ch01_sc01.md
    ch01_sc02.md
  characters/
    char_lin_qi.md
    char_shen_zhao.md
  relations/
    rel_lin_qi__shen_zhao.md
  events/
    ev_001.md
    ev_018.md
  quotes/
    lin_qi_to_shen_zhao_tense.md
  world_rules.md
  timeline.md
  uncertain.md
  consistency_report.md
```

---

## 4. 角色文件怎么从 scene\_cards 汇总

AI 在读完所有 `scene_cards/*.md` 后，再生成：

```text
characters/char_xxx.md
```

### 角色文件模板

```yaml
id: char_lin_qi
name: 林岐

core_must:
  - 倾向先观察，再行动
  - 在外人面前不轻易示弱
  - 对重要的人更常用行动表达关心

core_must_not:
  - 不会无缘无故抛下自己人
  - 不会突然变成轻佻热闹的口吻
  - 不会在公开场合直接崩溃哭诉

values_rank:
  - 承诺
  - 自己人
  - 体面
  - 效率

speech_style:
  - 短句
  - 克制
  - 冷讽
  - 少感叹号

arc_phases:
  - phase: pre_truth
    traits:
      - 不信任沈昭
    knows:
      - 不知道真相X
  - phase: post_truth
    traits:
      - 表面更冷，实际更保护人
    knows:
      - 知道真相X

evidence:
  - ch01_sc01
  - ch03_sc02
  - ch11_sc04
```

### 这里有个很重要的规则

`core_must / core_must_not` 只能来自：

* 原文明说
* 或者多个 scene 反复出现的稳定行为

单场戏里的情绪，不要直接写进核心人设。

比如：

* “这一章他很愤怒”
  不能直接变成
* “他是暴躁型人物”

这个区分非常重要。

---

## 5. 事件文件怎么生成

事件文件来自 scene 卡片里的 `events` 汇总。

模板：

```yaml
id: ev_018
title: 真相揭露
chapter_range: 18
participants:
  - 林岐
  - 沈昭

before:
  - 林岐不知真相X
  - 林岐对沈昭强烈不信任

after:
  - 林岐知道真相X
  - 林岐对沈昭的敌意下降
  - 两人关系进入脆弱合作阶段

causes:
  - ev_011
  - ev_014

effects:
  - rel_lin_qi__shen_zhao 更新
  - phase 从 pre_truth 切换到 post_truth

evidence:
  - ch18_sc01
```

---

## 6. 关系文件怎么生成

关系文件不是写“他们关系很好/不好”这么简单，而是写​**变化历史**​。

```yaml
id: rel_lin_qi__shen_zhao
pair:
  - 林岐
  - 沈昭

baseline:
  type: 对立中带吸引
  trust: 18
  intimacy: 12
  hostility: 71

history:
  - after: ev_001
    trust: 15
    hostility: 48
    note: 初次对立建立
  - after: ev_018
    trust: 36
    hostility: 49
    note: 真相揭露后开始脆弱合作
  - after: ev_023
    trust: 57
    intimacy: 41
    note: 共患难后关系升温

hard_constraints:
  - ev_018之前，不能出现无条件坦白
  - ev_023之前，不应出现过度轻松打闹

evidence:
  - ch01_sc01
  - ch18_sc01
  - ch23_sc03
```

---

## 7. 对白样本文件怎么生成

对白最好按：

* 谁说
* 对谁说
* 什么情绪场景

来分文件。

```yaml
speaker: 林岐
target: 沈昭
mood: tense

samples:
  - "你说完了？那现在轮到我问。"
  - "我不是信你，我只是先不拆穿你。"
  - "别把我当傻子。"

style_notes:
  - 句子短
  - 不卖萌
  - 不滥用感叹号
```

这个文件专门用来保“像不像本人说的话”。

---

# AI 具体该怎么做：最稳的是 4 轮 Prompt

你如果只是和 AI 对话，最简单的方法不是“一次发长文让它全做完”，而是按这 4 轮来。

---

## 第 1 轮：让 AI 只做切分

你可以直接这样发：

```text
下面是一篇长文。请不要总结人物设定，不要写同人，不要补完剧情。
你只做一件事：按“scene”切分。

切分规则：
1. 时间变化、地点变化、视角变化、行动链断开，都可以作为新 scene 的边界。
2. 每个 scene 生成一个 scene_id，格式为 chXX_scXX。
3. 输出 scenes/index.md。
4. 每个 scene 只包含：
   - scene_id
   - chapter
   - location
   - time
   - pov
   - characters
   - 100字内摘要
   - key_turning_points
   - source_span
5. 不要做性格推断，不要脑补原文没有写的设定。

原文如下：
<<<原文开始>>>
……
<<<原文结束>>>
```

---

## 第 2 轮：让 AI 给每个 scene 生成 scene 卡片

```text
根据上一步的 scenes/index.md，现在为每个 scene 生成 scene card。

要求：
1. 每个 scene 单独输出一个 YAML 文件。
2. 文件名使用 scene_id。
3. 字段必须包含：
   - scene_id
   - chapter
   - time
   - location
   - pov
   - present_characters
   - explicit_facts
   - soft_inferences
   - events
   - relation_changes
   - knowledge_state
   - character_signals
   - quotes
   - evidence
4. 明示事实和推断必须分开。
5. 所有判断尽量回链到 source_span。
6. 不要汇总成人物总设定。

请先输出 ch01_sc01 到 ch01_sc03。
```

这里最好分批做。
不要一次让 AI 生成 50 张卡。

---

## 第 3 轮：从 scene cards 汇总最终文件

等你把 scene cards 都拿到了，再发：

```text
现在不要回看原文，只根据已有的 scene cards 汇总全局文件。

请生成以下文件：
1. world_rules.md
2. timeline.md
3. characters/*.md
4. relations/*.md
5. events/*.md
6. quotes/*.md
7. uncertain.md

规则：
- characters 只保留稳定核心，不把短期状态写进 core。
- relations 要体现变化历史。
- events 要体现 before/after/cause/effect。
- quotes 只收录有代表性的对白样本。
- 对没有足够证据的判断，不要强行写进正式文件，放进 uncertain.md。
```

---

## 第 4 轮：让 AI 做一致性检查

最后这轮很重要。

```text
请对前面生成的所有文件做一致性检查，输出 consistency_report.md。

检查项：
1. 同一人物是否有重复命名或别名未合并
2. 某些阶段性特征是否误写进 core_must/core_must_not
3. 时间线是否有前后冲突
4. 关系变化是否跳跃过大
5. 某些人物是否知道了他本不该知道的信息
6. 某些引文是否被错误归属给了别的角色
7. 哪些地方证据不足，应该回到 uncertain.md
```

---

# 最关键的一个原则：先做 scene 卡，再做全局文件

这是整套方法最重要的点。

因为 AI 处理长文时，最容易犯的错不是“忘词”，而是：

* 直接把局部表现总结成永久性格
* 把一场戏的情绪误认为长期状态
* 把关系变化看成从头到尾都成立
* 把一次对白当成固定口头禅

有了 `scene_cards` 这一层，中间态就清楚很多。
你之后要修，也只需要改某几张 scene 卡，再重新汇总，不用重做整套系统。

---

# 纯文本里最好再加一个 `uncertain.md`

这个文件非常有用。

凡是 AI 不确定、证据不够、原文模糊、可能有多种解释的内容，都先放这里，不要写进正式设定库。

例如：

```yaml
- item: 林岐是否从一开始就对沈昭有隐性好感
  status: uncertain
  reason: 原文只有紧张和关注，没有足够直接证据
  related_scenes:
    - ch01_sc01
    - ch02_sc03
```

这样可以大幅减少误判导致的 OOC。

---

# 如果原文特别长，应该怎么发给 AI

不要整本一次性塞。

最稳的是：

* 按章节发
* 或按 3 到 5 个 scene 一批发
* 每批先产出 `scene_cards`
* 最后再全局汇总

也就是：

**局部抽取先做完，最后才做全局人物和关系**

而不是一开始就让 AI 下总判断。

---

# 你可以直接照抄的一套目录

```text
project/
  raw/
    source.md
  scenes/
    index.md
  scene_cards/
    ch01_sc01.md
    ch01_sc02.md
    ch01_sc03.md
  characters/
    char_lin_qi.md
    char_shen_zhao.md
  relations/
    rel_lin_qi__shen_zhao.md
  events/
    ev_001.md
    ev_018.md
  quotes/
    lin_qi_to_shen_zhao_tense.md
  world_rules.md
  timeline.md
  uncertain.md
  consistency_report.md
```

---

# 一句话总结

你发长文给 AI 后，最好的处理方式不是：

**“请帮我整理成设定库。”**

而是：

**“先切成 scene，再给每个 scene 做卡片，最后从 scene 卡片汇总成人物、关系、事件、对白和时间线文件。”**

这样才最不容易 OOC，也最容易修改和追溯。

你要的话，我下一条可以直接给你一套​**可复制的 Prompt 套装**​，按“切 scene / 生成 scene 卡 / 汇总角色 / 汇总关系 / 审核一致性”五组写好。

