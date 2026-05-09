import { useState } from "react";
import { useProviderStore } from "../../stores/providerStore";
import type { ProviderModel } from "../../types/provider";

const EMPTY_MODELS: ProviderModel[] = [];

export function ModelList({ providerConfigId }: { providerConfigId: string }) {
  const models = useProviderStore((s) => s.modelsByProvider[providerConfigId] ?? EMPTY_MODELS);
  const saveModel = useProviderStore((s) => s.saveModel);
  const deleteModel = useProviderStore((s) => s.deleteModel);
  const setDefaultModel = useProviderStore((s) => s.setDefaultModel);

  const [newModelId, setNewModelId] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [adding, setAdding] = useState(false);

  function handleAdd() {
    if (!newModelId.trim()) return;
    saveModel({
      providerConfigId,
      modelId: newModelId.trim(),
      displayName: newDisplayName.trim() || newModelId.trim(),
    }).then(() => {
      setNewModelId("");
      setNewDisplayName("");
      setAdding(false);
    });
  }

  return (
    <div className="model-list">
      <div className="model-list-header">
        <span className="form-label">Models</span>
        <button className="btn-sm" onClick={() => setAdding(true)}>+ Add</button>
      </div>

      {adding && (
        <div className="model-add-row">
          <input className="form-input form-input-sm" placeholder="Model ID" value={newModelId} onChange={(e) => setNewModelId(e.target.value)} />
          <input className="form-input form-input-sm" placeholder="Display Name" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} />
          <button className="btn-sm btn-accent" onClick={handleAdd}>Add</button>
          <button className="btn-sm" onClick={() => setAdding(false)}>Cancel</button>
        </div>
      )}

      {models.map((m) => (
        <div key={m.id} className="model-row">
          <span className={`model-default ${m.isDefault ? "active" : ""}`} onClick={() => setDefaultModel(providerConfigId, m.modelId)}>
            {m.isDefault ? "★" : "☆"}
          </span>
          <div className="model-row-info">
            <span className="model-id">{m.modelId}</span>
            <span className="model-display-name">{m.displayName}</span>
          </div>
          <button className="btn-sm btn-danger" onClick={() => deleteModel(m.id, providerConfigId)}>×</button>
        </div>
      ))}

      {models.length === 0 && !adding && (
        <div className="model-list-empty">No models configured. Click "+ Add" to add one.</div>
      )}
    </div>
  );
}
