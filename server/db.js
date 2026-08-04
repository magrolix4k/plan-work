import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Supabase Environment Setup
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://sptfigyzjwlentpzbldl.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdGZpZ3l6andsZW50cHpibGRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3ODQwNjMsImV4cCI6MjEwMTM2MDA2M30.4dwi8JhkVS57OVhzkMQWtMUURha9_UvMTctaLpIGgkM';

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('⚡ Connected to Supabase PostgreSQL Database');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

// Local Fallback Storage Setup
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

const SETS_FILE = path.join(DATA_DIR, 'task_sets.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readLocalTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) {
      writeLocalTasks([]);
      return [];
    }
    const data = fs.readFileSync(TASKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeLocalTasks(tasks) {
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing tasks file:', error);
  }
}

function readLocalTaskSets() {
  try {
    if (!fs.existsSync(SETS_FILE)) {
      writeLocalTaskSets(['Default']);
      return ['Default'];
    }
    const data = fs.readFileSync(SETS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return ['Default'];
  }
}

function writeLocalTaskSets(sets) {
  try {
    fs.writeFileSync(SETS_FILE, JSON.stringify(sets, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing task sets file:', error);
  }
}

// Data Abstraction Layer (Supabase or Local Storage)

export async function getAllTaskSets() {
  let sets = new Set(['Default']);
  if (supabase) {
    try {
      const { data: dbSets } = await supabase.from('task_sets').select('name');
      if (dbSets) {
        dbSets.forEach(s => sets.add(s.name));
      }
      const { data: taskSets } = await supabase.from('tasks').select('task_set');
      if (taskSets) {
        taskSets.forEach(t => {
          if (t.task_set) sets.add(t.task_set);
        });
      }
      return Array.from(sets);
    } catch (err) {
      console.error('Supabase get task_sets error:', err);
    }
  }

  const localSets = readLocalTaskSets();
  localSets.forEach(s => sets.add(s));
  const localTasks = readLocalTasks();
  localTasks.forEach(t => {
    if (t.taskSet || t.task_set) sets.add(t.taskSet || t.task_set);
  });
  return Array.from(sets);
}

export async function createTaskSet(setName) {
  const name = setName.trim();
  if (!name) return null;

  if (supabase) {
    try {
      await supabase.from('task_sets').insert({ name }).select().single();
    } catch (err) {
      console.error('Supabase insert task_set error:', err);
    }
  }

  const localSets = readLocalTaskSets();
  if (!localSets.includes(name)) {
    localSets.push(name);
    writeLocalTaskSets(localSets);
  }
  return name;
}

export async function getAllTasks() {
  if (supabase) {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*, task_logs(*)')
        .order('created_at', { ascending: false });

      if (!error && tasks) {
        return tasks.map(t => ({
          ...t,
          taskSet: t.task_set || 'Default',
          task_set: t.task_set || 'Default',
          logs: (t.task_logs || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        }));
      }
    } catch (err) {
      console.error('Supabase query error, falling back to local storage:', err);
    }
  }
  return readLocalTasks();
}

export async function getTaskById(id) {
  if (supabase) {
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .select('*, task_logs(*)')
        .eq('id', id)
        .single();

      if (!error && task) {
        return {
          ...task,
          taskSet: task.task_set || 'Default',
          task_set: task.task_set || 'Default',
          logs: (task.task_logs || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        };
      }
    } catch (err) {
      console.error('Supabase error:', err);
    }
  }
  const tasks = readLocalTasks();
  return tasks.find(t => t.id === id);
}

export async function createTask(taskData) {
  const taskId = `task-${Date.now()}`;
  const now = new Date().toISOString();
  const taskSet = taskData.taskSet || taskData.task_set || 'Default';

  if (supabase) {
    try {
      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          id: taskId,
          title: taskData.title || 'Untitled Task',
          description: taskData.description || '',
          status: taskData.status || 'plan',
          priority: taskData.priority || 'medium',
          assignee: taskData.assignee || 'Antigravity AI',
          task_set: taskSet,
          progress: Number(taskData.progress) || 0,
          tags: Array.isArray(taskData.tags) ? taskData.tags : (taskData.tags ? taskData.tags.split(',').map(t => t.trim()) : [])
        })
        .select()
        .single();

      if (!error && newTask) {
        const logNote = taskData.logNote || 'Task created.';
        const { data: log } = await supabase
          .from('task_logs')
          .insert({
            task_id: taskId,
            author: taskData.assignee || 'AI Agent',
            action: 'CREATED',
            note: logNote
          })
          .select()
          .single();

        return {
          ...newTask,
          taskSet,
          task_set: taskSet,
          logs: log ? [log] : []
        };
      }
    } catch (err) {
      console.error('Supabase insert error, falling back to local:', err);
    }
  }

  // Local fallback
  const tasks = readLocalTasks();
  const newTask = {
    id: taskId,
    title: taskData.title || 'Untitled Task',
    description: taskData.description || '',
    status: taskData.status || 'plan',
    priority: taskData.priority || 'medium',
    assignee: taskData.assignee || 'Antigravity AI',
    taskSet,
    task_set: taskSet,
    tags: Array.isArray(taskData.tags) ? taskData.tags : (taskData.tags ? taskData.tags.split(',').map(t => t.trim()) : []),
    progress: Number(taskData.progress) || 0,
    logs: [
      {
        id: `log-${Date.now()}`,
        timestamp: now,
        author: taskData.assignee || 'AI Agent',
        action: 'CREATED',
        note: taskData.logNote || 'Task created.'
      }
    ],
    createdAt: now,
    updatedAt: now
  };

  tasks.unshift(newTask);
  writeLocalTasks(tasks);
  return newTask;
}

export async function updateTask(id, updates) {
  const timestamp = new Date().toISOString();
  const author = updates.author || updates.assignee || 'AI Agent';

  if (supabase) {
    try {
      const { data: current } = await supabase.from('tasks').select('status').eq('id', id).single();
      const oldStatus = current ? current.status : null;

      const payload = {
        updated_at: timestamp
      };
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.assignee !== undefined) payload.assignee = updates.assignee;
      if (updates.taskSet !== undefined || updates.task_set !== undefined) {
        payload.task_set = updates.taskSet || updates.task_set;
      }
      if (updates.progress !== undefined) payload.progress = Number(updates.progress);
      if (updates.tags !== undefined) {
        payload.tags = Array.isArray(updates.tags) ? updates.tags : updates.tags.split(',').map(t => t.trim());
      }

      const { data: updated, error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && updated) {
        let note = updates.logNote;
        let action = 'LOG';

        if (updates.status && oldStatus && updates.status !== oldStatus) {
          action = 'STATUS_CHANGE';
          note = `Moved status from ${oldStatus.toUpperCase()} to ${updates.status.toUpperCase()}.${updates.logNote ? ' Note: ' + updates.logNote : ''}`;
        }

        if (note) {
          await supabase.from('task_logs').insert({
            task_id: id,
            author,
            action,
            note
          });
        }

        return getTaskById(id);
      }
    } catch (err) {
      console.error('Supabase update error:', err);
    }
  }

  // Local fallback
  const tasks = readLocalTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return null;

  const currentTask = tasks[index];
  const oldStatus = currentTask.status;
  const newLogs = [...(currentTask.logs || [])];

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
    ...((updates.taskSet !== undefined || updates.task_set !== undefined) && { 
      taskSet: updates.taskSet || updates.task_set,
      task_set: updates.taskSet || updates.task_set
    }),
    ...(updates.progress !== undefined && { progress: Number(updates.progress) }),
    ...(updates.tags !== undefined && { 
      tags: Array.isArray(updates.tags) ? updates.tags : updates.tags.split(',').map(t => t.trim()) 
    }),
    logs: newLogs,
    updatedAt: timestamp
  };

  tasks[index] = updatedTask;
  writeLocalTasks(tasks);
  return updatedTask;
}

export async function addLogToTask(id, logData) {
  return updateTask(id, {
    author: logData.author || 'AI Agent',
    logNote: logData.note || logData.logNote || 'Activity logged.'
  });
}

export async function deleteTask(id) {
  if (supabase) {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.error('Supabase delete error:', err);
    }
  }

  let tasks = readLocalTasks();
  const exists = tasks.some(t => t.id === id);
  if (!exists) return false;

  tasks = tasks.filter(t => t.id !== id);
  writeLocalTasks(tasks);
  return true;
}

export async function resetSeed() {
  if (supabase) {
    try {
      await supabase.from('tasks').delete().neq('id', 'keep-all');
      return [];
    } catch (err) {
      console.error('Supabase reset error:', err);
    }
  }
  writeLocalTasks([]);
  return [];
}
