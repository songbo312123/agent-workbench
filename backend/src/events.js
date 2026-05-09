const sessions = new Map();

export function createEventStream(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { listeners: [], events: [], seq: 0 });
  }
  return sessions.get(sessionId);
}

export function emit(sessionId, type, payload, extra = {}) {
  const session = createEventStream(sessionId);
  session.seq += 1;
  const event = {
    id: `evt_${session.seq}`,
    version: "aw.event.v1",
    type,
    sessionId,
    sequence: session.seq,
    severity: extra.severity || "info",
    summary: extra.summary || type,
    timestamp: new Date().toISOString(),
    ...extra,
    payload,
  };
  session.events.push(event);
  for (const listener of session.listeners) {
    listener(event);
  }
  return event;
}

export function getHistory(sessionId) {
  const session = sessions.get(sessionId);
  return session ? session.events : [];
}

export function addListener(sessionId, listener) {
  const session = createEventStream(sessionId);
  session.listeners.push(listener);
  return () => {
    session.listeners = session.listeners.filter((l) => l !== listener);
  };
}
