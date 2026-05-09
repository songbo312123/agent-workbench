import { getDb } from "./db.js";

export function getProviderWithKey(providerConfigId) {
  const db = getDb();
  const row = db.prepare(
    "SELECT id, provider_key, display_name, base_url, api_key, is_preset, enabled FROM provider_configs WHERE id = ? AND enabled = 1"
  ).get(providerConfigId);

  if (!row) return null;

  const models = db.prepare(
    "SELECT model_id, display_name, is_default FROM provider_models WHERE provider_config_id = ? AND enabled = 1 ORDER BY sort_order"
  ).all(providerConfigId);

  return {
    id: row.id,
    providerKey: row.provider_key,
    displayName: row.display_name,
    baseUrl: row.base_url,
    apiKey: row.api_key,
    isPreset: !!row.is_preset,
    models,
    defaultModel: models.find((m) => m.is_default)?.model_id || models[0]?.model_id || "gpt-4o",
  };
}

export function getFirstActiveProvider() {
  const db = getDb();
  const row = db.prepare(
    "SELECT id FROM provider_configs WHERE enabled = 1 AND api_key != '' ORDER BY sort_order LIMIT 1"
  ).get();
  return row ? getProviderWithKey(row.id) : null;
}

export async function callOpenAI(provider, messages, tools, opts = {}) {
  const url = provider.baseUrl.replace(/\/+$/, "") + "/chat/completions";
  const model = opts.model || provider.defaultModel;

  const body = {
    model,
    messages,
    stream: true,
    max_tokens: opts.maxTokens || 8192,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  if (opts.response_format) {
    body.response_format = opts.response_format;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }

  return res;
}

export async function callOpenAIJson(provider, messages, opts = {}) {
  const url = provider.baseUrl.replace(/\/+$/, "") + "/chat/completions";
  const model = opts.model || provider.defaultModel;

  const body = {
    model,
    messages,
    max_tokens: opts.maxTokens || 4096,
    response_format: { type: "json_object" },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(content);
}
