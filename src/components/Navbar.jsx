import React from 'react';
import { Bot, Plus, Search, Terminal, Zap, RefreshCw } from 'lucide-react';

export default function Navbar({ search, setSearch, onOpenNewTask, onOpenGuide, isConnected, onResetSeed }) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon-wrapper">
          <Bot size={24} color="#ffffff" />
        </div>
        <div>
          <div className="brand-title">AI Task Workspace</div>
          <div className="brand-subtitle">Plan to Done Workflow Tracker for AI Agents</div>
        </div>

        <div className="live-indicator" title={isConnected ? "Real-time SSE Connected" : "Connecting to SSE..."}>
          <div className={`pulse-dot ${!isConnected ? 'disconnected' : ''}`} />
          <span>{isConnected ? "Agent Live Sync" : "Connecting..."}</span>
        </div>
      </div>

      <div className="header-actions">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks, tags, AI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="btn btn-secondary" onClick={onOpenGuide} title="AI Agent Instructions & API Commands">
          <Terminal size={16} />
          <span>AI Agent Commands</span>
        </button>

        <button className="btn btn-secondary" onClick={onResetSeed} title="Reset Sample Tasks">
          <RefreshCw size={14} />
        </button>

        <button className="btn btn-primary" onClick={onOpenNewTask}>
          <Plus size={16} />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
}
