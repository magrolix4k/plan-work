import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import KanbanColumn from './components/KanbanColumn';
import TaskModal from './components/TaskModal';
import AgentGuideModal from './components/AgentGuideModal';
import NewTaskSetModal from './components/NewTaskSetModal';

const API_BASE = '/api';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', icon: 'Inbox', color: '#64748b' },
  { id: 'plan', title: 'Plan', icon: 'ClipboardList', color: '#a855f7' },
  { id: 'in_progress', title: 'In Progress', icon: 'Zap', color: '#f59e0b' },
  { id: 'in_review', title: 'In Review', icon: 'Search', color: '#06b6d4' },
  { id: 'done', title: 'Done', icon: 'CheckCircle2', color: '#10b981' }
];

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTaskSet, setSelectedTaskSet] = useState('ALL');
  const [dateFilter, setDateFilter] = useState(getTodayDateString());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isNewTaskSetModalOpen, setIsNewTaskSetModalOpen] = useState(false);
  const [dbTaskSets, setDbTaskSets] = useState([]);
  const [customTaskSets, setCustomTaskSets] = useState([]);

  // Fetch initial tasks and task sets
  const fetchTasks = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/tasks`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  const fetchTaskSets = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/task-sets`);
      const data = await res.json();
      if (data.success && Array.isArray(data.taskSets)) {
        setDbTaskSets(data.taskSets);
      }
    } catch (err) {
      console.error('Failed to fetch task sets:', err);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchTaskSets();
  }, [fetchTasks, fetchTaskSets]);

  // Memoize unique Task Sets computation
  const taskSets = useMemo(() => {
    const rawSets = tasks.map(t => t.taskSet || t.task_set || 'Default');
    const validSelection = selectedTaskSet !== 'ALL' && selectedTaskSet !== '__NEW__' ? [selectedTaskSet] : [];
    return Array.from(new Set(['Default', ...dbTaskSets, ...customTaskSets, ...rawSets, ...validSelection]));
  }, [tasks, dbTaskSets, customTaskSets, selectedTaskSet]);

  const handleCreateTaskSet = useCallback(async (setName) => {
    if (setName && setName.trim()) {
      const cleaned = setName.trim();
      setCustomTaskSets(prev => Array.from(new Set([...prev, cleaned])));
      setSelectedTaskSet(cleaned);
      try {
        await fetch(`${API_BASE}/task-sets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cleaned })
        });
        fetchTaskSets();
      } catch (err) {
        console.error('Failed to save task set to DB:', err);
      }
    }
  }, [fetchTaskSets]);

  // Drag and Drop Column Handler
  const handleDropTask = useCallback(async (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

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
  }, [tasks]);

  const handleOpenNewTask = useCallback(() => {
    const currentSet = (selectedTaskSet === 'ALL' || selectedTaskSet === '__NEW__') ? 'Default' : selectedTaskSet;
    setSelectedTask({
      id: `new-${Date.now()}`,
      title: '',
      description: '',
      status: 'plan',
      priority: 'medium',
      assignee: 'Antigravity AI',
      taskSet: currentSet,
      progress: 0,
      tags: [],
      logs: []
    });
    setIsModalOpen(true);
  }, [selectedTaskSet]);

  const handleTaskClick = useCallback((task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  }, []);

  const handleSaveTask = useCallback(async (id, formData) => {
    try {
      if (id.startsWith('new')) {
        await fetch(`${API_BASE}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`${API_BASE}/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      fetchTasks();
      fetchTaskSets();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  }, [fetchTasks, fetchTaskSets]);

  const handleDeleteTask = useCallback(async (id) => {
    try {
      await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
      fetchTasks();
      fetchTaskSets();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }, [fetchTasks, fetchTaskSets]);

  const handleAddLog = useCallback(async (id, logData) => {
    try {
      await fetch(`${API_BASE}/tasks/${id}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
      fetchTasks();
    } catch (err) {
      console.error('Failed to add log:', err);
    }
  }, [fetchTasks]);

  // Memoize Filtered Tasks computation
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // 1. Task Set filter
      const taskSet = t.taskSet || t.task_set || 'Default';
      if (selectedTaskSet !== 'ALL' && selectedTaskSet !== '__NEW__' && taskSet.toLowerCase() !== selectedTaskSet.toLowerCase()) {
        return false;
      }

      // 2. Date filter (YYYY-MM-DD)
      if (dateFilter) {
        const createdAt = t.created_at || t.createdAt || '';
        if (!createdAt.startsWith(dateFilter)) {
          return false;
        }
      }

      // 3. Search query filter
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.assignee && t.assignee.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q))) ||
        t.id.toLowerCase().includes(q) ||
        taskSet.toLowerCase().includes(q)
      );
    });
  }, [tasks, selectedTaskSet, dateFilter, search]);

  return (
    <div className="app-container">
      <Navbar
        search={search}
        setSearch={setSearch}
        selectedTaskSet={selectedTaskSet}
        setSelectedTaskSet={setSelectedTaskSet}
        taskSets={taskSets}
        onCreateTaskSet={() => setIsNewTaskSetModalOpen(true)}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        onOpenNewTask={handleOpenNewTask}
        onOpenGuide={() => setIsGuideOpen(true)}
        onRefresh={fetchTasks}
        isRefreshing={isRefreshing}
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

      <NewTaskSetModal
        isOpen={isNewTaskSetModalOpen}
        onClose={() => setIsNewTaskSetModalOpen(false)}
        onCreate={handleCreateTaskSet}
      />
    </div>
  );
}
