import type { TraceEvent } from "../types";

export function playMockEvents(
  events: TraceEvent[],
  onEvent: (event: TraceEvent) => void,
  onDone?: () => void
): () => void {
  const timers: number[] = [];
  const firstSeq = events[0]?.sequence ?? 0;

  for (const [index, event] of events.entries()) {
    const delay = Math.max(0, (event.sequence - firstSeq)) * 800;
    const timer = window.setTimeout(() => {
      onEvent({ ...event, id: event.id || crypto.randomUUID() });
      if (index === events.length - 1) onDone?.();
    }, delay);
    timers.push(timer);
  }

  return () => {
    for (const t of timers) window.clearTimeout(t);
  };
}
