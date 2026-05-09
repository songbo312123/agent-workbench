import type { ProviderConfig, ProviderModel } from "../types/provider";

type Invoke = typeof import("@tauri-apps/api/core").invoke;

let _invoke: Invoke | null = null;

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function getInvoke(): Promise<Invoke | null> {
  if (!isTauriRuntime()) {
    return null;
  }
  if (!_invoke) {
    try {
      const mod = await import("@tauri-apps/api/core");
      _invoke = mod.invoke;
    } catch {
      return null;
    }
  }
  return _invoke;
}

async function invokeOrLocal<T>(
  command: string,
  args: Record<string, unknown> | undefined,
  local: () => T
): Promise<T> {
  const invoke = await getInvoke();
  if (invoke) {
    return invoke<T>(command, args);
  }
  return local();
}

export const providerApi = {
  listConfigs: async <T>() =>
    invokeOrLocal<T[]>("list_provider_configs", undefined, () => localProviderApi.listConfigs() as T[]),
  getConfig: async <T>(id: string) =>
    invokeOrLocal<T>("get_provider_config", { id }, () => localProviderApi.getConfig(id) as T),
  upsertConfig: async <T>(input: Record<string, unknown>) =>
    invokeOrLocal<T>("upsert_provider_config", { input }, () => localProviderApi.upsertConfig(input) as T),
  deleteConfig: async (id: string) =>
    invokeOrLocal("delete_provider_config", { id }, () => localProviderApi.deleteConfig(id)),
  seedPresets: async <T>() =>
    invokeOrLocal<T[]>("seed_preset_providers", undefined, () => localProviderApi.seedPresets() as T[]),
  listModels: async <T>(providerConfigId: string) =>
    invokeOrLocal<T[]>("list_provider_models", { providerConfigId }, () => localProviderApi.listModels(providerConfigId) as T[]),
  upsertModel: async <T>(input: Record<string, unknown>) =>
    invokeOrLocal<T>("upsert_provider_model", { input }, () => localProviderApi.upsertModel(input) as T),
  deleteModel: async (id: string) =>
    invokeOrLocal("delete_provider_model", { id }, () => localProviderApi.deleteModel(id)),
  setDefaultModel: async (providerConfigId: string, modelId: string) =>
    invokeOrLocal("set_default_model", { providerConfigId, modelId }, () => localProviderApi.setDefaultModel(providerConfigId, modelId)),
};

type LocalProviderState = {
  configs: ProviderConfig[];
  modelsByProvider: Record<string, ProviderModel[]>;
};

const LOCAL_STATE_KEY = "agent-workbench.provider-state.v1";

const PRESET_PROVIDERS = [
  ["anthropic", "Anthropic", "https://api.anthropic.com"],
  ["openai_compatible", "OpenAI Compatible", "https://api.openai.com/v1"],
  ["deepseek", "DeepSeek", "https://api.deepseek.com/v1"],
  ["kimi", "Kimi (月之暗面)", "https://api.moonshot.cn/v1"],
  ["qwen", "Qwen (通义千问)", "https://dashscope.aliyuncs.com/compatible-mode/v1"],
  ["zhipu", "Zhipu (智谱)", "https://open.bigmodel.cn/api/paas/v4"],
  ["baichuan", "Baichuan (百川)", "https://api.baichuan-ai.com/v1"],
  ["doubao", "Doubao (豆包)", "https://ark.cn-beijing.volces.com/api/v3"],
  ["gemini", "Gemini (Google)", "https://generativelanguage.googleapis.com/v1beta/openai"],
] as const;

const localProviderApi = {
  listConfigs(): ProviderConfig[] {
    return readLocalState().configs.sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getConfig(id: string): ProviderConfig {
    const config = readLocalState().configs.find((item) => item.id === id);
    if (!config) throw new Error(`Provider config not found: ${id}`);
    return config;
  },

  upsertConfig(input: Record<string, unknown>): ProviderConfig {
    const state = readLocalState();
    const id = stringValue(input.id) || makeId("custom");
    const existing = state.configs.find((item) => item.id === id);
    const now = nowIso();
    const apiKey = stringValue(input.apiKey);
    const next: ProviderConfig = {
      id,
      providerKey: stringValue(input.providerKey) || existing?.providerKey || "custom",
      displayName: stringValue(input.displayName) || existing?.displayName || "New Provider",
      baseUrl: stringValue(input.baseUrl) ?? existing?.baseUrl ?? "",
      apiKey: apiKey ? maskKey(apiKey) : existing?.apiKey ?? "",
      isPreset: existing?.isPreset ?? false,
      enabled: booleanValue(input.enabled, existing?.enabled ?? true),
      sortOrder: existing?.sortOrder ?? 99,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    state.configs = existing
      ? state.configs.map((item) => (item.id === id ? next : item))
      : [...state.configs, next];
    writeLocalState(state);
    return next;
  },

  deleteConfig(id: string): void {
    const state = readLocalState();
    state.configs = state.configs.filter((item) => item.id !== id);
    delete state.modelsByProvider[id];
    writeLocalState(state);
  },

  seedPresets(): ProviderConfig[] {
    const state = readLocalState();
    const now = nowIso();
    for (const [providerKey, displayName, baseUrl] of PRESET_PROVIDERS) {
      const id = `preset_${providerKey}`;
      if (state.configs.some((item) => item.id === id)) continue;
      state.configs.push({
        id,
        providerKey,
        displayName,
        baseUrl,
        apiKey: "",
        isPreset: true,
        enabled: true,
        sortOrder: state.configs.length,
        createdAt: now,
        updatedAt: now,
      });
    }
    writeLocalState(state);
    return this.listConfigs();
  },

  listModels(providerConfigId: string): ProviderModel[] {
    return readLocalState().modelsByProvider[providerConfigId] ?? [];
  },

  upsertModel(input: Record<string, unknown>): ProviderModel {
    const state = readLocalState();
    const providerConfigId = stringValue(input.providerConfigId);
    if (!providerConfigId) throw new Error("providerConfigId is required");
    const id = stringValue(input.id) || makeId("model");
    const existing = state.modelsByProvider[providerConfigId]?.find((item) => item.id === id);
    const models = state.modelsByProvider[providerConfigId] ?? [];
    const next: ProviderModel = {
      id,
      providerConfigId,
      modelId: stringValue(input.modelId) || existing?.modelId || "",
      displayName: stringValue(input.displayName) || existing?.displayName || stringValue(input.modelId) || "",
      isDefault: booleanValue(input.isDefault, existing?.isDefault ?? false),
      enabled: booleanValue(input.enabled, existing?.enabled ?? true),
      sortOrder: existing?.sortOrder ?? 99,
    };
    state.modelsByProvider[providerConfigId] = existing
      ? models.map((item) => (item.id === id ? next : item))
      : [...models, next];
    writeLocalState(state);
    return next;
  },

  deleteModel(id: string): void {
    const state = readLocalState();
    for (const providerConfigId of Object.keys(state.modelsByProvider)) {
      state.modelsByProvider[providerConfigId] = state.modelsByProvider[providerConfigId].filter((item) => item.id !== id);
    }
    writeLocalState(state);
  },

  setDefaultModel(providerConfigId: string, modelId: string): void {
    const state = readLocalState();
    state.modelsByProvider[providerConfigId] = (state.modelsByProvider[providerConfigId] ?? []).map((item) => ({
      ...item,
      isDefault: item.modelId === modelId,
    }));
    writeLocalState(state);
  },
};

function readLocalState(): LocalProviderState {
  const raw = window.localStorage.getItem(LOCAL_STATE_KEY);
  if (!raw) return { configs: [], modelsByProvider: {} };
  try {
    return JSON.parse(raw) as LocalProviderState;
  } catch {
    return { configs: [], modelsByProvider: {} };
  }
}

function writeLocalState(state: LocalProviderState): void {
  window.localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function maskKey(key: string): string {
  if (key.length <= 8) return "***";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}
