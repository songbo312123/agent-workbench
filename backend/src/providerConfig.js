import { getDb } from "./db.js";

const PRESETS = [
  ["anthropic", "Anthropic", "https://api.anthropic.com", []],
  ["openai_compatible", "OpenAI Compatible", "https://api.openai.com/v1", ["gpt-4o", "gpt-4o-mini"]],
  ["deepseek", "DeepSeek", "https://api.deepseek.com/v1", ["deepseek-chat", "deepseek-reasoner"]],
  ["kimi", "Kimi (月之暗面)", "https://api.moonshot.cn/v1", ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"]],
  ["qwen", "Qwen (通义千问)", "https://dashscope.aliyuncs.com/compatible-mode/v1", ["qwen-plus", "qwen-turbo", "qwen-max"]],
  ["zhipu", "Zhipu (智谱)", "https://open.bigmodel.cn/api/paas/v4", ["glm-4-plus", "glm-4-flash"]],
  ["baichuan", "Baichuan (百川)", "https://api.baichuan-ai.com/v1", ["Baichuan4"]],
  ["doubao", "Doubao (豆包)", "https://ark.cn-beijing.volces.com/api/v3", []],
  ["gemini", "Gemini (Google)", "https://generativelanguage.googleapis.com/v1beta/openai", ["gemini-2.5-pro", "gemini-2.5-flash"]],
];

export function seedPresets() {
  const db = getDb();
  const now = new Date().toISOString();
  const insertProvider = db.prepare(
    "INSERT OR IGNORE INTO provider_configs (id, provider_key, display_name, base_url, api_key, is_preset, enabled, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, '', 1, 1, ?, ?, ?)"
  );
  const insertModel = db.prepare(
    "INSERT OR IGNORE INTO provider_models (id, provider_config_id, model_id, display_name, is_default, enabled, sort_order) VALUES (?, ?, ?, ?, ?, 1, ?)"
  );

  for (let i = 0; i < PRESETS.length; i++) {
    const [key, name, baseUrl, models] = PRESETS[i];
    const providerId = `preset_${key}`;
    insertProvider.run(providerId, key, name, baseUrl, i, now, now);
    models.forEach((modelId, idx) => {
      insertModel.run(`${providerId}_${modelId}`, providerId, modelId, modelId, idx === 0 ? 1 : 0, idx);
    });
  }

  return listConfigs();
}

export function listConfigs() {
  const db = getDb();
  return db.prepare(
    "SELECT id, provider_key, display_name, base_url, api_key, is_preset, enabled, sort_order, created_at, updated_at FROM provider_configs ORDER BY sort_order, created_at"
  ).all().map(mapConfig);
}

export function upsertConfig(input) {
  const db = getDb();
  const now = new Date().toISOString();
  const id = input.id || `custom_${Date.now().toString(36)}`;
  const existing = db.prepare("SELECT * FROM provider_configs WHERE id = ?").get(id);

  if (existing) {
    const apiKey = input.apiKey || existing.api_key || "";
    db.prepare(
      "UPDATE provider_configs SET provider_key = ?, display_name = ?, base_url = ?, api_key = ?, enabled = ?, updated_at = ? WHERE id = ?"
    ).run(input.providerKey || existing.provider_key, input.displayName, input.baseUrl, apiKey, input.enabled === false ? 0 : 1, now, id);
  } else {
    db.prepare(
      "INSERT INTO provider_configs (id, provider_key, display_name, base_url, api_key, is_preset, enabled, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, 99, ?, ?)"
    ).run(id, input.providerKey || "custom", input.displayName, input.baseUrl, input.apiKey || "", input.enabled === false ? 0 : 1, now, now);
  }

  return mapConfig(db.prepare("SELECT * FROM provider_configs WHERE id = ?").get(id));
}

export function deleteConfig(id) {
  const db = getDb();
  db.prepare("DELETE FROM provider_models WHERE provider_config_id = ?").run(id);
  db.prepare("DELETE FROM provider_configs WHERE id = ? AND is_preset = 0").run(id);
}

export function listModels(providerConfigId) {
  const db = getDb();
  return db.prepare(
    "SELECT id, provider_config_id, model_id, display_name, is_default, enabled, sort_order FROM provider_models WHERE provider_config_id = ? ORDER BY sort_order"
  ).all(providerConfigId).map(mapModel);
}

export function upsertModel(input) {
  const db = getDb();
  const id = input.id || `model_${Date.now().toString(36)}`;
  const existing = db.prepare("SELECT * FROM provider_models WHERE id = ?").get(id);

  if (existing) {
    db.prepare("UPDATE provider_models SET model_id = ?, display_name = ?, is_default = ?, enabled = ? WHERE id = ?")
      .run(input.modelId, input.displayName, input.isDefault ? 1 : 0, input.enabled === false ? 0 : 1, id);
  } else {
    db.prepare("INSERT INTO provider_models (id, provider_config_id, model_id, display_name, is_default, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?, 99)")
      .run(id, input.providerConfigId, input.modelId, input.displayName, input.isDefault ? 1 : 0, input.enabled === false ? 0 : 1);
  }

  return mapModel(db.prepare("SELECT * FROM provider_models WHERE id = ?").get(id));
}

export function deleteModel(id) {
  getDb().prepare("DELETE FROM provider_models WHERE id = ?").run(id);
}

export function setDefaultModel(providerConfigId, modelId) {
  const db = getDb();
  db.prepare("UPDATE provider_models SET is_default = 0 WHERE provider_config_id = ?").run(providerConfigId);
  db.prepare("UPDATE provider_models SET is_default = 1 WHERE provider_config_id = ? AND model_id = ?").run(providerConfigId, modelId);
}

function mapConfig(row) {
  return {
    id: row.id,
    providerKey: row.provider_key,
    displayName: row.display_name,
    baseUrl: row.base_url,
    apiKey: mask(row.api_key || ""),
    isPreset: !!row.is_preset,
    enabled: !!row.enabled,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapModel(row) {
  return {
    id: row.id,
    providerConfigId: row.provider_config_id,
    modelId: row.model_id,
    displayName: row.display_name,
    isDefault: !!row.is_default,
    enabled: !!row.enabled,
    sortOrder: row.sort_order,
  };
}

function mask(key) {
  if (!key) return "";
  if (key.length <= 8) return "***";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
