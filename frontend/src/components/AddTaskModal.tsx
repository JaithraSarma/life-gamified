import { useState } from "react";
import { useTaskStore } from "../stores/taskStore";

export default function AddTaskModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const { addTask } = useTaskStore();

  if (!open) return null;

  const handleSubmit = () => {
    if (title.trim()) {
      addTask(title.trim());
      setTitle("");
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-warm-800 mb-4">New Task</h2>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="What do you need to do?"
          className="w-full px-4 py-3 rounded-xl border border-warm-200
                     focus:outline-none focus:ring-2 focus:ring-warm-300
                     bg-warm-50 text-warm-900 placeholder:text-warm-300"
          autoFocus
        />

        <p className="text-xs text-warm-400 mt-2 ml-1">
          🏆 Complete this to earn <strong>10 gems</strong>
        </p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-warm-200
                       text-warm-600 font-medium hover:bg-warm-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 px-4 py-3 rounded-xl bg-warm-500 text-white font-semibold
                       hover:bg-warm-600 transition-colors disabled:opacity-40
                       disabled:cursor-not-allowed"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
}
