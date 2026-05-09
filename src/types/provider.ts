export type ProviderConfig = {
  id: string;
  providerKey: string;
  displayName: string;
  baseUrl: string;
  apiKey: string;
  isPreset: boolean;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProviderConfigInput = {
  id?: string;
  providerKey: string;
  displayName: string;
  baseUrl: string;
  apiKey?: string;
  enabled?: boolean;
};

export type ProviderModel = {
  id: string;
  providerConfigId: string;
  modelId: string;
  displayName: string;
  isDefault: boolean;
  enabled: boolean;
  sortOrder: number;
};

export type ProviderModelInput = {
  id?: string;
  providerConfigId: string;
  modelId: string;
  displayName: string;
  isDefault?: boolean;
  enabled?: boolean;
};
