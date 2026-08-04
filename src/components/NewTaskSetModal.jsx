import React, { useState } from 'react';
import { X, Layers, Plus } from 'lucide-react';

export default function NewTaskSetModal({ isOpen, onClose, onCreate }) {
  if (!isOpen) return null;

  const [setName, setSetName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (setName.trim()) {
      onCreate(setName.trim());
      setSetName('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={20} color="var(--accent-purple)" />
            <h2 className="modal-title">Create New Task Set</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">Task Set / Batch Name</label>
            <input
              type="text"
              className="form-input"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              placeholder="e.g. Sprint 2, Auth Feature, Design Refresh"
              autoFocus
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Create Task Set
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
