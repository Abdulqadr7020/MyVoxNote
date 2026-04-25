"use client";

import React, { useState, useEffect } from 'react';
import {
  X, Settings, Palette, LayoutDashboard, Brain, Bell,
  Trash2, Download, Shield, Moon, Sun, Monitor,
  ChevronRight, ToggleLeft, ToggleRight, AlertTriangle, Check
} from 'lucide-react';

const SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'ai',         label: 'AI & Models', icon: Brain },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'data',       label: 'Data & Privacy', icon: Shield },
];

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: value ? 'var(--accent-color)' : 'var(--text-secondary)', transition: 'color 0.2s' }}>
      {value ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
    </button>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="st-row">
      <div className="st-row-text">
        <div className="st-row-label">{label}</div>
        {description && <div className="st-row-desc">{description}</div>}
      </div>
      <div className="st-row-control">{children}</div>
    </div>
  );
}

export default function SettingsModal({ isDark, onThemeChange, onClose }) {
  const [section, setSection] = useState('appearance');
  const [prefs, setPrefs] = useState({
    theme: isDark ? 'dark' : 'light',
    defaultDashboard: 'focus',
    aiModel: 'llama-3.3-70b-versatile',
    smoothScroll: true,
    animationsEnabled: true,
    notifyAssignments: true,
    notifyExams: true,
    notifyAttendance: true,
    autoSaveChat: true,
    compactMode: false,
  });
  const [clearConfirm, setClearConfirm] = useState(null);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('voxnote-settings');
    if (saved) {
      setPrefs(p => ({ ...p, ...JSON.parse(saved) }));
    }
  }, []);

  const savePrefs = (next) => {
    setPrefs(next);
    localStorage.setItem('voxnote-settings', JSON.stringify(next));
  };

  const set = (key, val) => {
    const next = { ...prefs, [key]: val };
    savePrefs(next);
    if (key === 'theme') onThemeChange(val === 'dark');
    if (key === 'defaultDashboard') localStorage.setItem('voxnote-dashboard', val);
  };

  const clearData = (type) => {
    if (type === 'chat')     { localStorage.removeItem('voxnote-chat-history'); }
    if (type === 'library')  { localStorage.removeItem('voxnote-library-notes'); localStorage.removeItem('voxnote-library-bookmarks'); }
    if (type === 'schedule') { ['ss-timetable','ss-assignments','ss-cie','ss-finals','ss-vivas','ss-attendance'].forEach(k => localStorage.removeItem(k)); }
    if (type === 'all')      { const keep = ['voxnote-settings','voxnote-theme','voxnote-profile']; Object.keys(localStorage).filter(k => !keep.includes(k)).forEach(k => localStorage.removeItem(k)); }
    setClearConfirm(null);
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  const exportData = () => {
    const data = {};
    ['voxnote-chat-history','voxnote-library-notes','ss-timetable','ss-assignments','ss-cie','ss-finals','ss-vivas','ss-attendance','voxnote-profile'].forEach(k => {
      const v = localStorage.getItem(k);
      if (v) data[k] = JSON.parse(v);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `voxnote-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="pm-backdrop" onClick={onClose}>
      <div className="pm-modal st-modal" onClick={e => e.stopPropagation()}>
        <div className="pm-header">
          <div className="pm-header-title"><Settings size={18} /><span>Settings</span></div>
          <button className="pm-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="st-body">
          {/* Sidebar */}
          <aside className="st-sidebar">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              return (
                <button key={s.id} onClick={() => setSection(s.id)} className={`st-nav-item ${section === s.id ? 'active' : ''}`}>
                  <Icon size={16} /> <span>{s.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Content */}
          <div className="st-content">

            {/* ── Appearance ── */}
            {section === 'appearance' && (
              <div className="st-section">
                <div className="st-section-title">Appearance</div>

                <SettingRow label="Theme" description="Choose your preferred color scheme">
                  <div className="st-theme-picker">
                    {[
                      { id: 'dark',  label: 'Dark',  icon: Moon },
                      { id: 'light', label: 'Light', icon: Sun },
                    ].map(t => {
                      const Icon = t.icon;
                      return (
                        <button key={t.id} onClick={() => set('theme', t.id)} className={`st-theme-btn ${prefs.theme === t.id ? 'active' : ''}`}>
                          <Icon size={16} /> {t.label}
                        </button>
                      );
                    })}
                  </div>
                </SettingRow>

                <SettingRow label="Smooth Scrolling" description="Enable Lenis smooth scroll animation">
                  <Toggle value={prefs.smoothScroll} onChange={v => set('smoothScroll', v)} />
                </SettingRow>

                <SettingRow label="Animations" description="Enable UI transitions and micro-animations">
                  <Toggle value={prefs.animationsEnabled} onChange={v => set('animationsEnabled', v)} />
                </SettingRow>

                <SettingRow label="Compact Mode" description="Reduce spacing for a denser layout">
                  <Toggle value={prefs.compactMode} onChange={v => set('compactMode', v)} />
                </SettingRow>
              </div>
            )}

            {/* ── Dashboard ── */}
            {section === 'dashboard' && (
              <div className="st-section">
                <div className="st-section-title">Dashboard</div>

                <SettingRow label="Default Dashboard" description="Which dashboard opens on launch">
                  <select className="pm-input st-select" value={prefs.defaultDashboard} onChange={e => set('defaultDashboard', e.target.value)}>
                    <option value="focus">Focus Mode</option>
                    <option value="chat">Open Chat</option>
                    <option value="library">Smart Library</option>
                    <option value="schedule">Smart Schedule</option>
                  </select>
                </SettingRow>

                <SettingRow label="Auto-save Chat" description="Automatically persist conversation history">
                  <Toggle value={prefs.autoSaveChat} onChange={v => set('autoSaveChat', v)} />
                </SettingRow>
              </div>
            )}

            {/* ── AI ── */}
            {section === 'ai' && (
              <div className="st-section">
                <div className="st-section-title">AI & Models</div>

                <SettingRow label="Chat Model" description="Model used in the Open Chat dashboard">
                  <select className="pm-input st-select" value={prefs.aiModel} onChange={e => set('aiModel', e.target.value)}>
                    <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Default)</option>
                    <option value="llama-3.1-8b-instant">Llama 3.1 8B (Fast)</option>
                    <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                    <option value="gemma2-9b-it">Gemma 2 9B</option>
                  </select>
                </SettingRow>

                <div className="st-info-card">
                  <Brain size={16} />
                  <div>
                    <strong>Powered by Groq</strong>
                    <div style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: 4 }}>All AI requests are processed via Groq's ultra-fast inference API. Your conversations are not stored on any external server.</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Notifications ── */}
            {section === 'notifications' && (
              <div className="st-section">
                <div className="st-section-title">Notifications</div>

                <SettingRow label="Assignment Deadlines" description="Alert when assignments are due soon">
                  <Toggle value={prefs.notifyAssignments} onChange={v => set('notifyAssignments', v)} />
                </SettingRow>

                <SettingRow label="Exam Reminders" description="Notify before CIE, Finals, and Vivas">
                  <Toggle value={prefs.notifyExams} onChange={v => set('notifyExams', v)} />
                </SettingRow>

                <SettingRow label="Low Attendance Alert" description="Warn when attendance drops below 75%">
                  <Toggle value={prefs.notifyAttendance} onChange={v => set('notifyAttendance', v)} />
                </SettingRow>

                <div className="st-info-card">
                  <Bell size={16} />
                  <div>
                    <strong>Browser Notifications</strong>
                    <div style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: 4 }}>Notifications are shown as in-app alerts. Browser push notifications require explicit permission.</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Data & Privacy ── */}
            {section === 'data' && (
              <div className="st-section">
                <div className="st-section-title">Data & Privacy</div>

                {cleared && (
                  <div className="st-success-banner"><Check size={15} /> Data cleared successfully.</div>
                )}

                <SettingRow label="Export All Data" description="Download a JSON backup of all your VoxNote data">
                  <button className="st-action-btn" onClick={exportData}><Download size={15} /> Export</button>
                </SettingRow>

                <div className="st-divider" />
                <div className="st-section-title" style={{ fontSize: '0.8rem', color: '#ef4444' }}>Danger Zone</div>

                {[
                  { id: 'chat',     label: 'Clear Chat History',    desc: 'Deletes all Open Chat conversations' },
                  { id: 'library',  label: 'Clear Library Data',    desc: 'Removes all uploaded notes and bookmarks' },
                  { id: 'schedule', label: 'Clear Schedule Data',   desc: 'Resets timetable, assignments, and attendance' },
                  { id: 'all',      label: 'Clear All App Data',    desc: 'Factory reset — cannot be undone' },
                ].map(item => (
                  <SettingRow key={item.id} label={item.label} description={item.desc}>
                    {clearConfirm === item.id ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="st-action-btn danger" onClick={() => clearData(item.id)}>Confirm</button>
                        <button className="st-action-btn" onClick={() => setClearConfirm(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button className="st-action-btn danger" onClick={() => setClearConfirm(item.id)}>
                        <Trash2 size={14} /> Clear
                      </button>
                    )}
                  </SettingRow>
                ))}

                <div className="st-info-card" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
                  <AlertTriangle size={16} color="#ef4444" />
                  <div style={{ color: '#ef4444' }}>
                    <strong>All data is stored locally</strong>
                    <div style={{ fontSize: '0.78rem', opacity: 0.7, marginTop: 4, color: 'var(--text-secondary)' }}>VoxNote stores all your notes, schedule, and preferences in your browser's localStorage. Clearing browser data will erase everything.</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
