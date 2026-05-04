'use client';

import { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  MessageSquare,
  Loader2,
  Trash2,
  Edit3,
  Save,
  X,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { getInboxTasks, addTaskToInbox, completeInboxTask, deleteInboxTask, editInboxTask } from '../actions';

export default function InboxPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const data = await getInboxTasks();
    setTasks(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newTask.trim()) return;
    setSubmitting(true);
    const result = await addTaskToInbox(newTask);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Task added to inbox");
      setNewTask("");
      await fetchTasks();
    }
    setSubmitting(false);
  };

  const handleComplete = async (taskText: string) => {
    setActionLoading(`complete-${taskText}`);
    const result = await completeInboxTask(taskText);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Task completed");
      await fetchTasks();
    }
    setActionLoading(null);
  };

  const handleDelete = async (taskText: string) => {
    setActionLoading(`delete-${taskText}`);
    const result = await deleteInboxTask(taskText);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Task deleted");
      await fetchTasks();
    }
    setActionLoading(null);
  };

  const startEditing = (task: any) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const handleEdit = async (oldText: string) => {
    if (!editText.trim()) return;
    setActionLoading(`edit-${oldText}`);
    const result = await editInboxTask(oldText, editText);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Task updated");
      setEditingId(null);
      await fetchTasks();
    }
    setActionLoading(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, taskText?: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (taskText) {
        handleEdit(taskText);
      } else {
        handleSubmit();
      }
    }
    if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const pendingTasks = tasks.filter(t => !t.isCompleted);
  const completedTasks = tasks.filter(t => t.isCompleted);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Inbox</h1>
          <p className="text-white/60 mt-2">Manage tasks for OpenClaw to pick up during heartbeat cycles.</p>
        </div>
        <button 
          onClick={fetchTasks}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Task List */}
        <div className="lg:col-span-2 space-y-4">
          
          {loading && tasks.length === 0 ? (
            <div className="glass-panel p-8 text-center text-white/50">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading tasks from EC2...
            </div>
          ) : tasks.length === 0 ? (
             <div className="glass-panel p-8 text-center text-white/50">Inbox is empty. Add a task to get started!</div>
          ) : (
            <>
              {pendingTasks.map(task => (
                <div key={task.id} className="glass-panel p-4 flex items-start gap-4 hover:border-white/20 transition-colors group">
                  <button 
                    onClick={() => handleComplete(task.text)}
                    disabled={actionLoading === `complete-${task.text}`}
                    className="mt-1 text-white/30 hover:text-green-400 transition-colors disabled:opacity-50"
                    title="Mark as complete"
                  >
                    {actionLoading === `complete-${task.text}` 
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : <Circle className="w-5 h-5" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    {editingId === task.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, task.text)}
                          className="flex-1 bg-white/10 border border-primary/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary/60"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEdit(task.text)}
                          className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="font-medium text-sm text-white/90 group-hover:text-white transition-colors break-words">{task.text}</h3>
                        <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      </div>
                    )}
                  </div>
                  {editingId !== task.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditing(task)}
                        className="p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Edit task"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(task.text)}
                        disabled={actionLoading === `delete-${task.text}`}
                        className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete task"
                      >
                        {actionLoading === `delete-${task.text}`
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {completedTasks.length > 0 && (
                <h3 className="font-semibold text-white/50 mt-8 mb-4 text-sm uppercase tracking-wider">
                  Completed ({completedTasks.length})
                </h3>
              )}
              
              {completedTasks.map(task => (
                <div key={task.id} className="glass-panel p-4 flex items-start gap-4 opacity-50 hover:opacity-70 transition-opacity group">
                  <div className="mt-1 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-3">
                      <h3 className="font-medium text-sm line-through text-white/50 break-words">{task.text}</h3>
                      <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-md border border-green-500/20 shrink-0">Done</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(task.text)}
                    disabled={actionLoading === `delete-${task.text}`}
                    className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete task"
                  >
                    {actionLoading === `delete-${task.text}`
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              ))}
            </>
          )}

        </div>

        {/* Sidebar / Quick Add */}
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Quick Command
            </h3>
            <textarea 
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors resize-none h-32"
              placeholder="E.g., Generate a cover image for the new project..."
            />
            <button 
              onClick={handleSubmit}
              disabled={submitting || !newTask.trim()}
              className="w-full mt-3 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Send to Inbox
            </button>
          </div>

          <div className="glass-panel p-6">
            <h3 className="font-semibold mb-4">Inbox Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Pending Tasks</span>
                <span className="font-medium text-blue-400">{pendingTasks.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Completed</span>
                <span className="font-medium text-green-400">{completedTasks.length}</span>
              </div>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Total</span>
                <span className="font-medium text-white">{tasks.length}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
