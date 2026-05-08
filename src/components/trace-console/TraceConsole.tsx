import { useRef, useEffect } from "react";
import { useWorkbenchStore } from "../../stores/workbenchStore";

export function TraceConsole() {
  const events = useWorkbenchStore((s) => s.events);
  const selectEvent = useWorkbenchStore((s) => s.selectEvent);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="trace-console panel">
      <div className="trace-console-header">Trace Console</div>
      <div ref={listRef} className="trace-list">
        {events.map((event) => (
          <button
            key={event.id}
            className="trace-row"
            onClick={() => selectEvent(event.id)}
          >
            <span className="trace-seq">{String(event.sequence).padStart(2, "0")}</span>
            <span className="trace-agent">{event.agentId?.replace("agent_", "") ?? "sys"}</span>
            <span className="trace-type">{event.type}</span>
            <span className="trace-summary">{event.summary}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
