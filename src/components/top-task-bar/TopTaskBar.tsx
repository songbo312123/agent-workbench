import { useEffect, useRef, useState } from "react";
import { useWorkbenchStore } from "../../stores/workbenchStore";
import { mockAgents } from "../../mocks/mockAgents";
import { mockEvents } from "../../mocks/mockEvents";
import { playMockEvents } from "../../mocks/mockPlayer";

export function TopTaskBar({ onSettingsClick }: { onSettingsClick: () => void }) {
  const [task, setTask] = useState(
    "调研 AI 桌面智能体的发展趋势，并输出一份分析报告。"
  );
  const resetWorkbench = useWorkbenchStore((s) => s.resetWorkbench);
  const setInitialAgents = useWorkbenchStore((s) => s.setInitialAgents);
  const addEvent = useWorkbenchStore((s) => s.addEvent);
  const isPlaying = useWorkbenchStore((s) => s.isPlaying);
  const setIsPlaying = useWorkbenchStore((s) => s.setIsPlaying);
  const session = useWorkbenchStore((s) => s.session);
  const stopPlaybackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      stopPlaybackRef.current?.();
    };
  }, []);

  function handleStart() {
    stopPlaybackRef.current?.();
    resetWorkbench();
    setInitialAgents(mockAgents.map((a) => ({ ...a })));
    setIsPlaying(true);

    stopPlaybackRef.current = playMockEvents(
      mockEvents,
      (event) => {
        addEvent(event);
      },
      () => {
        setIsPlaying(false);
        stopPlaybackRef.current = null;
      }
    );
  }

  return (
    <div className="top-task-bar">
      <input
        className="task-input"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        placeholder="输入任务……"
        disabled={isPlaying}
      />
      <button className="btn-start" onClick={handleStart} disabled={isPlaying}>
        {session ? "重新执行" : "开始执行"}
      </button>
      {session && (
        <span className="session-status">
          {session.status === "completed" ? "已完成" : `状态：${session.status}`}
        </span>
      )}
      <button className="btn-settings" onClick={onSettingsClick} title="API Settings">
        ⚙
      </button>
    </div>
  );
}
