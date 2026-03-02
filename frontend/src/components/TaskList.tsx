import { useTaskStore } from "../stores/taskStore";
import TaskItem from "./TaskItem";

export default function TaskList() {
  const { tasks, loading } = useTaskStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-warm-300 border-t-warm-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🎯</p>
        <h3 className="text-lg font-bold text-warm-700 mb-1">No tasks yet</h3>
        <p className="text-sm text-warm-400">
          Add your first task and start earning gems!
        </p>
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-3">
      {activeTasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}

      {completedTasks.length > 0 && (
        <>
          <div className="flex items-center gap-3 pt-4">
            <div className="flex-1 h-px bg-warm-200" />
            <span className="text-xs font-medium text-warm-400 uppercase tracking-wider">
              Completed ({completedTasks.length})
            </span>
            <div className="flex-1 h-px bg-warm-200" />
          </div>
          {completedTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </>
      )}
    </div>
  );
}
