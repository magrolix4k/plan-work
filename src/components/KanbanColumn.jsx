import React, { useState } from 'react';
import { Inbox, ClipboardList, Zap, Search, CheckCircle2 } from 'lucide-react';
import TaskCard from './TaskCard';

const ICON_MAP = {
  Inbox: Inbox,
  ClipboardList: ClipboardList,
  Zap: Zap,
  Search: Search,
  CheckCircle2: CheckCircle2
};

export default function KanbanColumn({ column, tasks, onTaskClick, onDropTask }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const IconComponent = ICON_MAP[column.icon] || Inbox;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDropTask(taskId, column.id);
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  return (
    <div
      className={`kanban-column ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <div className="column-title-group">
          <IconComponent size={16} color={column.color} />
          <span className="column-title">{column.title}</span>
        </div>
        <span className="column-count">{tasks.length}</span>
      </div>

      <div className="column-cards-container">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={onTaskClick}
            onDragStart={handleDragStart}
          />
        ))}
        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px' }}>
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
