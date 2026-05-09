import { emit } from "./events.js";
import { runAgentTask } from "./runtime.js";
import { summarize } from "./orchestrator.js";

export async function runSession(sessionId, plan, userTask) {
  const tasks = plan.tasks;
  const taskMap = {};
  for (const t of tasks) {
    taskMap[t.id] = { ...t, status: "pending" };
  }

  const results = {};
  const maxConcurrency = 3;

  while (true) {
    const allDone = Object.values(taskMap).every((t) => t.status === "success" || t.status === "failed");
    if (allDone) break;

    const runnable = Object.values(taskMap).filter((t) => {
      if (t.status !== "pending" && t.status !== "waiting") return false;
      return (t.dependsOn || []).every((depId) => taskMap[depId]?.status === "success");
    });

    const running = Object.values(taskMap).filter((t) => t.status === "running").length;
    const toStart = runnable.slice(0, maxConcurrency - running);

    if (toStart.length === 0) {
      const blocked = Object.values(taskMap).some((t) => t.status === "running");
      if (!blocked) break;
      await new Promise((r) => setTimeout(r, 200));
      continue;
    }

    const promises = toStart.map(async (task) => {
      taskMap[task.id].status = "running";
      const depResults = {};
      for (const depId of task.dependsOn || []) {
        if (results[depId]) depResults[depId] = results[depId];
      }
      const result = await runAgentTask(sessionId, task, depResults);
      taskMap[task.id].status = result.status === "success" ? "success" : "failed";
      if (result.status === "success") {
        results[task.id] = result.result;
      }
    });

    await Promise.all(promises);
  }

  const allSuccess = Object.values(taskMap).every((t) => t.status === "success");
  if (allSuccess) {
    await summarize(sessionId, userTask, results);
  } else {
    const failed = Object.values(taskMap).filter((t) => t.status === "failed").map((t) => t.id);
    emit(sessionId, "session_failed", { error: `Tasks failed: ${failed.join(", ")}` }, { severity: "error", summary: "任务执行失败" });
  }
}
