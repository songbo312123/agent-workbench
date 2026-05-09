import { create } from "zustand";
import type { Agent, AgentTask, TraceEvent, Session } from "../types";
import { createDefaultAgents } from "../mocks/mockAgents";
import { createInitialState, reduceEvent } from "./eventReducer";

export type AppWorkbenchState = {
  session?: Session;
  agents: Record<string, Agent>;
  tasks: Record<string, AgentTask>;
  events: TraceEvent[];

  selectedAgentId?: string;
  selectedTaskId?: string;
  selectedEventId?: string;
  activeView: "lane" | "graph" | "replay";

  isPlaying: boolean;

  setInitialAgents: (agents: Agent[]) => void;
  addEvent: (event: TraceEvent) => void;
  resetWorkbench: () => void;
  hydrateFromEvents: (events: TraceEvent[]) => void;

  selectAgent: (id: string) => void;
  selectTask: (id: string) => void;
  selectEvent: (id: string) => void;
  setActiveView: (view: "lane" | "graph" | "replay") => void;
  setIsPlaying: (v: boolean) => void;
};

function createDefaultAgentMap(): Record<string, Agent> {
  return Object.fromEntries(createDefaultAgents().map((agent) => [agent.id, agent]));
}

export const useWorkbenchStore = create<AppWorkbenchState>((set) => ({
  ...createInitialState(),
  agents: createDefaultAgentMap(),
  isPlaying: false,

  setInitialAgents: (agents) =>
    set({ agents: Object.fromEntries(agents.map((a) => [a.id, a])) }),

  addEvent: (event) =>
    set((state) => {
      const next = reduceEvent(state, event);
      return { ...next };
    }),

  resetWorkbench: () =>
    set({
      ...createInitialState(),
      agents: createDefaultAgentMap(),
      isPlaying: false,
      selectedAgentId: undefined,
      selectedTaskId: undefined,
      selectedEventId: undefined,
    }),

  hydrateFromEvents: (events) =>
    set(() => {
      let s = {
        ...createInitialState(),
        agents: createDefaultAgentMap(),
      };
      for (const e of events) {
        s = reduceEvent(s, e);
      }
      return { ...s, events: s.events };
    }),

  selectAgent: (id) =>
    set({ selectedAgentId: id, selectedTaskId: undefined, selectedEventId: undefined }),

  selectTask: (id) =>
    set({ selectedTaskId: id, selectedAgentId: undefined, selectedEventId: undefined }),

  selectEvent: (id) =>
    set({ selectedEventId: id, selectedAgentId: undefined, selectedTaskId: undefined }),

  setActiveView: (view) => set({ activeView: view }),
  setIsPlaying: (v) => set({ isPlaying: v }),
}));
