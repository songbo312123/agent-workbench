export type SessionStatus =
  | "idle"
  | "planning"
  | "running"
  | "completed"
  | "failed"
  | "paused"
  | "cancelled";

export type Session = {
  id: string;
  userTask: string;
  status: SessionStatus;
  startedAt?: string;
  finishedAt?: string;
  finalAnswer?: string;
};
