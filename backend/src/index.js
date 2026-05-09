import express from "express";
import cors from "cors";
import { join } from "path";
import { tmpdir } from "os";
import { initDb } from "./db.js";
import { getHistory, addListener } from "./events.js";
import { createPlan } from "./orchestrator.js";
import { runSession } from "./scheduler.js";
import {
  seedPresets,
  listConfigs,
  upsertConfig,
  deleteConfig,
  listModels,
  upsertModel,
  deleteModel,
  setDefaultModel,
} from "./providerConfig.js";

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json());

const dbPath = process.env.AGENT_WORKBENCH_DB || join(tmpdir(), "agent-workbench.db");
initDb(dbPath);
console.log(`SQLite initialized at ${dbPath}`);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// ── Provider Configs ──

app.get("/api/provider-configs", (_req, res) => {
  res.json({ items: listConfigs() });
});

app.post("/api/provider-configs/seed", (_req, res) => {
  res.json({ items: seedPresets() });
});

app.post("/api/provider-configs", (req, res) => {
  res.json(upsertConfig(req.body));
});

app.delete("/api/provider-configs/:id", (req, res) => {
  deleteConfig(req.params.id);
  res.json({ ok: true });
});

app.get("/api/provider-configs/:id/models", (req, res) => {
  res.json({ items: listModels(req.params.id) });
});

app.post("/api/provider-models", (req, res) => {
  res.json(upsertModel(req.body));
});

app.delete("/api/provider-models/:id", (req, res) => {
  deleteModel(req.params.id);
  res.json({ ok: true });
});

app.post("/api/provider-configs/:id/default-model", (req, res) => {
  setDefaultModel(req.params.id, req.body.modelId);
  res.json({ ok: true });
});

// ── Sessions ──

app.post("/api/sessions", async (req, res) => {
  const { userTask } = req.body;
  if (!userTask) {
    res.status(400).json({ error: "userTask is required" });
    return;
  }

  const sessionId = makeId("ses");
  res.json({ sessionId, status: "planning" });

  queueMicrotask(async () => {
    try {
      const plan = await createPlan(sessionId, userTask);
      await runSession(sessionId, plan, userTask);
    } catch (error) {
      console.error(`Session ${sessionId} failed`, error);
    }
  });
});

app.get("/api/sessions/:sessionId/events", (req, res) => {
  res.json({ items: getHistory(req.params.sessionId) });
});

app.get("/api/sessions/:sessionId/events/stream", (req, res) => {
  const { sessionId } = req.params;
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const history = getHistory(sessionId);
  for (const event of history) {
    res.write(`event: agent_event\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  const unsubscribe = addListener(sessionId, (event) => {
    res.write(`event: agent_event\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\n`);
    res.write(`data: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

app.listen(port, () => {
  console.log(`Agent Workbench backend running on http://127.0.0.1:${port}`);
});

function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
