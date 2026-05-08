import type { Agent, TraceEvent } from "../../types";

export function EventBlock({
  event,
  agent,
  offsetX,
  onClick,
}: {
  event: TraceEvent;
  agent: Agent;
  offsetX: number;
  onClick: () => void;
}) {
  return (
    <button
      className={`event-block event-${event.type}`}
      style={{
        left: `${offsetX}px`,
        borderColor: agent.color,
      }}
      onClick={onClick}
    >
      {getEventLabel(event)}
    </button>
  );
}

function getEventLabel(event: TraceEvent): string {
  switch (event.type) {
    case "planning_started":
      return "规划任务";
    case "plan_created":
      return "生成计划";
    case "task_started":
      return String(event.payload.label ?? "开始任务");
    case "tool_call_started":
      return `工具：${String(event.payload.toolName ?? "")}`;
    case "tool_call_finished":
      return "工具完成";
    case "agent_message_delta":
      return "生成内容";
    case "task_finished":
      return "完成";
    case "task_failed":
      return "失败";
    case "session_started":
      return "创建会话";
    case "session_finished":
      return "汇总完成";
    default:
      return event.summary || event.type;
  }
}
