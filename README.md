# Agent Workbench

桌面多智能体工作台 — 让用户实时看见 AI 团队如何分工、并行、执行和汇总结果。

## 核心理念

> 不只是返回一个 AI 答案，而是让用户实时、显性、可追踪地看到每个智能体的执行轨迹和操作过程。

## 项目状态

当前阶段：技术设计 + 前端代码骨架（Mock Event Player）

## 技术栈

- **桌面端**: Tauri 2 + React + TypeScript
- **状态管理**: Zustand（事件驱动 reducer）
- **后端**: Node.js TypeScript sidecar
- **数据库**: SQLite
- **LLM**: Claude API（ProviderAdapter 可扩展）

## 快速开始

```bash
npm install
npm run dev
```

然后打开 Vite 输出的本地地址，通常是：

```text
http://localhost:5173
```

更多开发说明见 [DEVELOPMENT.md](DEVELOPMENT.md)。

## 项目结构

```text
src/
├── app/                # 应用入口和全局样式
├── components/
│   ├── top-task-bar/   # 任务输入栏
│   ├── agent-sidebar/  # Agent 卡片列表
│   ├── workbench/      # 并行泳道视图
│   ├── inspector/      # 右侧详情面板
│   └── trace-console/  # 底部事件日志
├── stores/             # Zustand store + event reducer
├── types/              # TypeScript 类型定义
├── mocks/              # Mock 数据 + Mock Event Player
└── realtime/           # 事件客户端（后续接 SSE/WebSocket）

backend/
└── src/
    └── db/migrations/  # SQLite 建表 SQL

docs/                   # 完整技术文档
```

## 技术文档

完整技术文档在 `docs/` 目录，建议按以下顺序阅读：

1. [文档总览](docs/00_README_文档总览.md)
2. [PRD 产品需求文档](docs/01_PRD_产品需求文档.md)
3. [系统架构设计](docs/02_系统架构设计.md)
4. [事件流协议](docs/03_事件流协议.md)
5. [数据模型与数据库设计](docs/04_数据模型与数据库设计.md)
6. [前端实现规范](docs/05_前端实现规范.md)
7. [后端编排与调度设计](docs/06_后端编排与调度设计.md)
8. [Agent 与 LLM 集成规范](docs/07_Agent与LLM集成规范.md)
9. [工具系统与权限安全](docs/08_工具系统与权限安全.md)
10. [API 接口与实时通信规范](docs/09_API接口与实时通信规范.md)
11. [工程规范与测试验收](docs/10_工程规范与测试验收.md)
12. [开发计划与交接清单](docs/11_开发计划与交接清单.md)

## 核心架构

```text
用户输入任务
  ↓
总智能体拆解任务（生成 Task DAG）
  ↓
Scheduler 调度（可并行任务同时执行）
  ↓
AgentRuntime 执行（调用 LLM + 工具）
  ↓
事件流驱动 UI 动态更新
  ↓
总智能体汇总最终结果
```

所有 UI 状态由事件流推导：`events[] → reducer → WorkbenchState`

## License

MIT
