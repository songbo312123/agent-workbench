# Agent Workbench API 接口与实时通信规范

## 1. 设计目标

前后端通信要支持：

```text
1. 创建和控制 session
2. 查询 Agent、Task、Event
3. 实时接收事件流
4. 用户授权工具调用
5. 查看历史 trace
6. 后续扩展设置和 API Key 管理
```

MVP 可以使用本地 HTTP API + SSE。

---

## 2. API 风格

基础路径：

```text
/api
```

数据格式：

```text
Content-Type: application/json
```

错误格式：

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

---

## 3. Session API

### 3.1 创建 session

```http
POST /api/sessions
```

请求：

```json
{
  "userTask": "调研 AI 桌面智能体的发展趋势，并输出一份分析报告。",
  "teamId": "default_research_team"
}
```

响应：

```json
{
  "sessionId": "ses_001",
  "status": "planning"
}
```

行为：

```text
创建 sessions 记录
写入 session_started event
异步启动 Orchestrator
```

---

### 3.2 获取 session

```http
GET /api/sessions/:sessionId
```

响应：

```json
{
  "id": "ses_001",
  "userTask": "...",
  "status": "running",
  "finalAnswer": null,
  "createdAt": "2026-05-07T10:00:00.000Z",
  "updatedAt": "2026-05-07T10:00:10.000Z"
}
```

---

### 3.3 列出 sessions

```http
GET /api/sessions?limit=50
```

响应：

```json
{
  "items": [
    {
      "id": "ses_001",
      "userTask": "...",
      "status": "completed",
      "createdAt": "..."
    }
  ]
}
```

---

### 3.4 暂停 session

```http
POST /api/sessions/:sessionId/pause
```

MVP 行为：

```text
停止启动新任务
已运行任务允许完成
emit session_paused
```

---

### 3.5 继续 session

```http
POST /api/sessions/:sessionId/resume
```

行为：

```text
emit session_resumed
Scheduler 继续启动可运行任务
```

---

### 3.6 取消 session

```http
POST /api/sessions/:sessionId/cancel
```

行为：

```text
尝试取消运行中任务
标记未完成任务为 cancelled
emit session_cancelled
```

---

## 4. Event API

### 4.1 获取历史事件

```http
GET /api/sessions/:sessionId/events?afterSequence=123
```

响应：

```json
{
  "items": [
    {
      "id": "evt_001",
      "version": "aw.event.v1",
      "type": "session_started",
      "sessionId": "ses_001",
      "sequence": 1,
      "severity": "info",
      "summary": "创建任务会话",
      "payload": {},
      "timestamp": "2026-05-07T10:00:00.000Z"
    }
  ]
}
```

必须按 `sequence ASC` 返回。

查询参数：

```text
afterSequence 可选。传入后只返回 sequence > afterSequence 的事件，用于断线补齐和分页加载。
limit 可选，默认 1000。MVP 可以先固定返回单 session 全量事件。
```

---

### 4.2 实时事件流 SSE

```http
GET /api/sessions/:sessionId/events/stream?afterSequence=123
```

响应格式：

```text
event: agent_event
data: {"id":"evt_001", ...}

```

连接建立后：

```text
MVP 推荐：前端先 GET /events，再建立 SSE 接收增量。
如果前端传 afterSequence，服务端必须先补发 sequence > afterSequence 的事件，再推送实时增量。
```

SSE 事件必须设置 `id`：

```text
id: 124
event: agent_event
data: {"id":"evt_124", ...}
```

`id` 使用事件的 `sequence`，便于浏览器断线后用 `Last-Event-ID` 恢复。

---

### 4.3 SSE 心跳

每 15-30 秒发送：

```text
event: heartbeat
data: {"timestamp":"..."}
```

### 4.4 断线重连

前端重连策略：

```text
1. 记录本地已处理的最大 sequence。
2. SSE 断开后延迟重连，初始 1 秒，最多退避到 10 秒。
3. 重连时请求 /events/stream?afterSequence=<lastSequence>。
4. 收到重复 event.id 时忽略。
5. 如果 SSE 连续失败，重新 GET /events 并 hydrateFromEvents。
```

后端要求：

```text
1. GET /events 必须支持 afterSequence 查询参数。
2. SSE 建连时必须按 sequence ASC 补发缺失事件。
3. 对已完成 session，补发后可以关闭连接，也可以保持心跳。
4. 不允许只依赖内存队列补发，缺失事件必须从 SQLite 查询。
```

---

## 5. Task API

### 5.1 获取 session tasks

```http
GET /api/sessions/:sessionId/tasks
```

响应：

```json
{
  "items": [
    {
      "id": "task_research",
      "sessionId": "ses_001",
      "agentId": "agent_researcher",
      "title": "资料调研",
      "instruction": "...",
      "dependsOn": [],
      "status": "success",
      "result": "..."
    }
  ]
}
```

---

### 5.2 重试任务，P1

```http
POST /api/tasks/:taskId/retry
```

行为：

```text
清理当前失败状态
emit task_retry_requested
Scheduler 重新执行该任务及受影响下游
```

MVP 可不实现。

---

## 6. Agent API

### 6.1 列出 Agent

```http
GET /api/agents
```

响应：

```json
{
  "items": [
    {
      "id": "agent_researcher",
      "name": "研究员",
      "role": "Researcher",
      "provider": "anthropic",
      "model": "<official-anthropic-model-id>",
      "tools": ["web_search"],
      "color": "#8B5CF6",
      "enabled": true
    }
  ]
}
```

注意：不返回 API Key 明文。

---

### 6.2 创建/更新 Agent，P1

```http
POST /api/agents
PUT /api/agents/:agentId
```

MVP 固定 Agent，可暂不开放。

---

## 7. API Key API

### 7.1 列出 key 引用

```http
GET /api/api-keys
```

响应：

```json
{
  "items": [
    {
      "id": "anthropic_main",
      "provider": "anthropic",
      "name": "Anthropic Main",
      "createdAt": "..."
    }
  ]
}
```

不返回明文。

---

### 7.2 保存 API Key

```http
POST /api/api-keys
```

请求：

```json
{
  "provider": "anthropic",
  "name": "Anthropic Main",
  "value": "sk-..."
}
```

行为：

```text
明文写入系统 Keychain
SQLite 只保存 keychain 引用
响应不包含 value
```

---

### 7.3 测试 API Key

```http
POST /api/api-keys/:id/test
```

响应：

```json
{
  "ok": true,
  "provider": "anthropic",
  "modelAccess": ["<official-anthropic-model-id>"]
}
```

---

## 8. Tool Permission API

### 8.1 用户批准工具调用

```http
POST /api/tool-permissions/:permissionId/approve
```

### 8.2 用户拒绝工具调用

```http
POST /api/tool-permissions/:permissionId/deny
```

MVP 可以不实现高风险工具，因此 P1/P2 再做。

---

## 9. WebSocket 可选方案

如果后续需要更强双向通信，可以使用：

```text
ws://localhost:<port>/api/events
```

消息格式：

```json
{
  "type": "subscribe_session",
  "sessionId": "ses_001"
}
```

事件格式与 SSE 相同。

MVP 建议 SSE 足够。

---

## 10. 前端调用流程

```text
用户点击开始
↓
POST /api/sessions
↓
拿到 sessionId
↓
GET /api/sessions/:sessionId/events
↓
前端 reduce 历史事件
↓
记录最大 sequence，连接 /events/stream?afterSequence=<maxSequence>
↓
收到新事件，addEvent
```

---

## 11. 错误码

```text
invalid_request
session_not_found
task_not_found
agent_not_found
api_key_missing
api_key_invalid
provider_error
plan_validation_failed
scheduler_error
tool_not_found
tool_permission_denied
tool_execution_failed
internal_error
```

错误响应示例：

```json
{
  "error": {
    "code": "api_key_missing",
    "message": "Anthropic API Key 未配置",
    "details": {
      "provider": "anthropic"
    }
  }
}
```

---

## 12. API 验收标准

```text
1. POST /sessions 能创建会话并返回 sessionId
2. GET /events 能返回按 sequence 排序的事件
3. SSE 能实时推送新增事件
4. 前端断线重连后能通过 GET /events 补齐事件
5. API Key 接口不泄露明文
6. 错误响应格式统一
7. 取消/暂停接口能产生对应事件
8. 所有写操作都有后端校验
```
