import { createPortal } from "react-dom";
import { useEffect } from "react";
import { useProviderStore } from "../../stores/providerStore";
import { ProviderList } from "./ProviderList";
import { ProviderDetail } from "./ProviderDetail";

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const selectedConfigId = useProviderStore((s) => s.selectedConfigId);
  const configs = useProviderStore((s) => s.configs);
  const loading = useProviderStore((s) => s.loading);
  const error = useProviderStore((s) => s.error);
  const loadConfigs = useProviderStore((s) => s.loadConfigs);
  const selected = configs.find((c) => c.id === selectedConfigId);

  useEffect(() => {
    if (open && configs.length === 0 && !loading) {
      loadConfigs();
    }
  }, [open, configs.length, loading, loadConfigs]);

  if (!open) return null;

  const dialog = (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="settings-error">{error}</div>}
        <div className="settings-body">
          <ProviderList />
          <ProviderDetail config={selected} />
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
