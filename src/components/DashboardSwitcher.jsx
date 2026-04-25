"use client";

import React from 'react';
import { Crosshair, MessageCircle, Library, CalendarDays } from 'lucide-react';

const DASHBOARDS = [
  { id: 'focus',    icon: Crosshair,    label: 'Focus Mode' },
  { id: 'chat',     icon: MessageCircle,label: 'Open Chat' },
  { id: 'library',  icon: Library,      label: 'Smart Library' },
  { id: 'schedule', icon: CalendarDays, label: 'Smart Schedule' },
];

const DashboardSwitcher = ({ active, onSwitch }) => {
  return (
    <div className="dashboard-switcher">
      {DASHBOARDS.map(d => {
        const Icon = d.icon;
        const isActive = active === d.id;
        return (
          <button
            key={d.id}
            onClick={() => onSwitch(d.id)}
            className={`dashboard-switch-btn ${isActive ? 'active' : ''}`}
          >
            <Icon size={15} />
            <span>{d.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default DashboardSwitcher;
