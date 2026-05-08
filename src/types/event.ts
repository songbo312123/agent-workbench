export type TraceEvent = {
  id: string;
  version: "aw.event.v1";
  type: string;
  sessionId: string;
  taskId?: string;
  agentId?: string;
  parentEventId?: string;
  timestamp: string;
  sequence: number;
  severity: "debug" | "info" | "warning" | "error";
  summary: string;
  payload: Record<string, unknown>;
};
