import { useState } from "react";
import type { Task } from "../types";
import { useTaskStore } from "../stores/taskStore";

export default function TaskItem({ task }: { task: Task }) {
  const { toggleTask, deleteTask, addTask } = useTaskStore();
  const [showSubInput, setShowSubInput] = useState(false);
  const [subTitle, setSubTitle] = useState("");
  const [expanded, setExpanded] = useState(true);

  const handleAddSub = () => {
    if (subTitle.trim()) {
      addTask(subTitle.trim(), task.id);
      setSubTitle("");
      setShowSubInput(false);
    }
  };

  const completedSubs = task.subtasks?.filter((s) => s.completed).length ?? 0;
  const totalSubs = task.subtasks?.length ?? 0;

  return (
    <div className="task-card animate-slide-up">
      {/* Main task row */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => toggleTask(task.id)}
          className={`task-checkbox mt-0.5 flex-shrink-0 ${task.completed ? "checked" : ""}`}
        >
          {task.completed && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span
              className={`font-semibold text-sm ${
                task.completed
                  ? "line-through text-warm-400"
                  : "text-warm-900"
              }`}
            >
              {task.title}
            </span>
            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs text-warm-400 bg-warm-50 px-2 py-0.5 rounded-full">
                🏆 10
              </span>
            </div>
          </div>

          {/* Subtask progress */}
          {totalSubs > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-warm-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-warm-400 rounded-full transition-all duration-300"
                  style={{
                    width: `${totalSubs > 0 ? (completedSubs / totalSubs) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-xs text-warm-500">
                {completedSubs}/{totalSubs}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {totalSubs > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg hover:bg-warm-50 transition-colors"
            >
              <svg
                className={`w-4 h-4 text-warm-400 transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setShowSubInput(!showSubInput)}
            className="p-1 rounded-lg hover:bg-warm-50 transition-colors"
            title="Add subtask"
          >
            <svg className="w-4 h-4 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="p-1 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete task"
          >
            <svg className="w-4 h-4 text-warm-300 hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Subtasks */}
      {expanded && task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-3 ml-8 space-y-2">
          {task.subtasks.map((sub) => (
            <div key={sub.id} className="flex items-center gap-3 group">
              <button
                onClick={() => toggleTask(sub.id)}
                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                  transition-all duration-200 cursor-pointer ${
                    sub.completed
                      ? "bg-warm-400 border-warm-400"
                      : "border-warm-300"
                  }`}
              >
                {sub.completed && (
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <span
                className={`text-sm flex-1 ${
                  sub.completed ? "line-through text-warm-400" : "text-warm-700"
                }`}
              >
                {sub.title}
              </span>
              <span className="text-xs text-warm-300">💎 2</span>
              <button
                onClick={() => deleteTask(sub.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 transition-all"
              >
                <svg className="w-3.5 h-3.5 text-warm-300 hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add subtask input */}
      {showSubInput && (
        <div className="mt-3 ml-8 flex gap-2">
          <input
            type="text"
            value={subTitle}
            onChange={(e) => setSubTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSub()}
            placeholder="Add a sub-task..."
            className="flex-1 text-sm px-3 py-2 rounded-xl border border-warm-200
                       focus:outline-none focus:ring-2 focus:ring-warm-300 bg-warm-50
                       placeholder:text-warm-300"
            autoFocus
          />
          <button
            onClick={handleAddSub}
            className="px-3 py-2 bg-warm-100 text-warm-600 rounded-xl text-sm font-medium
                       hover:bg-warm-200 transition-colors"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
