import { useWorkbenchStore } from "../../stores/workbenchStore";
import { AgentCard } from "./AgentCard";

export function AgentSidebar() {
  const agents = useWorkbenchStore((s) => Object.values(s.agents));
  const selectedAgentId = useWorkbenchStore((s) => s.selectedAgentId);
  const selectAgent = useWorkbenchStore((s) => s.selectAgent);

  return (
    <aside className="agent-sidebar panel">
      <div className="sidebar-title">Agent Team</div>
      <div className="agent-list">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            selected={selectedAgentId === agent.id}
            onClick={() => selectAgent(agent.id)}
          />
        ))}
      </div>
    </aside>
  );
}
