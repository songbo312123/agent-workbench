import { useWorkbenchStore } from "../../stores/workbenchStore";

export function InspectorPanel() {
  const selectedAgentId = useWorkbenchStore((s) => s.selectedAgentId);
  const selectedEventId = useWorkbenchStore((s) => s.selectedEventId);
  const agents = useWorkbenchStore((s) => s.agents);
  const events = useWorkbenchStore((s) => s.events);

  const agent = selectedAgentId ? agents[selectedAgentId] : undefined;
  const event = selectedEventId ? events.find((e) => e.id === selectedEventId) : undefined;

  return (
    <aside className="inspector-panel panel">
      {!agent && !event && (
        <div className="empty-inspector">选择一个 Agent 或事件查看详情</div>
      )}
      {agent && (
        <div className="agent-detail">
          <h3>{agent.name}</h3>
          <div className="detail-row">
            <span>角色</span>
            <strong>{agent.role}</strong>
          </div>
          <div className="detail-row">
            <span>状态</span>
            <strong>{agent.status}</strong>
          </div>
          <div className="detail-row">
            <span>当前动作</span>
            <strong>{agent.currentAction ?? "无"}</strong>
          </div>
          {agent.latestMessage && (
            <div className="detail-section">
              <div className="detail-label">最新输出</div>
              <div className="detail-text">{agent.latestMessage}</div>
            </div>
          )}
        </div>
      )}
      {event && (
        <div className="event-detail">
          <h3>事件详情</h3>
          <div className="detail-row">
            <span>类型</span>
            <strong>{event.type}</strong>
          </div>
          <div className="detail-row">
            <span>摘要</span>
            <strong>{event.summary}</strong>
          </div>
          <div className="detail-row">
            <span>序号</span>
            <strong>{event.sequence}</strong>
          </div>
          <pre className="payload-view">{JSON.stringify(event.payload, null, 2)}</pre>
        </div>
      )}
    </aside>
  );
}
