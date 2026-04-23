export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  dueDate?: string | null;
  createdAt: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: 'bg-red-50 text-red-600 border-red-100',
  MEDIUM: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  LOW: 'bg-green-50 text-green-600 border-green-100',
};

const STATUS_STYLES: Record<string, string> = {
  TODO: 'bg-gray-50 text-gray-500 border-gray-100',
  IN_PROGRESS: 'bg-blue-50 text-blue-600 border-blue-100',
  DONE: 'bg-green-50 text-green-600 border-green-100',
};

interface TaskCardProps {
  task: Task;
  onComplete: (task: Task) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TaskCard({ task, onComplete, onEdit, onDelete }: TaskCardProps) {
  const isDone = task.status === 'DONE';
  const isOverdue = !isDone && !!task.dueDate && new Date(task.dueDate) < new Date();
  const dueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div
      data-testid="task-card"
      className={`bg-white rounded-xl p-4 border shadow-sm transition-opacity ${isDone ? 'opacity-60' : ''} ${isOverdue ? 'border-red-300' : 'border-gray-100'}`}
    >
      <div className="flex items-start gap-3">
        <button
          data-testid="task-complete-btn"
          onClick={() => onComplete(task)}
          title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
            isDone ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-blue-400'
          }`}
        />

        <div className="flex-1 min-w-0">
          <p
            data-testid="task-title"
            className={`font-medium text-sm ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${PRIORITY_STYLES[task.priority] ?? 'bg-gray-50 text-gray-500'}`}>
              {task.priority}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_STYLES[task.status] ?? 'bg-gray-50 text-gray-500'}`}>
              {task.status.replace('_', ' ')}
            </span>
            {dueDate && <span className="text-xs text-gray-400">Due {dueDate}</span>}
            {isOverdue && (
              <span data-testid="overdue-badge" className="text-xs px-2 py-0.5 rounded-full font-medium border bg-red-50 text-red-600 border-red-200">
                Overdue
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3 flex-shrink-0">
          <button
            data-testid="task-edit-btn"
            onClick={onEdit}
            className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
          >
            Edit
          </button>
          <button
            data-testid="task-delete-btn"
            onClick={onDelete}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
