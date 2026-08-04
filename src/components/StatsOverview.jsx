import React from 'react';
import { Layers, ClipboardList, Zap, Search, CheckCircle2 } from 'lucide-react';

export default function StatsOverview({ tasks }) {
  const total = tasks.length;
  const planCount = tasks.filter(t => t.status === 'plan').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const inReviewCount = tasks.filter(t => t.status === 'in_review').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  const stats = [
    { label: 'Total Tasks', value: total, color: '#f8fafc', icon: Layers },
    { label: 'Plan', value: planCount, color: '#a855f7', icon: ClipboardList },
    { label: 'In Progress', value: inProgressCount, color: '#f59e0b', icon: Zap },
    { label: 'In Review', value: inReviewCount, color: '#06b6d4', icon: Search },
    { label: 'Completed', value: doneCount, color: '#10b981', icon: CheckCircle2 },
  ];

  return (
    <div className="stats-strip">
      {stats.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <div key={idx} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconComponent size={14} color={stat.color} />
              <span className="stat-label">{stat.label}</span>
            </div>
            <span className="stat-value" style={{ color: stat.color }}>{stat.value}</span>
          </div>
        );
      })}
    </div>
  );
}
