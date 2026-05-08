import type { Agent } from "../../types";

const STATUS_COLORS: Record<string, string> = {
  idle: "#6B7280",
  planning: "#3B82F6",
  waiting: "#F59E0B",
  running: "#10B981",
  tool_call: "#8B5CF6",
  success: "#10B981",
  failed: "#EF4444",
  paused: "#9CA3AF",
  needs_user: "#F97316",
};

export function AgentCard({
  agent,
  selected,
  onClick,
}: {
  agent: Agent;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`agent-card status-${agent.status} ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="agent-card-header">
        <span
          className="agent-dot"
          style={{ backgroundColor: STATUS_COLORS[agent.status] ?? agent.color }}
        />
        <div>
          <div className="agent-name">{agent.name}</div>
          <div className="agent-role">{agent.role}</div>
        </div>
      </div>
      <div className="agent-status-row">
        <span className="status-badge" style={{ color: STATUS_COLORS[agent.status] }}>
          {agent.status}
        </span>
        <span className="agent-action">{agent.currentAction || "等待任务"}</span>
      </div>
      {agent.latestMessage && (
        <div className="agent-latest-message">{agent.latestMessage}</div>
      )}
    </button>
  );
}
