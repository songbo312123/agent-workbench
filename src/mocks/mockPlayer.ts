import type { TraceEvent } from "../types";

export function playMockEvents(
  events: TraceEvent[],
  onEvent: (event: TraceEvent) => void
): () => void {
  const timers: number[] = [];
  const firstSeq = events[0]?.sequence ?? 0;

  for (const event of events) {
    const delay = Math.max(0, (event.sequence - firstSeq)) * 800;
    const timer = window.setTimeout(() => {
      onEvent({ ...event, id: event.id || crypto.randomUUID() });
    }, delay);
    timers.push(timer);
  }

  return () => {
    for (const t of timers) window.clearTimeout(t);
  };
}
