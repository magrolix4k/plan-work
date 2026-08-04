import React, { useState, useEffect } from 'react';
import { X, Trash2, Send, Clock } from 'lucide-react';

export default function TaskModal({ task, isOpen, onClose, onSave, onDelete, onAddLog }) {
  if (!isOpen || !task) return null;

  const [formData, setFormData] = useState({
    title: task.title || '',
    description: task.description || '',
    status: task.status || 'plan',
    priority: task.priority || 'medium',
    assignee: task.assignee || 'Antigravity AI',
    progress: task.progress || 0,
    tags: Array.isArray(task.tags) ? task.tags.join(', ') : (task.tags || '')
  });

  const [newLogNote, setNewLogNote] = useState('');
  const [logAuthor, setLogAuthor] = useState('User');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'plan',
        priority: task.priority || 'medium',
        assignee: task.assignee || 'Antigravity AI',
        progress: task.progress || 0,
        tags: Array.isArray(task.tags) ? task.tags.join(', ') : (task.tags || '')
      });
      setNewLogNote('');
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(task.id, formData);
  };

  const handleAddLogSubmit = (e) => {
    e.preventDefault();
    if (!newLogNote.trim()) return;
    onAddLog(task.id, { note: newLogNote, author: logAuthor });
    setNewLogNote('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="task-id">{task.id}</span>
            <h2 className="modal-title">{task.id.startsWith('new') ? 'Create New Task' : 'Task Details & AI History'}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <form id="task-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Task Title</label>
              <input
                type="text"
                name="title"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Implement user authentication middleware"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-textarea"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed instructions or acceptance criteria..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status Column</label>
                <select name="status" className="form-select" value={formData.status} onChange={handleChange}>
                  <option value="backlog">📥 Backlog</option>
                  <option value="plan">📋 Plan</option>
                  <option value="in_progress">⚡ In Progress</option>
                  <option value="in_review">🔍 In Review</option>
                  <option value="done">✅ Done</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select name="priority" className="form-select" value={formData.priority} onChange={handleChange}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">🔥 Urgent</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assignee (User or AI Agent)</label>
                <input
                  type="text"
                  name="assignee"
                  className="form-input"
                  value={formData.assignee}
                  onChange={handleChange}
                  placeholder="e.g. Antigravity AI, Claude, User"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Progress ({formData.progress}%)</label>
                <input
                  type="range"
                  name="progress"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.progress}
                  onChange={handleChange}
                  style={{ accentColor: 'var(--accent-purple)', cursor: 'pointer', marginTop: '0.5rem' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input
                type="text"
                name="tags"
                className="form-input"
                value={formData.tags}
                onChange={handleChange}
                placeholder="backend, api, security, frontend"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              {task.id && !task.id.startsWith('new') && (
                <button
                  type="button"
                  className="btn"
                  style={{ background: 'rgba(244,63,94,0.15)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)' }}
                  onClick={() => onDelete(task.id)}
                >
                  <Trash2 size={16} /> Delete Task
                </button>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Task</button>
              </div>
            </div>
          </form>

          {/* AI Agent Activity Timeline Feed */}
          {task.id && !task.id.startsWith('new') && (
            <div className="timeline-section">
              <div className="timeline-title">
                <Clock size={16} />
                <span>AI Agent Execution & Activity Timeline</span>
              </div>

              {/* Add Note Input */}
              <form onSubmit={handleAddLogSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <select
                  value={logAuthor}
                  onChange={(e) => setLogAuthor(e.target.value)}
                  className="form-select"
                  style={{ width: '130px', fontSize: '0.8rem' }}
                >
                  <option value="User">👤 User</option>
                  <option value="Antigravity AI">🤖 Antigravity AI</option>
                  <option value="Claude Agent">🤖 Claude Agent</option>
                </select>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Add progress note or execution log..."
                  value={newLogNote}
                  onChange={(e) => setNewLogNote(e.target.value)}
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 0.85rem' }}>
                  <Send size={14} />
                </button>
              </form>

              <div className="timeline-feed">
                {task.logs && task.logs.length > 0 ? (
                  task.logs.map((log, idx) => (
                    <div key={log.id || idx} className="timeline-item">
                      <div className="timeline-item-header">
                        <span className="timeline-author">
                          {log.author && log.author.toLowerCase().includes('ai') ? '🤖 ' : '👤 '}
                          {log.author || 'AI Agent'}
                        </span>
                        <span className="timeline-time">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <div className="timeline-note">{log.note}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    No activity logs recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
