import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as db from '../server/db.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// GET all task sets
app.get('/api/task-sets', async (req, res) => {
  try {
    const taskSets = await db.getAllTaskSets();
    res.json({ success: true, taskSets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create task set
app.post('/api/task-sets', async (req, res) => {
  try {
    const setName = req.body.name || req.body.setName;
    if (!setName) {
      return res.status(400).json({ success: false, error: 'Task Set name is required' });
    }
    const created = await db.createTaskSet(setName);
    res.status(201).json({ success: true, taskSet: created });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await db.getAllTasks();
    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single task
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await db.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create task
app.post('/api/tasks', async (req, res) => {
  try {
    const newTask = await db.createTask(req.body);
    res.status(201).json({ success: true, task: newTask });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH update task
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const updatedTask = await db.updateTask(req.params.id, req.body);
    if (!updatedTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, task: updatedTask });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST add log
app.post('/api/tasks/:id/logs', async (req, res) => {
  try {
    const updatedTask = await db.addLogToTask(req.params.id, req.body);
    if (!updatedTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, task: updatedTask });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const success = await db.deleteTask(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Reset Seed Data
app.post('/api/tasks/reset', async (req, res) => {
  try {
    const tasks = await db.resetSeed();
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: process.env.SUPABASE_URL ? 'supabase_postgresql' : 'local_json_fallback',
    time: new Date().toISOString()
  });
});

export default app;
