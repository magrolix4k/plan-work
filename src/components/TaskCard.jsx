import React from 'react';
import { MessageSquare, User, Bot, CheckCircle2, Clock } from 'lucide-react';

export default function TaskCard({ task, onClick, onDragStart }) {
  const latestLog = task.logs && task.logs.length > 0 ? task.logs[0] : null;
  const isAIAssignee = task.assignee && (task.assignee.toLowerCase().includes('ai') || task.assignee.toLowerCase().includes('antigravity') || task.assignee.toLowerCase().includes('agent'));

  return (
    <div
      className="task-card"
      data-status={task.status}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onClick(task)}
    >
      <div className="task-header">
        <span className="task-id">{task.id}</span>
        <span className={`priority-badge priority-${task.priority}`}>
          {task.priority}
        </span>
      </div>

      <div className="task-title">{task.title}</div>

      {task.description && (
        <div className="task-desc">{task.description}</div>
      )}

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(100, Math.max(0, task.progress || 0))}%` }}
          />
        </div>
        <span className="progress-text">{task.progress || 0}%</span>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="tags-row">
          {task.tags.map((tag, idx) => (
            <span key={idx} className="tag-chip">#{tag}</span>
          ))}
        </div>
      )}

      {/* Footer info */}
      <div className="task-footer">
        <div className="assignee-tag">
          {isAIAssignee ? (
            <span className="ai-badge" title="Assigned to AI Agent">
              🤖 {task.assignee}
            </span>
          ) : (
            <span>👤 {task.assignee || 'Unassigned'}</span>
          )}
        </div>

        <div className="logs-count" title={`${task.logs ? task.logs.length : 0} activity logs`}>
          <MessageSquare size={12} />
          <span>{task.logs ? task.logs.length : 0}</span>
        </div>
      </div>
    </div>
  );
}
