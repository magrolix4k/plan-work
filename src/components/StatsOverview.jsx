import React from 'react';

export default function StatsOverview({ tasks }) {
  const total = tasks.length;
  const planCount = tasks.filter(t => t.status === 'plan').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const inReviewCount = tasks.filter(t => t.status === 'in_review').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  const stats = [
    { label: 'Total Tasks', value: total, color: '#f8fafc' },
    { label: '📋 Plan', value: planCount, color: '#a855f7' },
    { label: '⚡ In Progress', value: inProgressCount, color: '#f59e0b' },
    { label: '🔍 In Review', value: inReviewCount, color: '#06b6d4' },
    { label: '✅ Completed', value: doneCount, color: '#10b981' },
  ];

  return (
    <div className="stats-strip">
      {stats.map((stat, idx) => (
        <div key={idx} className="stat-card">
          <span className="stat-label">{stat.label}</span>
          <span className="stat-value" style={{ color: stat.color }}>{stat.value}</span>
        </div>
      ))}
    </div>
  );
}
