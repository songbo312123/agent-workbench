export type AgentStatus =
  | "idle"
  | "planning"
  | "waiting"
  | "running"
  | "tool_call"
  | "success"
  | "failed"
  | "paused"
  | "needs_user";

export type Agent = {
  id: string;
  name: string;
  role: string;
  description?: string;
  color: string;
  avatar?: string;
  status: AgentStatus;
  currentTaskId?: string;
  currentAction?: string;
  latestMessage?: string;
  tokenCount?: number;
  costUsd?: number;
};
