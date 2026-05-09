import { emit } from "./events.js";
import { callOpenAIJson, getFirstActiveProvider } from "./providers.js";

const PLAN_SYSTEM = `你是 Agent Workbench 的总智能体。用户会给你一个任务，你需要把它拆解成可执行的子任务。

你必须输出合法 JSON（不要输出 JSON 以外的任何内容），格式如下：
{
  "tasks": [
    {
      "id": "task_xxx",
      "title": "任务标题",
      "agentId": "agent_xxx",
      "instruction": "详细的任务说明",
      "dependsOn": [],
      "expectedOutput": "期望输出描述"
    }
  ]
}

规则：
1. 能并行的任务尽量并行（dependsOn 为空）。
2. 每个 agentId 必须是以下之一：agent_researcher, agent_planner, agent_writer, agent_reviewer
3. dependsOn 只能引用同一 plan 中已有 task 的 id
4. 不能有循环依赖
5. 至少有一个无依赖任务
6. task id 用 task_ 前缀

可用智能体：
- agent_researcher：资料搜索、事实提炼、来源整理
- agent_planner：结构规划、大纲设计
- agent_writer：内容生成、文本整合
- agent_reviewer：事实核查、逻辑审查、表达优化`;

const SUMMARY_SYSTEM = `你是 Agent Workbench 的总智能体。所有子任务已完成，你需要汇总最终结果。

用户原始任务和每个子任务的输出会在下方提供。请直接给出最终汇总结果，清晰、完整、有条理。`;

const AGENT_SYSTEMS = {
  agent_researcher: `你是资料研究智能体。负责搜索、提炼事实、整理来源。

输出格式：
1. 关键发现（列表）
2. 支撑依据
3. 不确定点
4. 建议

不要编造来源。`,

  agent_planner: `你是结构规划智能体。负责设计文档或报告的结构。

输出格式：
1. 推荐结构（带层级）
2. 每部分要点
3. 信息缺口
4. 建议执行顺序`,

  agent_writer: `你是写作智能体。根据上游结果生成完整文本。

规则：
- 尊重上游事实，不编造
- 结构清晰、表达自然
- 标注不确定内容`,

  agent_reviewer: `你是审查智能体。检查上游输出的准确性。

输出格式：
1. 发现的问题（带严重程度）
2. 修改建议
3. 是否建议通过`,
};

const AGENT_NAMES = {
  agent_researcher: "研究员",
  agent_planner: "大纲员",
  agent_writer: "写作者",
  agent_reviewer: "审查员",
};

export { AGENT_NAMES, AGENT_SYSTEMS };

export async function createPlan(sessionId, userTask) {
  emit(sessionId, "session_started", { userTask }, { summary: "创建任务会话" });
  emit(sessionId, "planning_started", {}, { agentId: "agent_orchestrator", summary: "总智能体开始拆解任务" });

  const provider = getFirstActiveProvider();
  if (!provider) {
    const message = "No active provider configured. Please configure an API provider in Settings.";
    emit(sessionId, "session_failed", { error: message }, { severity: "error", summary: "未配置可用 API Provider" });
    throw new Error(message);
  }

  const messages = [
    { role: "system", content: PLAN_SYSTEM },
    { role: "user", content: userTask },
  ];

  let plan;
  try {
    plan = await callOpenAIJson(provider, messages);
  } catch (e) {
    emit(sessionId, "session_failed", { error: e.message }, { severity: "error", summary: "任务规划失败" });
    throw e;
  }

  if (!plan.tasks || !Array.isArray(plan.tasks)) {
    emit(sessionId, "session_failed", { error: "Invalid plan format" }, { severity: "error", summary: "任务计划格式无效" });
    throw new Error("Invalid plan format");
  }

  emit(sessionId, "plan_created", { tasks: plan.tasks }, { agentId: "agent_orchestrator", summary: `总智能体创建了 ${plan.tasks.length} 个任务` });
  return plan;
}

export async function summarize(sessionId, userTask, taskResults) {
  emit(sessionId, "task_started", { label: "开始最终汇总" }, { taskId: "task_summary", agentId: "agent_orchestrator", summary: "总智能体开始汇总" });

  const provider = getFirstActiveProvider();
  if (!provider) throw new Error("No active provider");

  const resultParts = Object.entries(taskResults)
    .map(([taskId, result]) => `## ${taskId}\n${result}`)
    .join("\n\n");

  const messages = [
    { role: "system", content: SUMMARY_SYSTEM },
    { role: "user", content: `原始任务：${userTask}\n\n子任务结果：\n${resultParts}` },
  ];

  const finalAnswer = await callOpenAIJson(provider, messages).then((r) => JSON.stringify(r, null, 2)).catch(() => "汇总完成，但结果解析失败。");

  emit(sessionId, "task_finished", { result: "汇总完成" }, { taskId: "task_summary", agentId: "agent_orchestrator", summary: "最终汇总完成" });
  emit(sessionId, "session_finished", { finalAnswer }, { agentId: "agent_orchestrator", summary: "任务完成，最终报告已生成" });

  return finalAnswer;
}
