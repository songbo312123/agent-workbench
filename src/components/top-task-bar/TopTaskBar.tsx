import { useEffect, useRef, useState } from "react";
import { useWorkbenchStore } from "../../stores/workbenchStore";
import { mockAgents } from "../../mocks/mockAgents";
import { mockEvents } from "../../mocks/mockEvents";
import { playMockEvents } from "../../mocks/mockPlayer";
import { createSession, subscribeSessionEvents } from "../../lib/backend-api";

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

  async function handleStart() {
    stopPlaybackRef.current?.();
    resetWorkbench();
    setInitialAgents(mockAgents.map((agent) => ({ ...agent })));
    setIsPlaying(true);

    try {
      const { sessionId } = await createSession(task);
      stopPlaybackRef.current = subscribeSessionEvents(
        sessionId,
        (event) => {
          addEvent(event);
          if (event.type === "session_finished" || event.type === "session_failed") {
            setIsPlaying(false);
          }
        },
        () => {
          setIsPlaying(false);
        }
      );
    } catch {
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
      <button
        type="button"
        className="btn-settings"
        onPointerDown={onSettingsClick}
        onClick={onSettingsClick}
        title="打开设置"
        aria-label="打开设置"
      >
        <span className="btn-settings-icon">⚙</span>
        <span className="btn-settings-label">设置</span>
      </button>
    </div>
  );
}
