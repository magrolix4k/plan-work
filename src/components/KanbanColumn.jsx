import React, { useState } from 'react';
import TaskCard from './TaskCard';

export default function KanbanColumn({ column, tasks, onTaskClick, onDropTask }) {
  const [isDragOver, setIsDragOver] = useState(false);

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
          <div
            className="column-color-indicator"
            style={{ backgroundColor: column.color }}
          />
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
