import express from 'express';
import cors from 'cors';
import path from 'path';
import * as db from './db.js';

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
app.get('/api/tasks', (req, res) => {
  const tasks = db.getAllTasks();
  res.json({ success: true, count: tasks.length, tasks });
});

// GET single task
app.get('/api/tasks/:id', (req, res) => {
  const task = db.getTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }
  res.json({ success: true, task });
});

// POST create task (AI / User)
app.post('/api/tasks', (req, res) => {
  try {
    const newTask = db.createTask(req.body);
    sendSSEEvent('TASK_CREATED', newTask);
    res.status(201).json({ success: true, task: newTask });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH update task (AI / User)
app.patch('/api/tasks/:id', (req, res) => {
  try {
    const updatedTask = db.updateTask(req.params.id, req.body);
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
app.post('/api/tasks/:id/logs', (req, res) => {
  try {
    const updatedTask = db.addLogToTask(req.params.id, req.body);
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
app.delete('/api/tasks/:id', (req, res) => {
  const success = db.deleteTask(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }
  sendSSEEvent('TASK_DELETED', { id: req.params.id });
  res.json({ success: true, id: req.params.id });
});

// POST Reset Seed Data
app.post('/api/tasks/reset', (req, res) => {
  const tasks = db.resetSeed();
  sendSSEEvent('TASKS_RESET', tasks);
  res.json({ success: true, tasks });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Task Tracker Backend running on http://localhost:${PORT}`);
});
