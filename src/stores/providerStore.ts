import { create } from "zustand";
import type { ProviderConfig, ProviderConfigInput, ProviderModel, ProviderModelInput } from "../types/provider";
import { backendProviderApi } from "../lib/backend-api";

export type ProviderStoreState = {
  configs: ProviderConfig[];
  modelsByProvider: Record<string, ProviderModel[]>;
  selectedConfigId: string | null;
  loading: boolean;
  error: string | null;

  loadConfigs: () => Promise<void>;
  seedPresets: () => Promise<void>;
  selectConfig: (id: string | null) => void;
  saveConfig: (input: ProviderConfigInput) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
  loadModels: (providerConfigId: string) => Promise<void>;
  saveModel: (input: ProviderModelInput) => Promise<void>;
  deleteModel: (id: string, providerConfigId: string) => Promise<void>;
  setDefaultModel: (providerConfigId: string, modelId: string) => Promise<void>;
};

export const useProviderStore = create<ProviderStoreState>((set, get) => ({
  configs: [],
  modelsByProvider: {},
  selectedConfigId: null,
  loading: false,
  error: null,

  loadConfigs: async () => {
    set({ loading: true, error: null });
    try {
      const configs = await api().listConfigs();
      set({ configs, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  seedPresets: async () => {
    set({ loading: true, error: null });
    try {
      const configs = await api().seedPresets();
      set({ configs, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  selectConfig: (id) => set({ selectedConfigId: id }),

  saveConfig: async (input) => {
    set({ loading: true, error: null });
    try {
      await api().upsertConfig(input);
      await get().loadConfigs();
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  deleteConfig: async (id) => {
    set({ loading: true, error: null });
    try {
      await api().deleteConfig(id);
      const { selectedConfigId } = get();
      if (selectedConfigId === id) set({ selectedConfigId: null });
      await get().loadConfigs();
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  loadModels: async (providerConfigId) => {
    try {
      const models = await api().listModels(providerConfigId);
      set((s) => ({
        modelsByProvider: { ...s.modelsByProvider, [providerConfigId]: models },
      }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  saveModel: async (input) => {
    try {
      await api().upsertModel(input);
      await get().loadModels(input.providerConfigId);
    } catch (e) {
      set({ error: String(e) });
    }
  },

  deleteModel: async (id, providerConfigId) => {
    try {
      await api().deleteModel(id);
      await get().loadModels(providerConfigId);
    } catch (e) {
      set({ error: String(e) });
    }
  },

  setDefaultModel: async (providerConfigId, modelId) => {
    try {
      await api().setDefaultModel(providerConfigId, modelId);
      await get().loadModels(providerConfigId);
    } catch (e) {
      set({ error: String(e) });
    }
  },
}));

function api() {
  return backendProviderApi;
}
