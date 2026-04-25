"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Bell, CheckCircle, Circle, AlertTriangle,
  Plus, Trash2, X, ChevronLeft, ChevronRight, BookOpen,
  Target, TrendingUp, TrendingDown, Activity, Award,
  Edit3, Save, BarChart2, Zap, AlertCircle, Check, ListTodo,
  BookMarked, GraduationCap
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 13 }, (_, i) => { const h = 8 + i; return `${h.toString().padStart(2, '0')}:00`; });
const PRIORITY_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' };

const todayName = () => { const d = new Date(); return DAYS[d.getDay() - 1] || 'Monday'; };
const todayStr = () => new Date().toISOString().split('T')[0];

const daysUntil = (dateStr) => {
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
};
const pct = (presented, total) => total === 0 ? 0 : Math.min(100, Math.round((presented / total) * 100));

function CountdownBadge({ date }) {
  const days = daysUntil(date);
  if (isNaN(days)) return null;
  const color = days <= 0 ? '#ef4444' : days <= 3 ? '#f59e0b' : days <= 7 ? '#8b5cf6' : '#22c55e';
  return (
    <span className="ss-countdown" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
      {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `${days}d left`}
    </span>
  );
}

// ─── Custom Todos Sub-Component ─────────────────────────────────────────────
function CustomTodos({ todos, onSave, todoState, onToggle }) {
  const [newTask, setNewTask] = useState('');

  const addTask = () => {
    const text = newTask.trim();
    if (!text) return;
    onSave([...todos, { id: Date.now().toString(), text, createdAt: todayStr() }]);
    setNewTask('');
  };

  const removeTask = (id) => onSave(todos.filter(t => t.id !== id));

  return (
    <div className="ss-todo-group">
      <div className="ss-todo-group-label"><Edit3 size={13} /> My Tasks</div>
      <div className="ss-custom-add-row">
        <input
          className="sl-input ss-custom-input"
          placeholder="Add a task…"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
        />
        <button className="ss-custom-add-btn" onClick={addTask} disabled={!newTask.trim()}>
          <Plus size={14} />
        </button>
      </div>
      {todos.map(t => {
        const isDone = !!todoState[`custom_${t.id}`];
        return (
          <div key={t.id} className={`ss-todo-item custom ${isDone ? 'done' : ''}`}>
            <button onClick={() => onToggle(`custom_${t.id}`)} className="ss-todo-check">
              {isDone ? <CheckCircle size={18} color="#22c55e" /> : <Circle size={18} color="#a78bfa" />}
            </button>
            <div className="ss-todo-info">
              <div className="ss-todo-title" style={{ textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1 }}>{t.text}</div>
            </div>
            <button onClick={() => removeTask(t.id)} className="ss-del-btn" title="Remove"><Trash2 size={14} /></button>
          </div>
        );
      })}
      {todos.length === 0 && (
        <div style={{ fontSize: '0.78rem', opacity: 0.45, padding: '6px 0', textAlign: 'center' }}>No custom tasks yet</div>
      )}
    </div>
  );
}

// ─── Today's To-Do ──────────────────────────────────────────────────────────
function TodayTodo({ timetable, assignments, cie, finals, vivas, todoState, onToggle, customTodos, onSaveCustomTodos, onRemoveTask }) {
  const day = todayName();
  const dateS = todayStr();
  const slots = timetable[day] || [];

  // Today's events
  const todayCie    = cie.filter(e => e.date === dateS);
  const todayFinals = finals.filter(e => e.date === dateS);
  const todayVivas  = vivas.filter(e => e.date === dateS);
  const todayAssign = assignments.filter(a => a.due === dateS && a.status === 'Pending');

  // Upcoming events (within 7 days, not today)
  const upcomingCie    = cie.filter(e => { const d = daysUntil(e.date); return d > 0 && d <= 7; });
  const upcomingFinals = finals.filter(e => { const d = daysUntil(e.date); return d > 0 && d <= 7; });
  const upcomingVivas  = vivas.filter(e => { const d = daysUntil(e.date); return d > 0 && d <= 7; });
  const dueAssign      = assignments.filter(a => { const d = daysUntil(a.due); return d > 0 && d <= 3 && a.status === 'Pending'; });

  const renderItem = (id, color, title, meta, typeLabel, typeClass, onDelete) => {
    const isDone = !!todoState[id];
    return (
      <div key={id} className={`ss-todo-item ${typeClass} ${isDone ? 'done' : ''}`}>
        <button onClick={() => onToggle(id)} className="ss-todo-check" style={isDone ? {} : { borderColor: color }}>
          {isDone ? <CheckCircle size={18} color="#22c55e" /> : <Circle size={18} color={color} />}
        </button>
        <div className="ss-todo-info">
          <div className="ss-todo-title" style={{ textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1 }}>{title}</div>
          {meta && <div className="ss-todo-meta" style={{ opacity: isDone ? 0.4 : undefined }}>{meta}</div>}
        </div>
        {!isDone && <span className={`ss-todo-badge ${typeClass}`}>{typeLabel}</span>}
        {onDelete && (
          <button onClick={() => onDelete()} className="ss-del-btn" title="Delete Task" style={{ marginLeft: '8px' }}>
            <Trash2 size={14} />
          </button>
        )}
      </div>
    );
  };

  // Check if there's any section to show at all (custom todos always show)
  const hasCie = todayCie.length > 0 || upcomingCie.length > 0;
  const hasFinals = todayFinals.length > 0 || upcomingFinals.length > 0;
  const hasVivas = todayVivas.length > 0 || upcomingVivas.length > 0;
  const hasAssign = todayAssign.length > 0 || dueAssign.length > 0;

  return (
    <div className="ss-section">
      <div className="ss-section-header">
        <div className="ss-section-title"><ListTodo size={18} /> Today's To-Do</div>
        <div className="ss-section-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {new Date().toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
      <div className="ss-todo-body" style={{ padding: '0 4px', gap: '16px' }}>

        {/* ── Lectures ── */}
        {slots.length > 0 && (
          <div className="ss-todo-group">
            <div className="ss-todo-group-label"><Clock size={13} /> Today's Lectures</div>
            {slots.map(s => renderItem(
              `lecture_${dateS}_${s.time}_${s.subject}`, '#8b5cf6', s.subject,
              `${s.time}${s.room ? ` · Room ${s.room}` : ''}${s.faculty ? ` · ${s.faculty}` : ''}`,
              'Lecture', 'lecture'
            ))}
          </div>
        )}

        {/* ── CIE / Internals ── */}
        {hasCie && (
          <div className="ss-todo-group">
            <div className="ss-todo-group-label"><BookMarked size={13} /> CIE / Internals</div>
            {todayCie.map(e => renderItem(
              `cie_${dateS}_${e.id}`, '#f59e0b',
              `${e.label ? `${e.label} — ` : ''}${e.subject}`, e.notes || 'Scheduled today',
              'Today', 'cie', () => onRemoveTask('cie', e.id)
            ))}
            {upcomingCie.map(e => renderItem(
              `upcoming_cie_${e.id}`, '#f59e0b',
              `${e.label ? `${e.label} — ` : ''}${e.subject}`,
              `In ${daysUntil(e.date)} day${daysUntil(e.date) === 1 ? '' : 's'} · ${e.date}`,
              'CIE', 'cie', () => onRemoveTask('cie', e.id)
            ))}
          </div>
        )}

        {/* ── Final Exams ── */}
        {hasFinals && (
          <div className="ss-todo-group">
            <div className="ss-todo-group-label"><GraduationCap size={13} /> Final Exams</div>
            {todayFinals.map(e => renderItem(
              `final_${dateS}_${e.id}`, '#ef4444',
              `${e.label ? `${e.label} — ` : ''}${e.subject}`, e.notes || 'Scheduled today',
              'Today', 'final', () => onRemoveTask('final', e.id)
            ))}
            {upcomingFinals.map(e => renderItem(
              `upcoming_final_${e.id}`, '#ef4444',
              `${e.label ? `${e.label} — ` : ''}${e.subject}`,
              `In ${daysUntil(e.date)} day${daysUntil(e.date) === 1 ? '' : 's'} · ${e.date}`,
              'Exam', 'final', () => onRemoveTask('final', e.id)
            ))}
          </div>
        )}

        {/* ── Vivas ── */}
        {hasVivas && (
          <div className="ss-todo-group">
            <div className="ss-todo-group-label"><Target size={13} /> Vivas</div>
            {todayVivas.map(e => renderItem(
              `viva_${dateS}_${e.id}`, '#06b6d4',
              `${e.label ? `${e.label} — ` : ''}${e.subject}`, e.notes || 'Scheduled today',
              'Today', 'viva', () => onRemoveTask('viva', e.id)
            ))}
            {upcomingVivas.map(e => renderItem(
              `upcoming_viva_${e.id}`, '#06b6d4',
              `${e.label ? `${e.label} — ` : ''}${e.subject}`,
              `In ${daysUntil(e.date)} day${daysUntil(e.date) === 1 ? '' : 's'} · ${e.date}`,
              'Viva', 'viva', () => onRemoveTask('viva', e.id)
            ))}
          </div>
        )}

        {/* ── Assignments ── */}
        {hasAssign && (
          <div className="ss-todo-group">
            <div className="ss-todo-group-label"><CheckCircle size={13} /> Assignments</div>
            {todayAssign.map(a => renderItem(
              `assign_${a.id}`, PRIORITY_COLORS[a.priority], a.title,
              `${a.subject} · Due Today`, 'Due Today', 'assign', () => onRemoveTask('assignment', a.id)
            ))}
            {dueAssign.map(a => renderItem(
              `assign_${a.id}`, PRIORITY_COLORS[a.priority], a.title,
              `${a.subject} · Due ${a.due}`, `Due in ${daysUntil(a.due)}d`, 'assign', () => onRemoveTask('assignment', a.id)
            ))}
          </div>
        )}

        {/* ── Custom Tasks ── */}
        <CustomTodos todos={customTodos} onSave={onSaveCustomTodos} todoState={todoState} onToggle={onToggle} />

      </div>
    </div>
  );
}


// ─── Timetable ──────────────────────────────────────────────────────────────
function Timetable({ data, onSave, attendance, onSaveAttendance, assignments, cie, finals, vivas }) {
  const [draft, setDraft] = useState(data);
  const [addSlot, setAddSlot] = useState(null);
  const [form, setForm] = useState({ day: 'Monday', time: '09:00', subject: '', room: '', faculty: '' });
  const todaySlots = (data[todayName()] || []);

  // Auto-sync: when a slot is added, ensure subject exists in attendance
  const syncAttendance = (updatedTimetable, newSubject) => {
    const allSubjects = new Set();
    Object.values(updatedTimetable).forEach(slots => slots.forEach(s => allSubjects.add(s.subject)));

    // For each subject in timetable, ensure it's in attendance
    let updatedAtt = [...attendance];
    let changed = false;
    allSubjects.forEach(sub => {
      if (!updatedAtt.find(r => r.subject === sub)) {
        updatedAtt.push({ id: Date.now().toString() + Math.random(), subject: sub, totalLectures: 0, presentedLectures: 0, log: [] });
        changed = true;
      }
    });
    if (changed) onSaveAttendance(updatedAtt);
  };

  const addEntry = () => {
    const newSlot = { time: form.time, subject: form.subject, room: form.room, faculty: form.faculty };
    const updated = {
      ...draft,
      [form.day]: [...(draft[form.day] || []), newSlot].sort((a, b) => a.time.localeCompare(b.time))
    };
    setDraft(updated);
    onSave(updated);
    // Auto-sync attendance
    syncAttendance(updated, form.subject);
    setAddSlot(null);
    setForm({ day: 'Monday', time: '09:00', subject: '', room: '', faculty: '' });
  };

  const remove = (day, i) => {
    const d = { ...draft, [day]: [...draft[day]] };
    d[day].splice(i, 1);
    setDraft(d);
    onSave(d);
  };

  const now = new Date();
  const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const nextClass = todaySlots.find(s => s.time > nowStr);

  return (
    <div className="ss-section">
      <div className="ss-section-header">
        <div className="ss-section-title"><Calendar size={18} /> Timetable</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="ss-action-btn" onClick={() => setAddSlot(true)}><Plus size={15} /> Add Slot</button>
        </div>
      </div>
      {nextClass && (
        <div className="ss-next-class-banner">
          <Zap size={16} color="#8b5cf6" />
          <span>Next: <strong>{nextClass.subject}</strong> at {nextClass.time}{nextClass.room && ` · ${nextClass.room}`}</span>
        </div>
      )}

      <div className="ss-timetable-grid">
        {DAYS.map(day => (
          <div key={day} className={`ss-day-col ${day === todayName() ? 'today' : ''}`}>
            <div className="ss-day-header">{day.slice(0, 3)}{day === todayName() && <span className="ss-today-dot" />}</div>
            <div className="ss-day-slots">
              {(draft[day] || []).map((slot, i) => (
                <div key={i} className="ss-slot">
                  <div className="ss-slot-time">{slot.time}</div>
                  <div className="ss-slot-subject">{slot.subject}</div>
                  {slot.room && <div className="ss-slot-room">Room {slot.room}</div>}
                  {slot.faculty && <div className="ss-slot-faculty">{slot.faculty}</div>}
                  <button onClick={() => remove(day, i)} className="ss-slot-del"><X size={11} /></button>
                </div>
              ))}
              {(draft[day] || []).length === 0 && <div className="ss-slot-empty">Free</div>}
            </div>
          </div>
        ))}
      </div>

      {addSlot && (
        <div className="sl-modal-backdrop" onClick={() => setAddSlot(null)}>
          <div className="sl-modal" onClick={e => e.stopPropagation()}>
            <div className="sl-modal-header"><h3><Plus size={16} /> Add Timetable Slot</h3><button onClick={() => setAddSlot(null)}><X size={18} /></button></div>
            <div className="sl-modal-body">
              <div className="sl-form-row">
                <div className="sl-form-group"><label>Day</label><select className="sl-input" value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}>{DAYS.map(d => <option key={d}>{d}</option>)}</select></div>
                <div className="sl-form-group"><label>Time</label><select className="sl-input" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}>{HOURS.map(h => <option key={h}>{h}</option>)}</select></div>
              </div>
              <div className="sl-form-group"><label>Subject *</label><input className="sl-input" placeholder="e.g. DBMS" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
              <div className="sl-form-row">
                <div className="sl-form-group"><label>Room</label><input className="sl-input" placeholder="Optional" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} /></div>
                <div className="sl-form-group"><label>Faculty</label><input className="sl-input" placeholder="Optional" value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })} /></div>
              </div>
              <div className="ss-att-sync-note"><Check size={12} /> Subject will be auto-added to Attendance tracker</div>
            </div>
            <div className="sl-modal-footer">
              <button className="sl-btn-ghost" onClick={() => setAddSlot(null)}>Cancel</button>
              <button className="sl-btn-primary" onClick={addEntry} disabled={!form.subject}><Plus size={14} /> Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Assignments ─────────────────────────────────────────────────────────────
function Assignments({ items, onSave }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', due: '', priority: 'Medium' });
  const add = () => {
    if (!form.title || !form.due) return;
    onSave([...items, { id: Date.now().toString(), ...form, status: 'Pending' }]);
    setForm({ title: '', subject: '', due: '', priority: 'Medium' }); setShowAdd(false);
  };
  const toggle = id => onSave(items.map(a => a.id === id ? { ...a, status: a.status === 'Pending' ? 'Completed' : 'Pending' } : a));
  const del = id => onSave(items.filter(a => a.id !== id));

  const pending = items.filter(a => a.status === 'Pending').sort((a, b) => new Date(a.due) - new Date(b.due));
  const done = items.filter(a => a.status === 'Completed');

  return (
    <div className="ss-section">
      <div className="ss-section-header">
        <div className="ss-section-title"><CheckCircle size={18} /> Assignments</div>
        <button className="ss-action-btn" onClick={() => setShowAdd(true)}><Plus size={15} /> Add</button>
      </div>
      <div className="ss-list">
        {pending.map(a => (
          <div key={a.id} className="ss-item">
            <button onClick={() => toggle(a.id)} className="ss-check"><Circle size={18} /></button>
            <div className="ss-item-body">
              <div className="ss-item-title">{a.title}</div>
              <div className="ss-item-meta">{a.subject} · Due {a.due}</div>
            </div>
            <CountdownBadge date={a.due} />
            <span className="ss-priority-dot" style={{ background: PRIORITY_COLORS[a.priority] }} title={a.priority} />
            <button onClick={() => del(a.id)} className="ss-del-btn"><Trash2 size={14} /></button>
          </div>
        ))}
        {done.map(a => (
          <div key={a.id} className="ss-item done">
            <button onClick={() => toggle(a.id)} className="ss-check done"><CheckCircle size={18} /></button>
            <div className="ss-item-body"><div className="ss-item-title">{a.title}</div><div className="ss-item-meta">{a.subject}</div></div>
            <button onClick={() => del(a.id)} className="ss-del-btn"><Trash2 size={14} /></button>
          </div>
        ))}
        {items.length === 0 && <div className="ss-empty">No assignments yet</div>}
      </div>
      {showAdd && (
        <div className="sl-modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="sl-modal" onClick={e => e.stopPropagation()}>
            <div className="sl-modal-header"><h3>Add Assignment</h3><button onClick={() => setShowAdd(false)}><X size={18} /></button></div>
            <div className="sl-modal-body">
              <div className="sl-form-group"><label>Title *</label><input className="sl-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. DBMS Mini Project" /></div>
              <div className="sl-form-row">
                <div className="sl-form-group"><label>Subject</label><input className="sl-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Subject" /></div>
                <div className="sl-form-group"><label>Due Date *</label><input type="date" className="sl-input" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} onClick={e => e.target.showPicker?.()} /></div>
              </div>
              <div className="sl-form-group"><label>Priority</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['High', 'Medium', 'Low'].map(p => (
                    <button key={p} onClick={() => setForm({ ...form, priority: p })} className={`ss-priority-btn ${form.priority === p ? 'active' : ''}`} style={{ borderColor: PRIORITY_COLORS[p], color: form.priority === p ? 'white' : '', background: form.priority === p ? PRIORITY_COLORS[p] : '' }}>​{p}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="sl-modal-footer"><button className="sl-btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button><button className="sl-btn-primary" onClick={add} disabled={!form.title || !form.due}><Plus size={14} /> Add</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Exams (CIE / Finals / Vivas) ────────────────────────────────────────────
function Exams({ items, onSave, title, icon: Icon }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ label: '', subject: '', date: '', notes: '' });
  const add = () => { if (!form.subject || !form.date) return; onSave([...items, { id: Date.now().toString(), ...form }]); setForm({ label: '', subject: '', date: '', notes: '' }); setShowAdd(false); };
  const del = id => onSave(items.filter(e => e.id !== id));
  const sorted = [...items].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="ss-section">
      <div className="ss-section-header">
        <div className="ss-section-title"><Icon size={18} /> {title}</div>
        <button className="ss-action-btn" onClick={() => setShowAdd(true)}><Plus size={15} /> Add</button>
      </div>
      <div className="ss-list">
        {sorted.map(e => (
          <div key={e.id} className="ss-item">
            <div className="ss-item-icon-wrap"><Target size={16} /></div>
            <div className="ss-item-body">
              <div className="ss-item-title">{e.label ? `${e.label} — ` : ''}{e.subject}</div>
              {e.notes && <div className="ss-item-meta">{e.notes}</div>}
              <div className="ss-item-meta">{e.date}</div>
            </div>
            <CountdownBadge date={e.date} />
            <button onClick={() => del(e.id)} className="ss-del-btn"><Trash2 size={14} /></button>
          </div>
        ))}
        {items.length === 0 && <div className="ss-empty">No {title.toLowerCase()} scheduled</div>}
      </div>
      {showAdd && (
        <div className="sl-modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="sl-modal" onClick={e => e.stopPropagation()}>
            <div className="sl-modal-header"><h3>Add {title}</h3><button onClick={() => setShowAdd(false)}><X size={18} /></button></div>
            <div className="sl-modal-body">
              <div className="sl-form-row">
                <div className="sl-form-group"><label>Label</label><input className="sl-input" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. CIE 1" /></div>
                <div className="sl-form-group"><label>Subject *</label><input className="sl-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Subject" /></div>
              </div>
              <div className="sl-form-group"><label>Date *</label><input type="date" className="sl-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} onClick={e => e.target.showPicker?.()} /></div>
              <div className="sl-form-group"><label>Notes</label><input className="sl-input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" /></div>
            </div>
            <div className="sl-modal-footer"><button className="sl-btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button><button className="sl-btn-primary" onClick={add} disabled={!form.subject || !form.date}><Plus size={14} /> Add</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Attendance ───────────────────────────────────────────────────────────────
function Attendance({ records, onSave }) {
  // form now uses totalLectures + presentedLectures
  const [form, setForm] = useState({ subject: '', totalLectures: 0, presentedLectures: 0 });
  const [showAdd, setShowAdd] = useState(false);

  const add = () => {
    if (!form.subject) return;
    const total = Math.max(0, +form.totalLectures);
    const presented = Math.min(total, Math.max(0, +form.presentedLectures));
    onSave([...records, {
      id: Date.now().toString(),
      subject: form.subject,
      totalLectures: total,
      presentedLectures: presented,
      log: []
    }]);
    setForm({ subject: '', totalLectures: 0, presentedLectures: 0 });
    setShowAdd(false);
  };

  const del = id => onSave(records.filter(r => r.id !== id));

  // Mark absent: total goes up by 1, presented stays (so one more absent counted)
  const markAbsent = (id) => {
    onSave(records.map(r => r.id === id ? {
      ...r,
      totalLectures: (r.totalLectures || 0) + 1,
      // presentedLectures stays same — this lecture was absent
      log: [...(r.log || []), { date: todayStr(), val: 'A' }]
    } : r));
  };

  // Can also undo last entry
  const undoLast = (id) => {
    onSave(records.map(r => {
      if (r.id !== id) return r;
      const log = [...(r.log || [])];
      if (!log.length) return r;
      const last = log.pop();
      return {
        ...r,
        totalLectures: Math.max(0, (r.totalLectures || 0) - 1),
        presentedLectures: last.val === 'P' ? Math.max(0, (r.presentedLectures || 0) - 1) : r.presentedLectures,
        log
      };
    }));
  };

  return (
    <div className="ss-section">
      <div className="ss-section-header">
        <div className="ss-section-title"><Activity size={18} /> Attendance Tracker</div>
        <button className="ss-action-btn" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Subject</button>
      </div>

      {records.length > 0 && (
        <div className="ss-att-hint">
          <Zap size={13} color="#8b5cf6" />
          <span>Subjects added from timetable are tracked automatically. By default, all lectures are <strong>Present</strong> — only mark <strong>Absent</strong> if you missed one.</span>
        </div>
      )}

      <div className="ss-attendance-grid">
        {records.map(r => {
          const total = r.totalLectures || 0;
          const presented = Math.min(r.presentedLectures || 0, total);
          const absent = total - presented;
          const p = pct(presented, total);
          const color = p >= 75 ? '#22c55e' : p >= 60 ? '#f59e0b' : '#ef4444';
          const safe = total === 0 ? 0 : Math.max(0, Math.floor((presented - 0.75 * total) / 0.25));
          const need = Math.max(0, Math.ceil((0.75 * total - presented) / 0.25));

          return (
            <div key={r.id} className="ss-att-card">
              <div className="ss-att-header">
                <div className="ss-att-subject">{r.subject}</div>
                <div className="ss-att-pct" style={{ color }}>{total === 0 ? '—' : p + '%'}</div>
              </div>
              <div className="ss-att-bar-bg">
                <div className="ss-att-bar" style={{ width: `${p}%`, background: color }} />
              </div>
              <div className="ss-att-stats-row">
                <div className="ss-att-stat-chip">
                  <div className="ss-att-stat-val">{total}</div>
                  <div className="ss-att-stat-label">Total</div>
                </div>
                <div className="ss-att-stat-chip" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
                  <div className="ss-att-stat-val" style={{ color: '#22c55e' }}>{presented}</div>
                  <div className="ss-att-stat-label">Present</div>
                </div>
                <div className="ss-att-stat-chip" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
                  <div className="ss-att-stat-val" style={{ color: '#ef4444' }}>{absent}</div>
                  <div className="ss-att-stat-label">Absent</div>
                </div>
              </div>
              {total > 0 && (
                <div className="ss-att-presenty">
                  {p >= 75
                    ? <span style={{ color: '#22c55e' }}>✓ Safe to bunk {safe} more class{safe !== 1 ? 'es' : ''}</span>
                    : <span style={{ color: '#f59e0b' }}>⚠ Need {need} more class{need !== 1 ? 'es' : ''} to reach 75%</span>}
                </div>
              )}
              <div className="ss-att-actions">
                <button className="ss-att-mark absent" onClick={() => markAbsent(r.id)}>
                  <X size={13} /> Mark Absent
                </button>
                {r.log?.length > 0 && (
                  <button className="ss-att-undo" onClick={() => undoLast(r.id)} title="Undo last entry">
                    ↩ Undo
                  </button>
                )}
                <button className="ss-del-btn" onClick={() => del(r.id)}><Trash2 size={13} /></button>
              </div>
            </div>
          );
        })}
        {records.length === 0 && (
          <div className="ss-att-empty-state">
            <Activity size={36} style={{ opacity: 0.15, marginBottom: '12px' }} />
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>No subjects tracked yet</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Add a timetable slot to auto-track attendance, or add a subject manually.</div>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="sl-modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="sl-modal" onClick={e => e.stopPropagation()}>
            <div className="sl-modal-header"><h3>Add Subject</h3><button onClick={() => setShowAdd(false)}><X size={18} /></button></div>
            <div className="sl-modal-body">
              <div className="sl-form-group"><label>Subject *</label><input className="sl-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. DBMS" /></div>
              <div className="sl-form-row">
                <div className="sl-form-group">
                  <label>Total Lectures</label>
                  <input type="number" min="0" className="sl-input" value={form.totalLectures} onChange={e => setForm({ ...form, totalLectures: +e.target.value })} />
                </div>
                <div className="sl-form-group">
                  <label>Presented Lectures</label>
                  <input type="number" min="0" className="sl-input" value={form.presentedLectures} onChange={e => setForm({ ...form, presentedLectures: +e.target.value })} />
                </div>
              </div>
              <div className="ss-att-sync-note"><Check size={12} /> New timetable slots auto-add subjects here</div>
            </div>
            <div className="sl-modal-footer"><button className="sl-btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button><button className="sl-btn-primary" onClick={add} disabled={!form.subject}><Plus size={14} /> Add</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Day Detail Modal ─────────────────────────────────────────────────────────
function DayDetailModal({ dateStr, events, onClose, onAddCie, onAddAssignment, onAddViva, onAddFinal, onRemoveEvent }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState('cie');
  const [form, setForm] = useState({ subject: '', label: '', title: '', notes: '', priority: 'Medium' });

  const TYPE_OPTS = [
    { id: 'cie', label: 'CIE / Internal', color: '#f59e0b' },
    { id: 'assignment', label: 'Assignment', color: '#8b5cf6' },
    { id: 'viva', label: 'Viva', color: '#06b6d4' },
    { id: 'final', label: 'Final Exam', color: '#ef4444' },
  ];

  const handleAdd = () => {
    const id = Date.now().toString();
    if (addType === 'cie') onAddCie({ id, subject: form.subject, label: form.label, date: dateStr, notes: form.notes });
    if (addType === 'assignment') onAddAssignment({ id, title: form.title, subject: form.subject, due: dateStr, priority: form.priority, status: 'Pending' });
    if (addType === 'viva') onAddViva({ id, subject: form.subject, label: form.label, date: dateStr, notes: form.notes });
    if (addType === 'final') onAddFinal({ id, subject: form.subject, label: form.label, date: dateStr, notes: form.notes });
    setForm({ subject: '', label: '', title: '', notes: '', priority: 'Medium' });
    setShowAddForm(false);
  };

  const isValid = addType === 'assignment' ? (form.title && form.subject) : form.subject;
  const dateLabel = new Date(dateStr + 'T00:00:00').toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="sl-modal-backdrop" onClick={onClose}>
      <div className="sl-modal ss-day-modal" onClick={e => e.stopPropagation()}>
        <div className="sl-modal-header">
          <h3><Calendar size={16} /> {dateLabel}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="sl-modal-body" style={{ gap: '16px' }}>
          {!showAddForm ? (
            <>
              {events.length === 0 ? (
                <div className="ss-day-empty">
                  <Calendar size={32} style={{ opacity: 0.2, marginBottom: '10px' }} />
                  <div>No events on this day</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.5 }}>Click "Add Event" to schedule something</div>
                </div>
              ) : (
                <div className="ss-day-events-list">
                  {events.map((ev, i) => (
                    <div key={i} className="ss-day-event-row">
                      <div className="ss-day-event-accent" style={{ backgroundColor: ev.color }} />
                      <div className="ss-day-event-info">
                        <div className="ss-day-event-label">{ev.label}</div>
                        <div className="ss-day-event-type">{ev.typeName}</div>
                      </div>
                      <button className="ss-del-btn" onClick={() => onRemoveEvent(ev.type, ev.id)} title="Remove Event">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="ss-day-add-form">
              <div className="ss-type-chips-container">
                {TYPE_OPTS.map(t => (
                  <button key={t.id} onClick={() => setAddType(t.id)}
                    className={`ss-type-chip ${addType === t.id ? 'active' : ''}`}
                    style={{ '--type-color': t.color }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="ss-form-container">
                {addType === 'assignment' ? (
                  <>
                    <div className="sl-form-group">
                      <label>Title *</label>
                      <input className="sl-input" placeholder="e.g. DBMS Mini Project" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div className="sl-form-row">
                      <div className="sl-form-group">
                        <label>Subject</label>
                        <input className="sl-input" placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                      </div>
                      <div className="sl-form-group">
                        <label>Priority</label>
                        <select className="sl-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                          {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="sl-form-row">
                      <div className="sl-form-group">
                        <label>Label</label>
                        <input className="sl-input" placeholder="e.g. CIE 1" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
                      </div>
                      <div className="sl-form-group">
                        <label>Subject *</label>
                        <input className="sl-input" placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                      </div>
                    </div>
                    <div className="sl-form-group">
                      <label>Notes</label>
                      <input className="sl-input" placeholder="Optional notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="sl-modal-footer">
          {showAddForm ? (
            <>
              <button className="sl-btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className="sl-btn-primary" onClick={handleAdd} disabled={!isValid}><Plus size={14} /> Save</button>
            </>
          ) : (
            <>
              <button className="sl-btn-ghost" onClick={onClose}>Close</button>
              <button className="sl-btn-primary" onClick={() => setShowAddForm(true)}><Plus size={14} /> Add Event</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Calendar View ───────────────────────────────────────────────────────────
function CalendarView({ assignments, cie, finals, vivas, onAddCie, onAddAssignment, onAddViva, onAddFinal, onRemoveEvent }) {
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const y = month.getFullYear(), m = month.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, i) => {
    const d = i - firstDay + 1;
    return d >= 1 && d <= daysInMonth ? d : null;
  });
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const allEvents = [
    ...assignments.map(a => ({ id: a.id, type: 'assignment', date: a.due, label: a.title, typeName: 'Assignment', color: '#8b5cf6' })),
    ...cie.map(e => ({ id: e.id, type: 'cie', date: e.date, label: (e.label ? `${e.label} — ` : '') + e.subject, typeName: 'CIE / Internal', color: '#f59e0b' })),
    ...finals.map(e => ({ id: e.id, type: 'final', date: e.date, label: (e.label ? `${e.label} — ` : '') + e.subject, typeName: 'Final Exam', color: '#ef4444' })),
    ...vivas.map(e => ({ id: e.id, type: 'viva', date: e.date, label: (e.label ? `${e.label} — ` : '') + e.subject, typeName: 'Viva', color: '#06b6d4' })),
  ];
  const getDateStr = (d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const getEvents = (d) => { const str = getDateStr(d); return allEvents.filter(e => e.date === str); };
  const todayObj = new Date();
  const isToday = (d) => d && todayObj.getFullYear() === y && todayObj.getMonth() === m && todayObj.getDate() === d;

  const handleDayClick = (d) => { if (d) setSelectedDay(d); };
  const selectedDateStr = selectedDay ? getDateStr(selectedDay) : null;
  const selectedEvents = selectedDay ? getEvents(selectedDay) : [];

  return (
    <div className="ss-section">
      <div className="ss-section-header">
        <div className="ss-section-title"><Calendar size={18} /> Calendar View</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="ss-nav-btn" onClick={() => setMonth(new Date(y, m - 1, 1))}><ChevronLeft size={16} /></button>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '120px', textAlign: 'center' }}>{month.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button className="ss-nav-btn" onClick={() => setMonth(new Date(y, m + 1, 1))}><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="ss-calendar">
        {DAY_NAMES.map(d => <div key={d} className="ss-cal-header">{d}</div>)}
        {cells.map((d, i) => {
          const evs = d ? getEvents(d) : [];
          return (
            <div key={i}
              className={`ss-cal-cell ${d ? 'active' : ''} ${isToday(d) ? 'today' : ''} ${d && evs.length > 0 ? 'has-events' : ''}`}
              onClick={() => handleDayClick(d)}
              style={d ? { cursor: 'pointer' } : {}}>
              {d && <>
                <div className="ss-cal-date">{d}</div>
                <div className="ss-cal-events">
                  {evs.slice(0, 3).map((ev, ei) => (
                    <div key={ei} className="ss-cal-event" style={{ background: `${ev.color}20`, color: ev.color, borderLeft: `2px solid ${ev.color}` }}>{ev.label}</div>
                  ))}
                  {evs.length > 3 && <div className="ss-cal-more">+{evs.length - 3} more</div>}
                </div>
              </>}
            </div>
          );
        })}
      </div>
      {selectedDay && (
        <DayDetailModal
          dateStr={selectedDateStr}
          events={selectedEvents}
          onClose={() => setSelectedDay(null)}
          onAddCie={onAddCie}
          onAddAssignment={onAddAssignment}
          onAddViva={onAddViva}
          onAddFinal={onAddFinal}
          onRemoveEvent={onRemoveEvent}
        />
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'timetable', label: 'Timetable', icon: Calendar },
  { id: 'assignments', label: 'Assignments', icon: CheckCircle },
  { id: 'cie', label: 'CIE / Internals', icon: BookOpen },
  { id: 'finals', label: 'Final Exams', icon: Award },
  { id: 'vivas', label: 'Vivas', icon: Target },
  { id: 'attendance', label: 'Attendance', icon: Activity },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'todo', label: "Today's To-Do", icon: ListTodo },
];

function load(key, def) { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; } catch { return def; } }

// ─── Migration helper: convert old {present, absent} → {totalLectures, presentedLectures}
function migrateAttendance(records) {
  return records.map(r => {
    if (r.totalLectures !== undefined) return r; // already new format
    const total = (r.present || 0) + (r.absent || 0);
    return { ...r, totalLectures: total, presentedLectures: r.present || 0 };
  });
}

export default function SmartSchedule() {
  const [activeSection, setActiveSection] = useState('timetable');
  const [timetable, setTimetable] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [cie, setCie] = useState([]);
  const [finals, setFinals] = useState([]);
  const [vivas, setVivas] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [todoState, setTodoState] = useState({});
  const [customTodos, setCustomTodos] = useState([]);

  useEffect(() => {
    setTimetable(load('ss-timetable', {}));
    setAssignments(load('ss-assignments', []));
    setCie(load('ss-cie', []));
    setFinals(load('ss-finals', []));
    setVivas(load('ss-vivas', []));
    setAttendance(migrateAttendance(load('ss-attendance', [])));
    setTodoState(load('ss-todo-state', {}));
    setCustomTodos(load('ss-custom-todos', []));
  }, []);

  const saveTimetable = v => { setTimetable(v); localStorage.setItem('ss-timetable', JSON.stringify(v)); };
  const saveAssignments = v => { setAssignments(v); localStorage.setItem('ss-assignments', JSON.stringify(v)); };
  const saveCie = v => { setCie(v); localStorage.setItem('ss-cie', JSON.stringify(v)); };
  const saveFinals = v => { setFinals(v); localStorage.setItem('ss-finals', JSON.stringify(v)); };
  const saveVivas = v => { setVivas(v); localStorage.setItem('ss-vivas', JSON.stringify(v)); };
  const saveAttendance = v => { setAttendance(v); localStorage.setItem('ss-attendance', JSON.stringify(v)); };
  const saveTodoState = v => { setTodoState(v); localStorage.setItem('ss-todo-state', JSON.stringify(v)); };
  const saveCustomTodos = v => { setCustomTodos(v); localStorage.setItem('ss-custom-todos', JSON.stringify(v)); };

  const toggleTodo = (id) => {
    saveTodoState({ ...todoState, [id]: !todoState[id] });
  };

  // Stats — use new fields
  const pending = assignments.filter(a => a.status === 'Pending');
  const overdue = pending.filter(a => daysUntil(a.due) < 0);
  const upcomingExams = [...cie, ...finals, ...vivas].filter(e => { const d = daysUntil(e.date); return d >= 0 && d <= 7; });
  const lowAtt = attendance.filter(r => pct(r.presentedLectures || 0, r.totalLectures || 0) < 75 && (r.totalLectures || 0) > 0);

  return (
    <div className="ss-layout">
      {/* Sidebar */}
      <aside className="ss-sidebar">
        <div className="sl-sidebar-brand">
          <div className="sl-brand-icon" style={{ background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)' }}><Calendar size={20} color="white" /></div>
          <div>
            <div className="sl-brand-title">Smart Schedule</div>
            <div className="sl-brand-sub">Academic Planner</div>
          </div>
        </div>

        <div className="ss-stats-row">
          <div className="ss-stat" style={{ borderColor: overdue.length ? '#ef4444' : '#333' }} title="Overdue Assignments">
            <AlertCircle size={14} color={overdue.length ? '#ef4444' : '#666'} />
            <span style={{ color: overdue.length ? '#ef4444' : 'inherit' }}>{overdue.length}</span>
            <span>Overdue</span>
          </div>
          <div className="ss-stat" title="Pending Assignments">
            <CheckCircle size={14} color="#8b5cf6" />
            <span>{pending.length}</span>
            <span>Pending</span>
          </div>
          <div className="ss-stat" style={{ borderColor: lowAtt.length ? '#f59e0b' : '#333' }} title="Low Attendance">
            <TrendingDown size={14} color={lowAtt.length ? '#f59e0b' : '#666'} />
            <span style={{ color: lowAtt.length ? '#f59e0b' : 'inherit' }}>{lowAtt.length}</span>
            <span>Low Att.</span>
          </div>
        </div>

        {upcomingExams.length > 0 && (
          <div className="ss-alert-banner">
            <Bell size={14} /> <strong>{upcomingExams.length}</strong> exam{upcomingExams.length !== 1 ? 's' : ''} in the next 7 days
          </div>
        )}

        <nav className="sl-nav" style={{ marginTop: '8px' }}>
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)} className={`sl-nav-item ${activeSection === s.id ? 'active' : ''}`}>
                <Icon size={16} /><span>{s.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="ss-main">
        {activeSection === 'timetable' && <Timetable data={timetable} onSave={saveTimetable} attendance={attendance} onSaveAttendance={saveAttendance} assignments={assignments} cie={cie} finals={finals} vivas={vivas} />}
        {activeSection === 'assignments' && <Assignments items={assignments} onSave={saveAssignments} />}
        {activeSection === 'cie' && <Exams items={cie} onSave={saveCie} title="CIE / Internals" icon={BookOpen} />}
        {activeSection === 'finals' && <Exams items={finals} onSave={saveFinals} title="Final Exams" icon={Award} />}
        {activeSection === 'vivas' && <Exams items={vivas} onSave={saveVivas} title="Viva Dates" icon={Target} />}
        {activeSection === 'attendance' && <Attendance records={attendance} onSave={saveAttendance} />}
        {activeSection === 'todo' && (
          <TodayTodo
            timetable={timetable}
            assignments={assignments}
            cie={cie}
            finals={finals}
            vivas={vivas}
            todoState={todoState}
            onToggle={toggleTodo}
            customTodos={customTodos}
            onSaveCustomTodos={saveCustomTodos}
            onRemoveTask={(type, id) => {
              if (type === 'cie') saveCie(cie.filter(e => e.id !== id));
              if (type === 'assignment') saveAssignments(assignments.filter(e => e.id !== id));
              if (type === 'viva') saveVivas(vivas.filter(e => e.id !== id));
              if (type === 'final') saveFinals(finals.filter(e => e.id !== id));
            }}
          />
        )}
        {activeSection === 'calendar' && <CalendarView
          assignments={assignments} cie={cie} finals={finals} vivas={vivas}
          onAddCie={item => saveCie([...cie, item])}
          onAddAssignment={item => saveAssignments([...assignments, item])}
          onAddViva={item => saveVivas([...vivas, item])}
          onAddFinal={item => saveFinals([...finals, item])}
          onRemoveEvent={(type, id) => {
            if (type === 'cie') saveCie(cie.filter(e => e.id !== id));
            if (type === 'assignment') saveAssignments(assignments.filter(e => e.id !== id));
            if (type === 'viva') saveVivas(vivas.filter(e => e.id !== id));
            if (type === 'final') saveFinals(finals.filter(e => e.id !== id));
          }}
        />}
      </main>
    </div>
  );
}
