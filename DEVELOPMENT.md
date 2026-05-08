# Development Guide

## Requirements

- Node.js 20+
- npm 10+

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite, usually:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

## Preview production build

```bash
npm run preview
```

## Current implementation status

Implemented:

- Runnable Vite + React + TypeScript frontend
- Zustand store
- Event reducer
- Mock Agent team
- Mock task DAG
- Mock Event Player
- Agent cards
- Parallel lane view
- Inspector panel
- Trace console
- Dark workbench styling
- SQLite initial schema

Not implemented yet:

- Tauri shell
- Real backend server
- SSE/WebSocket event stream
- Claude API provider
- Real Orchestrator
- Real Scheduler
- Real AgentRuntime
- Real ToolRuntime

## Demo flow

1. Start dev server.
2. Open the app.
3. Click `开始执行`.
4. Watch the mock event stream:
   - Orchestrator starts planning.
   - ResearchAgent and PlannerAgent run in parallel.
   - ResearchAgent calls `web_search`.
   - WriterAgent starts after upstream tasks complete.
   - ReviewerAgent runs last.
   - Orchestrator finalizes the session.
5. Click Agent cards or event blocks to inspect details.

## Architecture rule

The frontend must stay event-driven:

```text
events[] -> reducer -> WorkbenchState -> UI
```

Do not manually mutate UI state outside the event reducer unless it is purely view state, such as selected tab or selected item.
