# Nooc — 小说结构化分析工具

Nooc 是一个基于 AI 的小说结构化分析平台。它能将长篇小说文本自动拆解为场景、角色、关系、事件等结构化数据，并在此基础上提供知识图谱可视化、角色扮演聊天和创作辅助功能。

## 核心理念

> **先切成 scene，再给每个 scene 做卡片，最后从 scene 卡片汇总成人物、关系、事件、对白和时间线文件。**

直接让 AI 从原文一步到位生成设定库，容易出现：
- 把「当前状态」误写成「永久人设」
- 把「某一章的关系」误写成「全书默认关系」
- 忘掉时间顺序和知情边界
- 把脑补混进事实

Nooc 采用 **4 轮渐进式分析流水线**，从局部到全局逐步提炼，大幅降低误判。

## 功能概览

### 1. 四步分析流水线

| 步骤 | 说明 | 产出 |
|------|------|------|
| **Scene 切分** | 按时间/地点/视角/行动链断开切分场景 | `scenes/index.yaml` |
| **Scene 卡片** | 为每个场景提取事实、推断、关系变化、知识状态 | `scene_cards/all_cards.yaml` |
| **全局汇总** | 从卡片汇总角色、关系、事件、世界观、时间线 | `characters.yaml` `relations.yaml` `events.yaml` 等 |
| **一致性检查** | 自动校验命名、时间线、关系跳跃、知识边界 | `consistency_report.md` |

### 2. 知识图谱可视化

基于分析结果生成的结构化数据，以可视化方式呈现：

- **角色节点** — 卡片展示核心特质、说话风格
- **关系网络** — 角色间的关系及其基线描述
- **事件时间线** — 关键事件的时间轴展示
- **世界观摘要** — 世界规则与设定概览
- 点击角色可高亮相关关系和事件

### 3. 角色聊天

选择小说中的角色与其对话，AI 严格按照角色设定回复：

- 基于角色的 `core_must` / `core_must_not` / `values_rank` / `speech_style` 构建 system prompt
- 注入角色的关键关系、经历、世界观作为上下文
- 流式输出，聊天记录自动保存到本地，切换角色不丢失

### 4. 创作模式

基于小说的完整世界观与角色设定进行创作对话：

- AI 了解所有角色概要、关系网络、时间线
- 支持续写、改编、「如果」推演等创作需求
- 自动保持角色一致性，不 OOC
- 侧边面板展示图谱概要作为参考

## 技术栈

- **框架**: Next.js 15 (App Router) + React 19
- **样式**: Tailwind CSS 4 + Radix UI
- **AI**: OpenAI 兼容 API（支持自定义 base URL）
- **构建**: Turbopack
- **包管理**: pnpm

## 快速开始

### 安装

```bash
git clone https://github.com/Charlo-O/nooc.git
cd nooc
pnpm install
```

### 启动开发服务器

```bash
pnpm dev --port 4000
```

访问 http://localhost:4000

### 构建生产版本

```bash
pnpm build
pnpm start
```

## 使用指南

### 第一步：配置 API

进入「API 设置」页面，填写：

| 字段 | 说明 | 示例 |
|------|------|------|
| Base URL | OpenAI 兼容的 API 地址 | `https://api.openai.com/v1` |
| API Key | 你的 API 密钥 | `sk-...` |
| Model | 模型名称 | `gpt-4o` |

支持任何 OpenAI 兼容的 API（如 DeepSeek、Moonshot、本地 Ollama 等）。

### 第二步：上传小说文本

在首页粘贴或上传小说文本，点击开始分析。系统将自动执行四步流水线，实时显示每一步的进度和输出。

### 第三步：查看分析结果

分析完成后可以：

- **分析结果** — 以树形或预览模式浏览所有生成的文件，支持下载为 ZIP
- **知识图谱** — 可视化查看角色、关系、事件
- **角色聊天** — 选择角色开始对话
- **创作模式** — 基于世界观进行创作

所有分析记录自动保存到历史记录，各功能页面通过卡片选择器加载。

## 项目结构

```
src/
├── app/                    # 页面路由
│   ├── page.tsx            # 首页（文本上传）
│   ├── settings/           # API 设置
│   ├── process/            # 分析流水线
│   ├── results/            # 分析结果查看
│   ├── history/            # 历史记录
│   ├── graph/              # 知识图谱可视化
│   ├── chat/               # 角色聊天
│   ├── write/              # 创作模式
│   └── api/process/        # 分析流水线 API (SSE)
├── components/             # UI 组件
│   ├── sidebar.tsx         # 侧边导航栏
│   ├── chat-message.tsx    # 聊天消息气泡
│   ├── history-card-select.tsx  # 历史记录卡片选择器
│   ├── pipeline.tsx        # 流水线进度展示
│   └── ui/                 # 基础 UI 组件 (shadcn/ui)
├── hooks/                  # 自定义 Hooks
│   ├── use-settings.ts     # API 配置管理
│   ├── use-process.ts      # 流水线状态管理
│   ├── use-history.ts      # 历史记录管理
│   └── use-chat.ts         # 聊天状态管理（含持久化）
└── lib/                    # 工具库
    ├── ai-client.ts        # OpenAI 客户端封装
    ├── prompts.ts          # 四步分析的 Prompt 模板
    ├── knowledge-graph.ts  # 知识图谱数据结构与解析
    ├── chat-prompts.ts     # 聊天/创作 system prompt 构建
    ├── zip.ts              # ZIP 打包下载
    └── utils.ts            # 通用工具函数
```

## 分析产出文件

| 文件 | 格式 | 说明 |
|------|------|------|
| `raw/source.md` | Markdown | 原始输入文本 |
| `scenes/index.yaml` | YAML | 场景切分索引 |
| `scene_cards/all_cards.yaml` | YAML | 所有场景的详细卡片 |
| `characters.yaml` | YAML | 角色设定（核心特质、价值观、说话风格、弧光） |
| `relations.yaml` | YAML | 角色关系（基线、变化历史、硬约束） |
| `events.yaml` | YAML | 关键事件（前因后果、参与者） |
| `quotes.yaml` | YAML | 代表性对白样本 |
| `world_rules.md` | Markdown | 世界观规则 |
| `timeline.md` | Markdown | 时间线 |
| `uncertain.md` | Markdown | 证据不足的判断（避免误判） |
| `consistency_report.md` | Markdown | 一致性检查报告 |

## 数据存储

所有数据存储在浏览器本地，无需后端数据库：

| 数据 | 存储位置 | Key |
|------|----------|-----|
| API 设置 | localStorage | `nooc-api-settings` |
| 分析历史 | localStorage | `nooc-history` |
| 聊天记录 | localStorage | `nooc-chat-{entryId}-{characterId}` |
| 侧边栏状态 | localStorage | `nooc-sidebar-collapsed` |

## 许可证

MIT
