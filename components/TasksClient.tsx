'use client';
import { useState, useEffect, useCallback } from 'react';
import TaskCard, { type Task } from './TaskCard';
import TaskForm from './TaskForm';

export default function TasksClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterPriority) params.set('priority', filterPriority);
    if (filterStatus) params.set('status', filterStatus);
    const res = await fetch(`/api/tasks?${params}`);
    setTasks(await res.json());
    setLoading(false);
  }, [filterPriority, filterStatus]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleCreate = async (data: Partial<Task>) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setShowForm(false);
    fetchTasks();
  };

  const handleUpdate = async (id: string, data: Partial<Task>) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setEditingTask(null);
    fetchTasks();
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    await fetch(`/api/tasks/${confirmDeleteId}`, { method: 'DELETE' });
    setConfirmDeleteId(null);
    fetchTasks();
  };

  const handleComplete = (task: Task) => {
    handleUpdate(task.id, { status: task.status === 'DONE' ? 'TODO' : 'DONE' });
  };

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'TODO').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    done: tasks.filter((t) => t.status === 'DONE').length,
    high: tasks.filter((t) => t.priority === 'HIGH' && t.status !== 'DONE').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Tasks</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {stats.done}/{stats.total} done
            {stats.high > 0 && ` · ${stats.high} high priority`}
          </p>
        </div>
        <button
          data-testid="create-task-btn"
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        <select
          data-testid="filter-priority"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select
          data-testid="filter-status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      </div>

      {/* Stats bar */}
      {tasks.length > 0 && (
        <div data-testid="stats-bar" className="flex gap-4 mb-5 text-sm text-gray-500">
          <span data-testid="stats-todo">
            <span className="font-semibold text-gray-700">{stats.todo}</span> Todo
          </span>
          <span className="text-gray-300">·</span>
          <span data-testid="stats-in-progress">
            <span className="font-semibold text-blue-600">{stats.inProgress}</span> In Progress
          </span>
          <span className="text-gray-300">·</span>
          <span data-testid="stats-done">
            <span className="font-semibold text-green-600">{stats.done}</span> Done
          </span>
        </div>
      )}

      {/* Modal */}
      {(showForm || editingTask) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-base font-semibold text-gray-800 mb-4">
              {editingTask ? 'Edit task' : 'New task'}
            </h3>
            <TaskForm
              task={editingTask ?? undefined}
              onSubmit={editingTask
                ? (data) => handleUpdate(editingTask.id, data)
                : handleCreate}
              onCancel={() => { setShowForm(false); setEditingTask(null); }}
            />
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div data-testid="confirm-dialog" className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Delete task?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                data-testid="confirm-cancel-btn"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                data-testid="confirm-delete-btn"
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
      ) : tasks.length === 0 ? (
        <div data-testid="empty-state" className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">{filterPriority || filterStatus ? '🔍' : '✓'}</p>
          <p data-testid="empty-state-message" className="text-sm">
            {filterPriority && filterStatus
              ? `No ${filterPriority} priority tasks with status ${filterStatus.replace('_', ' ')}`
              : filterPriority
              ? `No ${filterPriority} priority tasks`
              : filterStatus
              ? `No ${filterStatus.replace('_', ' ')} tasks`
              : 'No tasks yet. Create your first one!'}
          </p>
        </div>
      ) : (
        <div data-testid="task-list" className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={handleComplete}
              onEdit={() => setEditingTask(task)}
              onDelete={() => handleDelete(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
