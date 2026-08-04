import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import KanbanColumn from './components/KanbanColumn';
import TaskModal from './components/TaskModal';
import AgentGuideModal from './components/AgentGuideModal';

const API_BASE = '/api';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', icon: 'Inbox', color: '#64748b' },
  { id: 'plan', title: 'Plan', icon: 'ClipboardList', color: '#a855f7' },
  { id: 'in_progress', title: 'In Progress', icon: 'Zap', color: '#f59e0b' },
  { id: 'in_review', title: 'In Review', icon: 'Search', color: '#06b6d4' },
  { id: 'done', title: 'Done', icon: 'CheckCircle2', color: '#10b981' }
];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial tasks
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  useEffect(() => {
    fetchTasks();

    // Subscribe to SSE Real-time Updates
    const eventSource = new EventSource(`${API_BASE}/events`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'CONNECTED') {
          setIsConnected(true);
        } else if (payload.type === 'TASK_CREATED') {
          setTasks(prev => [payload.data, ...prev.filter(t => t.id !== payload.data.id)]);
        } else if (payload.type === 'TASK_UPDATED' || payload.type === 'TASK_LOG_ADDED') {
          setTasks(prev => prev.map(t => t.id === payload.data.id ? payload.data : t));
          setSelectedTask(current => (current && current.id === payload.data.id ? payload.data : current));
        } else if (payload.type === 'TASK_DELETED') {
          setTasks(prev => prev.filter(t => t.id !== payload.data.id));
          setSelectedTask(current => (current && current.id === payload.data.id ? null : current));
        } else if (payload.type === 'TASKS_RESET') {
          setTasks(payload.data);
        }
      } catch (e) {
        console.error('Error parsing SSE event:', e);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Drag and Drop Column Handler
  const handleDropTask = async (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          author: 'User',
          logNote: `Moved to ${newStatus.toUpperCase()} column`
        })
      });
      const data = await res.json();
      if (!data.success) {
        setTasks(previousTasks);
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
      setTasks(previousTasks);
    }
  };

  const handleOpenNewTask = () => {
    setSelectedTask({
      id: `new-${Date.now()}`,
      title: '',
      description: '',
      status: 'plan',
      priority: 'medium',
      assignee: 'Antigravity AI',
      progress: 0,
      tags: [],
      logs: []
    });
    setIsModalOpen(true);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (id, formData) => {
    try {
      if (id.startsWith('new')) {
        const res = await fetch(`${API_BASE}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        await res.json();
      } else {
        const res = await fetch(`${API_BASE}/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        await res.json();
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleAddLog = async (id, logData) => {
    try {
      await fetch(`${API_BASE}/tasks/${id}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
    } catch (err) {
      console.error('Failed to add log:', err);
    }
  };

  const handleResetSeed = async () => {
    if (window.confirm('Reset sample task workspace?')) {
      try {
        await fetch(`${API_BASE}/tasks/reset`, { method: 'POST' });
      } catch (err) {
        console.error('Failed to reset tasks:', err);
      }
    }
  };

  // Filter tasks based on search
  const filteredTasks = tasks.filter(t => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.assignee && t.assignee.toLowerCase().includes(q)) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q))) ||
      t.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="app-container">
      <Navbar
        search={search}
        setSearch={setSearch}
        onOpenNewTask={handleOpenNewTask}
        onOpenGuide={() => setIsGuideOpen(true)}
        isConnected={isConnected}
        onResetSeed={handleResetSeed}
      />

      <StatsOverview tasks={filteredTasks} />

      <main className="kanban-board">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={filteredTasks.filter(t => t.status === col.id)}
            onTaskClick={handleTaskClick}
            onDropTask={handleDropTask}
          />
        ))}
      </main>

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onAddLog={handleAddLog}
      />

      <AgentGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
