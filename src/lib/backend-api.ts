import type { ProviderConfig, ProviderConfigInput, ProviderModel, ProviderModelInput, TraceEvent } from "../types";

export const BACKEND_BASE_URL = "http://127.0.0.1:8787";

export const backendProviderApi = {
  async listConfigs(): Promise<ProviderConfig[]> {
    const res = await fetch(`${BACKEND_BASE_URL}/api/provider-configs`);
    return (await res.json()).items;
  },

  async seedPresets(): Promise<ProviderConfig[]> {
    const res = await fetch(`${BACKEND_BASE_URL}/api/provider-configs/seed`, { method: "POST" });
    return (await res.json()).items;
  },

  async upsertConfig(input: ProviderConfigInput): Promise<ProviderConfig> {
    const res = await fetch(`${BACKEND_BASE_URL}/api/provider-configs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.json();
  },

  async deleteConfig(id: string): Promise<void> {
    await fetch(`${BACKEND_BASE_URL}/api/provider-configs/${id}`, { method: "DELETE" });
  },

  async listModels(providerConfigId: string): Promise<ProviderModel[]> {
    const res = await fetch(`${BACKEND_BASE_URL}/api/provider-configs/${providerConfigId}/models`);
    return (await res.json()).items;
  },

  async upsertModel(input: ProviderModelInput): Promise<ProviderModel> {
    const res = await fetch(`${BACKEND_BASE_URL}/api/provider-models`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.json();
  },

  async deleteModel(id: string): Promise<void> {
    await fetch(`${BACKEND_BASE_URL}/api/provider-models/${id}`, { method: "DELETE" });
  },

  async setDefaultModel(providerConfigId: string, modelId: string): Promise<void> {
    await fetch(`${BACKEND_BASE_URL}/api/provider-configs/${providerConfigId}/default-model`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId }),
    });
  },
};

export async function createSession(userTask: string): Promise<{ sessionId: string; status: string }> {
  const res = await fetch(`${BACKEND_BASE_URL}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userTask }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function subscribeSessionEvents(
  sessionId: string,
  onEvent: (event: TraceEvent) => void,
  onError?: (error: Event) => void
): () => void {
  const source = new EventSource(`${BACKEND_BASE_URL}/api/sessions/${sessionId}/events/stream`);
  source.addEventListener("agent_event", (message) => {
    onEvent(JSON.parse((message as MessageEvent).data));
  });
  source.onerror = (event) => {
    onError?.(event);
  };
  return () => source.close();
}
