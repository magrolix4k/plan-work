import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data if file doesn't exist
const INITIAL_TASKS = [];

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) {
      writeTasks(INITIAL_TASKS);
      return INITIAL_TASKS;
    }
    const data = fs.readFileSync(TASKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading tasks file:', error);
    return INITIAL_TASKS;
  }
}

function writeTasks(tasks) {
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing tasks file:', error);
  }
}

export function getAllTasks() {
  return readTasks();
}

export function getTaskById(id) {
  const tasks = readTasks();
  return tasks.find(t => t.id === id);
}

export function createTask(taskData) {
  const tasks = readTasks();
  const newTask = {
    id: `task-${Date.now()}`,
    title: taskData.title || 'Untitled Task',
    description: taskData.description || '',
    status: taskData.status || 'plan',
    priority: taskData.priority || 'medium',
    tags: Array.isArray(taskData.tags) ? taskData.tags : (taskData.tags ? taskData.tags.split(',').map(t => t.trim()) : []),
    assignee: taskData.assignee || 'Antigravity AI',
    progress: Number(taskData.progress) || 0,
    logs: [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        author: taskData.assignee || 'AI Agent',
        action: 'CREATED',
        note: taskData.logNote || 'Task created.'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  tasks.unshift(newTask);
  writeTasks(tasks);
  return newTask;
}

export function updateTask(id, updates) {
  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return null;

  const currentTask = tasks[index];
  const oldStatus = currentTask.status;
  
  const newLogs = [...(currentTask.logs || [])];
  const timestamp = new Date().toISOString();
  const author = updates.author || updates.assignee || 'AI Agent';

  if (updates.status && updates.status !== oldStatus) {
    newLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp,
      author,
      action: 'STATUS_CHANGE',
      note: `Moved status from ${oldStatus.toUpperCase()} to ${updates.status.toUpperCase()}.${updates.logNote ? ' Note: ' + updates.logNote : ''}`
    });
  } else if (updates.logNote) {
    newLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp,
      author,
      action: 'LOG',
      note: updates.logNote
    });
  }

  const updatedTask = {
    ...currentTask,
    ...(updates.title !== undefined && { title: updates.title }),
    ...(updates.description !== undefined && { description: updates.description }),
    ...(updates.status !== undefined && { status: updates.status }),
    ...(updates.priority !== undefined && { priority: updates.priority }),
    ...(updates.assignee !== undefined && { assignee: updates.assignee }),
    ...(updates.progress !== undefined && { progress: Number(updates.progress) }),
    ...(updates.tags !== undefined && { 
      tags: Array.isArray(updates.tags) ? updates.tags : updates.tags.split(',').map(t => t.trim()) 
    }),
    logs: newLogs,
    updatedAt: timestamp
  };

  tasks[index] = updatedTask;
  writeTasks(tasks);
  return updatedTask;
}

export function addLogToTask(id, logData) {
  const tasks = readTasks();
  const task = tasks.find(t => t.id === id);
  if (!task) return null;

  return updateTask(id, {
    author: logData.author || 'AI Agent',
    logNote: logData.note || logData.logNote || 'Activity logged.'
  });
}

export function deleteTask(id) {
  let tasks = readTasks();
  const exists = tasks.some(t => t.id === id);
  if (!exists) return false;

  tasks = tasks.filter(t => t.id !== id);
  writeTasks(tasks);
  return true;
}

export function resetSeed() {
  writeTasks(INITIAL_TASKS);
  return INITIAL_TASKS;
}
