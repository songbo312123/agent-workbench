import { useProviderStore } from "../../stores/providerStore";

export function ProviderList() {
  const configs = useProviderStore((s) => s.configs);
  const selectedConfigId = useProviderStore((s) => s.selectedConfigId);
  const selectConfig = useProviderStore((s) => s.selectConfig);
  const seedPresets = useProviderStore((s) => s.seedPresets);
  const saveConfig = useProviderStore((s) => s.saveConfig);

  function handleAddCustom() {
    saveConfig({
      providerKey: "custom",
      displayName: "New Provider",
      baseUrl: "",
      apiKey: "",
    });
  }

  return (
    <div className="provider-list-panel">
      <div className="provider-list-header">
        <span>Providers</span>
        <div className="provider-list-actions">
          <button className="btn-sm" onClick={seedPresets}>Load Presets</button>
          <button className="btn-sm btn-accent" onClick={handleAddCustom}>+ Add</button>
        </div>
      </div>
      <div className="provider-list-scroll">
        {configs.map((c) => (
          <button
            key={c.id}
            className={`provider-row ${selectedConfigId === c.id ? "selected" : ""}`}
            onClick={() => selectConfig(c.id)}
          >
            <span className={`provider-status-dot ${c.apiKey ? "configured" : "empty"}`} />
            <div className="provider-row-info">
              <div className="provider-row-name">{c.displayName}</div>
              <div className="provider-row-url">{c.baseUrl || "Not configured"}</div>
            </div>
            {c.isPreset && <span className="provider-badge">Preset</span>}
          </button>
        ))}
        {configs.length === 0 && (
          <div className="provider-list-empty">
            No providers yet. Click "Load Presets" to add common providers.
          </div>
        )}
      </div>
    </div>
  );
}
