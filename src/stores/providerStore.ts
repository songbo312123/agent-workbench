import { create } from "zustand";
import type { ProviderConfig, ProviderConfigInput, ProviderModel, ProviderModelInput } from "../types/provider";
import { providerApi } from "../lib/tauri-ipc";

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
      const configs = await providerApi.listConfigs<ProviderConfig>();
      set({ configs, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  seedPresets: async () => {
    set({ loading: true, error: null });
    try {
      const configs = await providerApi.seedPresets<ProviderConfig>();
      set({ configs, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  selectConfig: (id) => set({ selectedConfigId: id }),

  saveConfig: async (input) => {
    set({ loading: true, error: null });
    try {
      await providerApi.upsertConfig<ProviderConfig>(input as Record<string, unknown>);
      await get().loadConfigs();
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  deleteConfig: async (id) => {
    set({ loading: true, error: null });
    try {
      await providerApi.deleteConfig(id);
      const { selectedConfigId } = get();
      if (selectedConfigId === id) set({ selectedConfigId: null });
      await get().loadConfigs();
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  loadModels: async (providerConfigId) => {
    try {
      const models = await providerApi.listModels<ProviderModel>(providerConfigId);
      set((s) => ({
        modelsByProvider: { ...s.modelsByProvider, [providerConfigId]: models },
      }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  saveModel: async (input) => {
    try {
      await providerApi.upsertModel<ProviderModel>(input as Record<string, unknown>);
      await get().loadModels(input.providerConfigId);
    } catch (e) {
      set({ error: String(e) });
    }
  },

  deleteModel: async (id, providerConfigId) => {
    try {
      await providerApi.deleteModel(id);
      await get().loadModels(providerConfigId);
    } catch (e) {
      set({ error: String(e) });
    }
  },

  setDefaultModel: async (providerConfigId, modelId) => {
    try {
      await providerApi.setDefaultModel(providerConfigId, modelId);
      await get().loadModels(providerConfigId);
    } catch (e) {
      set({ error: String(e) });
    }
  },
}));
