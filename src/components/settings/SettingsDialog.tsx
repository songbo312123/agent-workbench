import { useProviderStore } from "../../stores/providerStore";
import { ProviderList } from "./ProviderList";
import { ProviderDetail } from "./ProviderDetail";

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const selectedConfigId = useProviderStore((s) => s.selectedConfigId);
  const configs = useProviderStore((s) => s.configs);
  const selected = configs.find((c) => c.id === selectedConfigId);

  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>
        <div className="settings-body">
          <ProviderList />
          <ProviderDetail config={selected} />
        </div>
      </div>
    </div>
  );
}
