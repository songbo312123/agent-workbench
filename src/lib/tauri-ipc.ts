type Invoke = typeof import("@tauri-apps/api/core").invoke;

let _invoke: Invoke | null = null;

async function getInvoke(): Promise<Invoke> {
  if (!_invoke) {
    try {
      const mod = await import("@tauri-apps/api/core");
      _invoke = mod.invoke;
    } catch {
      _invoke = () => Promise.reject(new Error("Tauri API not available"));
    }
  }
  return _invoke;
}

export const providerApi = {
  listConfigs: async <T>() => (await getInvoke())<T[]>("list_provider_configs"),
  getConfig: async <T>(id: string) => (await getInvoke())<T>("get_provider_config", { id }),
  upsertConfig: async <T>(input: Record<string, unknown>) => (await getInvoke())<T>("upsert_provider_config", { input }),
  deleteConfig: async (id: string) => (await getInvoke())("delete_provider_config", { id }),
  seedPresets: async <T>() => (await getInvoke())<T[]>("seed_preset_providers"),
  listModels: async <T>(providerConfigId: string) => (await getInvoke())<T[]>("list_provider_models", { providerConfigId }),
  upsertModel: async <T>(input: Record<string, unknown>) => (await getInvoke())<T>("upsert_provider_model", { input }),
  deleteModel: async (id: string) => (await getInvoke())("delete_provider_model", { id }),
  setDefaultModel: async (providerConfigId: string, modelId: string) =>
    (await getInvoke())("set_default_model", { providerConfigId, modelId }),
};
