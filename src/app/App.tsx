import { useState } from "react";
import { TopTaskBar } from "../components/top-task-bar/TopTaskBar";
import { AgentSidebar } from "../components/agent-sidebar/AgentSidebar";
import { Workbench } from "../components/workbench/Workbench";
import { InspectorPanel } from "../components/inspector/InspectorPanel";
import { TraceConsole } from "../components/trace-console/TraceConsole";
import { SettingsDialog } from "../components/settings/SettingsDialog";

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

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
