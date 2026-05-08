import { TopTaskBar } from "../components/top-task-bar/TopTaskBar";
import { AgentSidebar } from "../components/agent-sidebar/AgentSidebar";
import { Workbench } from "../components/workbench/Workbench";
import { InspectorPanel } from "../components/inspector/InspectorPanel";
import { TraceConsole } from "../components/trace-console/TraceConsole";

export default function App() {
  return (
    <div className="app-shell">
      <TopTaskBar />
      <div className="main-layout">
        <AgentSidebar />
        <Workbench />
        <InspectorPanel />
      </div>
      <TraceConsole />
    </div>
  );
}
