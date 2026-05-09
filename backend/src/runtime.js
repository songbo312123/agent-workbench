import { emit } from "./events.js";
import { callOpenAI, getFirstActiveProvider } from "./providers.js";
import { AGENT_SYSTEMS, AGENT_NAMES } from "./orchestrator.js";

export async function runAgentTask(sessionId, task, dependencyResults) {
  const agentId = task.agentId;
  const agentName = AGENT_NAMES[agentId] || agentId;
  const systemPrompt = AGENT_SYSTEMS[agentId] || "你是一个通用智能体。请完成分配给你的任务。";

  emit(sessionId, "task_started", { label: `${agentName}开始执行` }, { taskId: task.id, agentId, summary: `${agentName}开始执行${task.title}` });

  const provider = getFirstActiveProvider();
  if (!provider) {
    emit(sessionId, "task_failed", { error: "No active provider" }, { taskId: task.id, agentId, severity: "error", summary: `${agentName}执行失败：未配置 API` });
    return { taskId: task.id, status: "failed", error: "No active provider" };
  }

  const depContext = Object.entries(dependencyResults)
    .map(([depId, result]) => `[${depId}] 输出：\n${result}`)
    .join("\n\n");

  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `任务：${task.title}\n说明：${task.instruction}${depContext ? `\n\n上游任务结果：\n${depContext}` : ""}`,
    },
  ];

  let finalText = "";

  try {
    const res = await callOpenAI(provider, messages);

    if (!res.body) {
      emit(sessionId, "task_failed", { error: "Empty response body" }, { taskId: task.id, agentId, severity: "error", summary: `${agentName}执行失败：空响应` });
      return { taskId: task.id, status: "failed", error: "Empty response" };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const chunk = JSON.parse(data);
          const delta = chunk.choices?.[0]?.delta;
          if (delta?.content) {
            finalText += delta.content;
            if (finalText.length % 80 < delta.content.length) {
              emit(sessionId, "agent_message_delta", { text: finalText.slice(-120) }, { taskId: task.id, agentId, summary: `${agentName}输出中间内容` });
            }
          }
        } catch {}
      }
    }

    emit(sessionId, "task_finished", { result: finalText.slice(0, 500) }, { taskId: task.id, agentId, summary: `${agentName}完成${task.title}` });
    return { taskId: task.id, status: "success", result: finalText };
  } catch (e) {
    emit(sessionId, "task_failed", { error: e.message }, { taskId: task.id, agentId, severity: "error", summary: `${agentName}执行失败` });
    return { taskId: task.id, status: "failed", error: e.message };
  }
}
