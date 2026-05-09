import { useEffect, useState } from "react";
import { TopTaskBar } from "../components/top-task-bar/TopTaskBar";
import { AgentSidebar } from "../components/agent-sidebar/AgentSidebar";
import { Workbench } from "../components/workbench/Workbench";
import { InspectorPanel } from "../components/inspector/InspectorPanel";
import { TraceConsole } from "../components/trace-console/TraceConsole";
import { SettingsDialog } from "../components/settings/SettingsDialog";
import { isTauriRuntime } from "../lib/tauri-ipc";
import { useWorkbenchStore } from "../stores/workbenchStore";
import { mockAgents } from "../mocks/mockAgents";

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(() => !isTauriRuntime());
  const setInitialAgents = useWorkbenchStore((s) => s.setInitialAgents);

  useEffect(() => {
    setInitialAgents(mockAgents.map((agent) => ({ ...agent })));
  }, [setInitialAgents]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMetaOrCtrl = event.metaKey || event.ctrlKey;
      if (isMetaOrCtrl && event.key === ",") {
        event.preventDefault();
        setSettingsOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="app-shell">
      <TopTaskBar onSettingsClick={() => setSettingsOpen(true)} />
      <div className="main-layout">
        <AgentSidebar />
        <Workbench />
        <InspectorPanel />
      </div>
      <TraceConsole />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
