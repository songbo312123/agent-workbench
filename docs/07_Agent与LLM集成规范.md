# Agent Workbench Agent 与 LLM 集成规范

## 1. 设计目标

Agent 与 LLM 集成层要解决：

```text
1. 每个 Agent 有独立角色和 system prompt
2. 每个 Agent 可配置 provider/model/apiKeyRef/tools/budget
3. 总智能体可输出结构化任务计划
4. 子智能体可执行任务并流式输出
5. 工具调用过程可事件化
6. 未来可支持多个模型供应商
```

核心原则：

> Agent 是角色、任务能力和工具权限的组合；API Key 是模型供应商资源，不是 Agent 的本质身份。

---

## 2. Agent 配置模型

```ts
type AgentConfig = {
  id: string;
  name: string;
  role: string;
  description?: string;
  provider: "anthropic" | "openai" | "gemini" | "local";
  model: string;
  apiKeyRef?: string;
  systemPrompt: string;
  tools: string[];
  color: string;
  avatar?: string;
  maxTokens?: number;
  maxCostUsd?: number;
  maxRuntimeSeconds?: number;
  enabled: boolean;
};
```

---

## 3. 默认模型策略

MVP 默认使用配置中的 Claude 模型，不在业务逻辑中写死模型 ID。

```text
settings.defaultProvider = "anthropic"
settings.defaultModel = "<official-anthropic-model-id>"
```

实现时不要把模型 ID 写死在业务逻辑里。应从配置读取：

```text
settings.defaultProvider
settings.defaultModel
agents.model
```

文档中的模型 ID 只作为示例。开发前必须以 Anthropic 官方模型文档或实际 API 返回为准。生产环境建议使用带日期的稳定模型 ID，不建议用会漂移的 latest alias。

如果模型不可用，ProviderAdapter 应返回明确错误，由 UI 引导用户更换模型或 API Key。

---

## 4. 默认 Agent 团队

MVP 固定 5 个 Agent。

---

### 4.1 OrchestratorAgent

职责：

```text
理解用户任务
拆解任务
分配 Agent
定义依赖关系
最终汇总所有结果
```

工具：

```text
P0：无工具
P1：可读 session trace
```

System Prompt 草案：

```text
你是 Agent Workbench 的总智能体，负责把用户的复杂任务拆解成可执行的子任务，并在任务完成后汇总结果。

你不能直接完成所有工作。你必须根据可用智能体的能力，把任务拆给合适的智能体。

你输出任务计划时必须遵守 JSON schema，不要输出额外解释。

任务设计原则：
1. 能并行的任务应尽量并行。
2. 每个任务必须有明确输出。
3. 任务依赖必须清晰。
4. 不要创建无意义或重复任务。
5. 不要调用不存在的智能体。
```

---

### 4.2 ResearchAgent

职责：

```text
资料搜索
事实提炼
来源整理
关键观点总结
```

工具：

```text
web_search，P0 使用 mock 实现，P1 切换真实搜索 provider
web_fetch，P1
browser，P2
```

System Prompt 草案：

```text
你是资料研究智能体，负责为任务收集信息、提炼事实、整理来源和发现关键趋势。

你的输出应该清晰列出：
1. 关键发现
2. 支撑依据
3. 不确定点
4. 建议后续处理方式

如果使用工具，优先返回高质量来源和摘要。不要编造来源。
```

---

### 4.3 PlannerAgent

职责：

```text
结构规划
大纲设计
任务组织
内容框架
```

System Prompt 草案：

```text
你是结构规划智能体，负责把任务目标转成清晰结构。

你应该输出：
1. 推荐结构
2. 每部分要点
3. 信息缺口
4. 写作或执行顺序建议

你的输出要服务后续写作者或执行者，不要写成最终成品。
```

---

### 4.4 WriterAgent

职责：

```text
内容生成
报告写作
文本整合
表达优化
```

System Prompt 草案：

```text
你是写作智能体，负责根据上游研究结果和结构规划生成完整内容。

你必须尊重上游事实，不要编造数据和来源。

你的输出应该：
1. 结构清晰
2. 表达自然
3. 结论明确
4. 标注不确定内容
```

---

### 4.5 ReviewAgent

职责：

```text
事实核查
逻辑审查
表达审查
风险提示
```

System Prompt 草案：

```text
你是审查智能体，负责检查上游输出中的事实、逻辑、表达和风险。

你应该输出：
1. 发现的问题
2. 问题严重程度
3. 修改建议
4. 是否建议通过

不要重写全文，除非任务明确要求。
```

---

## 5. ProviderAdapter 接口

所有模型供应商必须实现统一接口。

```ts
type ProviderRequest = {
  model: string;
  systemPrompt: string;
  messages: ProviderMessage[];
  tools?: ToolSchema[];
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, unknown>;
};

type ProviderMessage = {
  role: "user" | "assistant";
  content: string | Array<ProviderContentBlock>;
};

type ProviderStreamEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_call"; toolCallId: string; name: string; input: unknown }
  | { type: "usage"; inputTokens: number; outputTokens: number; costUsd?: number }
  | { type: "done"; finalText: string }
  | { type: "error"; error: ProviderError };

interface ProviderAdapter {
  streamMessage(request: ProviderRequest): AsyncIterable<ProviderStreamEvent>;
  createMessage(request: ProviderRequest): Promise<ProviderResponse>;
}
```

---

## 6. Claude API 接入要求

### 6.1 调用方式

推荐使用官方 Anthropic SDK。

要求：

```text
使用流式输出
复杂任务可启用当前 SDK 支持的 thinking 参数；具体参数必须以官方 SDK 文档和目标模型能力为准
使用结构化输出生成任务计划
保留 usage 信息，用于 token/cost 统计
所有 SDK 错误转成统一 ProviderError
```

---

### 6.2 规划调用

总智能体规划应使用结构化输出。

输出 schema：

```ts
type OrchestratorPlanOutput = {
  tasks: Array<{
    id: string;
    title: string;
    agentId: string;
    instruction: string;
    dependsOn: string[];
    expectedOutput: string;
  }>;
};
```

要求：

```text
id 使用小写 snake_case 或 task_xxx
agentId 必须匹配已注册 Agent
dependsOn 必须是同一 plan 中已有 task id
不能有循环依赖
```

---

### 6.3 子 Agent 调用

子 Agent 输入包括：

```text
原始用户任务
当前子任务 instruction
当前 Agent role/systemPrompt
上游任务结果
可用工具列表
输出格式要求
```

示例消息：

```text
用户原始任务：{{userTask}}

当前任务：{{task.title}}
任务说明：{{task.instruction}}
期望输出：{{task.expectedOutput}}

上游任务结果：
{{dependencyResults}}

请完成当前任务，并在必要时调用可用工具。
```

---

## 7. Prompt Caching 要求

如果使用 Claude API，应设计 prompt caching：

稳定前缀：

```text
Agent system prompt
工具 schema
固定输出格式说明
```

变化内容：

```text
用户任务
当前 task
上游结果
当前时间
```

原则：

```text
稳定内容放前面
变化内容放后面
工具列表顺序稳定
system prompt 不要动态拼接时间戳
```

---

## 8. Token 与成本统计

ProviderAdapter 输出 usage 事件：

```ts
type UsageReportedEventPayload = {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;
  costUsd?: number;
};
```

UI 显示：

```text
Agent 卡片：本任务 token/cost
Session 顶部：总 token/cost
Trace Console：usage reported event
```

MVP 可以先记录 token，不精确计算 cost；P1 加模型价格表。

---

## 9. 结构化输出校验

任何关键 JSON 输出都必须校验。

推荐：

```text
Zod
JSON Schema
TypeBox
```

规划结果校验失败时：

```text
emit plan_validation_failed
尝试让总智能体修复一次
仍失败则 session_failed
```

不要把未校验的任务计划交给 Scheduler。

---

## 10. 错误统一格式

```ts
type ProviderError = {
  code: string;
  message: string;
  provider: string;
  model?: string;
  retryable: boolean;
  raw?: unknown;
};
```

常见错误：

```text
api_key_missing
api_key_invalid
rate_limited
model_not_available
context_length_exceeded
timeout
network_error
invalid_tool_call
structured_output_invalid
unknown_provider_error
```

---

## 11. 上下文控制

AgentRuntime 构造上下文时要控制长度。

MVP 策略：

```text
上游任务结果只传 result，不传完整 trace
工具输出只传摘要，不传超大原文
超过长度时要求 ResearchAgent 先压缩
```

P1 增加：

```text
自动摘要
文件引用
向量检索
server-side compaction，按模型支持情况实现
```

---

## 12. LLM 集成验收标准

```text
1. 可配置 API Key
2. Orchestrator 能输出合法任务计划
3. 任务计划经过 schema 校验
4. 子 Agent 能流式输出文本
5. 流式输出转成 agent_message_delta 事件
6. 工具调用转成 tool_call_started/finished 事件
7. usage 信息被记录
8. Provider 错误被转成统一错误格式
9. API Key 不暴露到前端
10. 模型 ID 从配置读取，不写死在业务逻辑
```
