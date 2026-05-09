import { useState, useEffect } from "react";
import { useProviderStore } from "../../stores/providerStore";
import type { ProviderConfig } from "../../types/provider";
import { ModelList } from "./ModelList";

export function ProviderDetail({ config }: { config: ProviderConfig | undefined }) {
  const saveConfig = useProviderStore((s) => s.saveConfig);
  const deleteConfig = useProviderStore((s) => s.deleteConfig);
  const loadModels = useProviderStore((s) => s.loadModels);

  const [displayName, setDisplayName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (config) {
      setDisplayName(config.displayName);
      setBaseUrl(config.baseUrl);
      setApiKey("");
      setEnabled(config.enabled);
      loadModels(config.id);
    }
  }, [config]);

  if (!config) {
    return (
      <div className="provider-detail-panel">
        <div className="provider-detail-empty">Select a provider to view details</div>
      </div>
    );
  }

  function handleSave() {
    if (!config) return;
    saveConfig({
      id: config!.id,
      providerKey: config!.providerKey,
      displayName,
      baseUrl,
      apiKey: apiKey || undefined,
      enabled,
    });
  }

  function handleDelete() {
    if (!config) return;
    if (confirm(`Delete "${config!.displayName}"?`)) {
      deleteConfig(config!.id);
    }
  }

  return (
    <div className="provider-detail-panel">
      <div className="provider-detail-header">
        <h3>{config.displayName}</h3>
        <span className="provider-detail-key">{config.providerKey}</span>
      </div>

      <div className="form-group">
        <label className="form-label">Display Name</label>
        <input className="form-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Base URL</label>
        <input className="form-input" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.example.com/v1" />
      </div>

      <div className="form-group">
        <label className="form-label">API Key</label>
        <div className="form-input-with-toggle">
          <input
            className="form-input"
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={config.apiKey || "Enter API key..."}
          />
          <button className="btn-toggle-visibility" onClick={() => setShowKey(!showKey)}>
            {showKey ? "Hide" : "Show"}
          </button>
        </div>
        {config.apiKey && !apiKey && (
          <div className="form-hint">Current: {config.apiKey}</div>
        )}
      </div>

      <div className="form-group form-row">
        <label className="form-label">Enabled</label>
        <button className={`toggle-btn ${enabled ? "on" : ""}`} onClick={() => setEnabled(!enabled)}>
          {enabled ? "ON" : "OFF"}
        </button>
      </div>

      <div className="form-actions">
        <button className="btn-sm btn-accent" onClick={handleSave}>Save</button>
        {!config.isPreset && (
          <button className="btn-sm btn-danger" onClick={handleDelete}>Delete</button>
        )}
      </div>

      <div className="provider-detail-divider" />

      <ModelList providerConfigId={config.id} />
    </div>
  );
}
