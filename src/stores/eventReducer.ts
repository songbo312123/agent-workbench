import type { Agent, AgentStatus } from "../types";
import type { AgentTask } from "../types";
import type { TraceEvent } from "../types";
import type { Session } from "../types";

export type WorkbenchState = {
  session?: Session;
  agents: Record<string, Agent>;
  tasks: Record<string, AgentTask>;
  events: TraceEvent[];
  selectedAgentId?: string;
  selectedTaskId?: string;
  selectedEventId?: string;
  activeView: "lane" | "graph" | "replay";
};

export function createInitialState(): WorkbenchState {
  return {
    agents: {},
    tasks: {},
    events: [],
    activeView: "lane",
  };
}

function appendUniqueEvent(events: TraceEvent[], event: TraceEvent): TraceEvent[] {
  if (events.some((e) => e.id === event.id)) return events;
  return [...events, event];
}

const STATUS_LABELS: Record<AgentStatus, string> = {
  idle: "空闲",
  planning: "规划中",
  waiting: "等待中",
  running: "运行中",
  tool_call: "调用工具",
  success: "已完成",
  failed: "失败",
  paused: "暂停",
  needs_user: "需要确认",
};

export { STATUS_LABELS };

export function reduceEvent(
  state: WorkbenchState,
  event: TraceEvent
): WorkbenchState {
  const agents = { ...state.agents };
  const tasks = { ...state.tasks };
  const events = appendUniqueEvent(state.events, event);
  let session = state.session;

  switch (event.type) {
    case "session_started": {
      session = {
        id: event.sessionId,
        userTask: String(event.payload.userTask ?? ""),
        status: "planning",
        startedAt: event.timestamp,
      };
      break;
    }

    case "planning_started": {
      const a = event.agentId && agents[event.agentId];
      if (a) agents[event.agentId] = { ...a, status: "planning", currentAction: event.summary };
      break;
    }

    case "plan_created": {
      const rawTasks = event.payload.tasks as Array<{
        id: string;
        title: string;
        agentId: string;
        dependsOn: string[];
      }>;
      for (const t of rawTasks) {
        tasks[t.id] = {
          id: t.id,
          sessionId: event.sessionId,
          title: t.title,
          instruction: "",
          agentId: t.agentId,
          dependsOn: t.dependsOn,
          status: t.dependsOn.length > 0 ? "waiting" : "pending",
        };
      }
      if (session) session = { ...session, status: "running" };
      break;
    }

    case "task_started": {
      const t = event.taskId && tasks[event.taskId];
      if (t) tasks[event.taskId] = { ...t, status: "running", startedAt: event.timestamp };
      const a = event.agentId && agents[event.agentId];
      if (a) {
        agents[event.agentId] = {
          ...a,
          status: "running",
          currentTaskId: event.taskId,
          currentAction: String(event.payload.label ?? event.summary),
        };
      }
      break;
    }

    case "tool_call_started": {
      const a = event.agentId && agents[event.agentId];
      if (a) {
        agents[event.agentId] = {
          ...a,
          status: "tool_call",
          currentAction: `调用工具：${String(event.payload.toolName ?? "")}`,
        };
      }
      break;
    }

    case "tool_call_finished": {
      const a = event.agentId && agents[event.agentId];
      if (a) {
        agents[event.agentId] = {
          ...a,
          status: "running",
          currentAction: `工具完成：${String(event.payload.toolName ?? "")}`,
        };
      }
      break;
    }

    case "agent_message_delta": {
      const a = event.agentId && agents[event.agentId];
      if (a) {
        agents[event.agentId] = {
          ...a,
          latestMessage: String(event.payload.text ?? ""),
        };
      }
      break;
    }

    case "task_finished": {
      const t = event.taskId && tasks[event.taskId];
      if (t) {
        tasks[event.taskId] = {
          ...t,
          status: "success",
          finishedAt: event.timestamp,
          result: String(event.payload.result ?? ""),
        };
      }
      const a = event.agentId && agents[event.agentId];
      if (a) agents[event.agentId] = { ...a, status: "success", currentAction: "任务完成" };
      break;
    }

    case "task_failed": {
      const t = event.taskId && tasks[event.taskId];
      if (t) {
        tasks[event.taskId] = {
          ...t,
          status: "failed",
          finishedAt: event.timestamp,
          error: String(event.payload.errorMessage ?? event.payload.error ?? ""),
        };
      }
      const a = event.agentId && agents[event.agentId];
      if (a) agents[event.agentId] = { ...a, status: "failed", currentAction: event.summary };
      break;
    }

    case "session_finished": {
      if (session) {
        session = {
          ...session,
          status: "completed",
          finishedAt: event.timestamp,
          finalAnswer: String(event.payload.finalAnswer ?? ""),
        };
      }
      break;
    }
  }

  return { ...state, session, agents, tasks, events };
}
