import { useMemo } from "react";
import { useWorkbenchStore } from "../../stores/workbenchStore";
import { EventBlock } from "./EventBlock";
import type { TraceEvent } from "../../types";

export function LaneView() {
  const agentMap = useWorkbenchStore((s) => s.agents);
  const events = useWorkbenchStore((s) => s.events);
  const selectEvent = useWorkbenchStore((s) => s.selectEvent);

  const agents = useMemo(() => Object.values(agentMap), [agentMap]);
  const eventsByAgent = useMemo(() => groupByAgent(events), [events]);

  return (
    <div className="lane-view">
      {agents.map((agent) => (
        <div key={agent.id} className="agent-lane">
          <div className="agent-lane-label">
            <span className="agent-dot" style={{ backgroundColor: agent.color }} />
            <span>{agent.name}</span>
          </div>
          <div className="agent-lane-track">
            {(eventsByAgent[agent.id] ?? []).map((event, idx) => (
              <EventBlock
                key={event.id}
                event={event}
                agent={agent}
                offsetX={idx * 120 + 8}
                onClick={() => selectEvent(event.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupByAgent(events: TraceEvent[]): Record<string, TraceEvent[]> {
  return events.reduce<Record<string, TraceEvent[]>>((acc, e) => {
    if (!e.agentId) return acc;
    (acc[e.agentId] ??= []).push(e);
    return acc;
  }, {});
}
