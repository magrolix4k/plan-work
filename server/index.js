import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as db from './db.js';
import { checkStatusRules } from './task-rules.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Real-time SSE Clients connection list
let sseClients = [];

function sendSSEEvent(type, data) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`;
  sseClients.forEach(client => client.res.write(payload));
}

// SSE Endpoint for Live Updates
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(client => client.id !== clientId);
  });
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

// POST create task (AI / User)
app.post('/api/tasks', async (req, res) => {
  try {
    const violation = checkStatusRules(req, req.body.status);
    if (violation) {
      return res.status(violation.status).json(violation.body);
    }
    const newTask = await db.createTask(req.body);
    sendSSEEvent('TASK_CREATED', newTask);
    res.status(201).json({ success: true, task: newTask });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH update task (AI / User)
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const violation = checkStatusRules(req, req.body.status);
    if (violation) {
      return res.status(violation.status).json(violation.body);
    }
    const updatedTask = await db.updateTask(req.params.id, req.body);
    if (!updatedTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    sendSSEEvent('TASK_UPDATED', updatedTask);
    res.json({ success: true, task: updatedTask });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST add log / note to task
app.post('/api/tasks/:id/logs', async (req, res) => {
  try {
    const updatedTask = await db.addLogToTask(req.params.id, req.body);
    if (!updatedTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    sendSSEEvent('TASK_LOG_ADDED', updatedTask);
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
    sendSSEEvent('TASK_DELETED', { id: req.params.id });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Reset Seed Data
app.post('/api/tasks/reset', async (req, res) => {
  try {
    const tasks = await db.resetSeed();
    sendSSEEvent('TASKS_RESET', tasks);
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

app.listen(PORT, () => {
  console.log(`🚀 AI Task Tracker Backend running on http://localhost:${PORT}`);
});
