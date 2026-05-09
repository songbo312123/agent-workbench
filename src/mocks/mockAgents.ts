import type { Agent } from "../types";

export const mockAgents: Agent[] = [
  {
    id: "agent_orchestrator",
    name: "总智能体",
    role: "Orchestrator",
    description: "负责拆解任务和最终汇总",
    color: "#3B82F6",
    status: "idle",
  },
  {
    id: "agent_researcher",
    name: "研究员",
    role: "Researcher",
    description: "负责资料搜索和事实提炼",
    color: "#8B5CF6",
    status: "idle",
  },
  {
    id: "agent_planner",
    name: "大纲员",
    role: "Planner",
    description: "负责结构规划",
    color: "#06B6D4",
    status: "idle",
  },
  {
    id: "agent_writer",
    name: "写作者",
    role: "Writer",
    description: "负责生成正文",
    color: "#10B981",
    status: "idle",
  },
  {
    id: "agent_reviewer",
    name: "审查员",
    role: "Reviewer",
    description: "负责检查事实和逻辑",
    color: "#F59E0B",
    status: "idle",
  },
];

export function createDefaultAgents(): Agent[] {
  return mockAgents.map((agent) => ({ ...agent }));
}
