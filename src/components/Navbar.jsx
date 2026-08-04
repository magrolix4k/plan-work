import React from 'react';
import { Bot, Plus, Search, Terminal, RefreshCw, FolderPlus, Calendar, Layers } from 'lucide-react';

export default function Navbar({
  search,
  setSearch,
  selectedTaskSet,
  setSelectedTaskSet,
  taskSets,
  onCreateTaskSet,
  dateFilter,
  setDateFilter,
  onOpenNewTask,
  onOpenGuide,
  onRefresh,
  isRefreshing
}) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon-wrapper">
          <Bot size={24} color="#ffffff" />
        </div>
        <div>
          <div className="brand-title">AI Task Workspace</div>
          <div className="brand-subtitle">Plan to Done Workflow Tracker</div>
        </div>
      </div>

      <div className="header-actions">
        {/* Task Set Selector */}
        <div className="filter-group" title="Filter by Task Set / Batch">
          <Layers size={14} className="filter-icon" />
          <select
            className="filter-select"
            value={selectedTaskSet}
            onChange={(e) => {
              if (e.target.value === '__NEW__') {
                onCreateTaskSet();
              } else {
                setSelectedTaskSet(e.target.value);
              }
            }}
          >
            <option value="ALL">All Task Sets</option>
            {taskSets.map(set => (
              <option key={set} value={set}>Set: {set}</option>
            ))}
            <option value="__NEW__">+ New Task Set...</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="filter-group" title="Filter by Date">
          <Calendar size={14} className="filter-icon" />
          <input
            type="date"
            className="date-input"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          {dateFilter && (
            <button className="clear-date-btn" onClick={() => setDateFilter('')} title="Clear date filter">
              ✕
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Manual Refresh Button */}
        <button
          className={`btn btn-secondary ${isRefreshing ? 'refreshing' : ''}`}
          onClick={onRefresh}
          title="Refresh tasks from server"
        >
          <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
          <span>Refresh</span>
        </button>

        <button className="btn btn-secondary" onClick={onOpenGuide} title="AI Agent Commands">
          <Terminal size={16} />
          <span>AI Commands</span>
        </button>

        <button className="btn btn-primary" onClick={onOpenNewTask}>
          <Plus size={16} />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
}
