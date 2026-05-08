import { useWorkbenchStore } from "../../stores/workbenchStore";
import { LaneView } from "./LaneView";

export function Workbench() {
  const activeView = useWorkbenchStore((s) => s.activeView);
  const setActiveView = useWorkbenchStore((s) => s.setActiveView);

  return (
    <main className="workbench panel">
      <div className="workbench-tabs">
        <button
          className={activeView === "lane" ? "active" : ""}
          onClick={() => setActiveView("lane")}
        >
          并行泳道
        </button>
        <button
          className={activeView === "graph" ? "active" : ""}
          onClick={() => setActiveView("graph")}
        >
          任务图
        </button>
        <button
          className={activeView === "replay" ? "active" : ""}
          onClick={() => setActiveView("replay")}
        >
          回放
        </button>
      </div>
      {activeView === "lane" && <LaneView />}
    </main>
  );
}
