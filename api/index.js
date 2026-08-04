import express from 'express';
import cors from 'cors';
import * as db from '../server/db.js';

const app = express();

app.use(cors());
app.use(express.json());

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

// POST create task
app.post('/api/tasks', (req, res) => {
  try {
    const newTask = db.createTask(req.body);
    res.status(201).json({ success: true, task: newTask });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH update task
app.patch('/api/tasks/:id', (req, res) => {
  try {
    const updatedTask = db.updateTask(req.params.id, req.body);
    if (!updatedTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, task: updatedTask });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST add log
app.post('/api/tasks/:id/logs', (req, res) => {
  try {
    const updatedTask = db.addLogToTask(req.params.id, req.body);
    if (!updatedTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
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
  res.json({ success: true, id: req.params.id });
});

// POST Reset Seed Data
app.post('/api/tasks/reset', (req, res) => {
  const tasks = db.resetSeed();
  res.json({ success: true, tasks });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export default app;
