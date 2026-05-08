export type TaskStatus =
  | "pending"
  | "waiting"
  | "running"
  | "success"
  | "failed"
  | "cancelled"
  | "paused";

export type AgentTask = {
  id: string;
  sessionId: string;
  title: string;
  instruction: string;
  expectedOutput?: string;
  agentId: string;
  dependsOn: string[];
  status: TaskStatus;
  startedAt?: string;
  finishedAt?: string;
  result?: string;
  error?: string;
};
