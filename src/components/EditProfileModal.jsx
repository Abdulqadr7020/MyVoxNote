"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, User, Camera, Save, RefreshCw, GraduationCap, Linkedin, Github, Globe } from 'lucide-react';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate', 'Faculty'];
const BRANCHES = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Other'];

export default function EditProfileModal({ session, onClose }) {
  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    institution: '',
    year: '',
    branch: '',
    linkedin: '',
    github: '',
    website: '',
    avatarUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    const stored = localStorage.getItem('voxnote-profile');
    const defaults = {
      displayName: session?.user?.name || '',
      bio: '',
      institution: '',
      year: '',
      branch: '',
      linkedin: '',
      github: '',
      website: '',
      avatarUrl: session?.user?.image || '',
    };
    if (stored) {
      setForm({ ...defaults, ...JSON.parse(stored) });
    } else {
      setForm(defaults);
    }
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600)); // Simulate save delay
    localStorage.setItem('voxnote-profile', JSON.stringify(form));
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, avatarUrl: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const avatar = form.avatarUrl || session?.user?.image || '';
  const initials = (form.displayName || session?.user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="pm-backdrop" onClick={onClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="pm-header">
          <div className="pm-header-title">
            <User size={18} />
            <span>Edit Profile</span>
          </div>
          <button className="pm-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="pm-body">
          {/* Avatar */}
          <div className="pm-avatar-section">
            <div className="pm-avatar-wrap">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="pm-avatar-img" referrerPolicy="no-referrer" />
              ) : (
                <div className="pm-avatar-initials">{initials}</div>
              )}
              <button className="pm-avatar-edit" onClick={() => fileRef.current?.click()}>
                <Camera size={14} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile} />
            </div>
            <div>
              <div className="pm-avatar-name">{form.displayName || 'Your Name'}</div>
              <div className="pm-avatar-email">{session?.user?.email}</div>
              <div className="pm-google-badge">● Connected via Google</div>
            </div>
          </div>

          {/* Form */}
          <div className="pm-form">
            <div className="pm-field-group">
              <div className="pm-field">
                <label>Display Name</label>
                <input
                  className="pm-input"
                  value={form.displayName}
                  onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="How others see you"
                />
              </div>
              <div className="pm-field">
                <label>Institution / College</label>
                <input
                  className="pm-input"
                  value={form.institution}
                  onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                  placeholder="e.g. MIT College of Engineering"
                />
              </div>
            </div>

            <div className="pm-field-group">
              <div className="pm-field">
                <label>Academic Year</label>
                <select className="pm-input" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
                  <option value="">— Select Year —</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="pm-field">
                <label>Branch / Department</label>
                <select className="pm-input" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}>
                  <option value="">— Select Branch —</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <div className="pm-field">
              <label>Bio</label>
              <textarea
                className="pm-input pm-textarea"
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="A short intro about yourself..."
                rows={3}
              />
            </div>

            <div className="pm-section-label">Social Links</div>
            <div className="pm-field-group">
              <div className="pm-field pm-field-icon">
                <Linkedin size={15} className="pm-field-ico" />
                <input className="pm-input pm-input-indent" value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} placeholder="LinkedIn URL" />
              </div>
              <div className="pm-field pm-field-icon">
                <Github size={15} className="pm-field-ico" />
                <input className="pm-input pm-input-indent" value={form.github} onChange={e => setForm(f => ({ ...f, github: e.target.value }))} placeholder="GitHub URL" />
              </div>
            </div>
            <div className="pm-field pm-field-icon">
              <Globe size={15} className="pm-field-ico" />
              <input className="pm-input pm-input-indent" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="Personal website URL" />
            </div>
          </div>
        </div>

        <div className="pm-footer">
          <button className="pm-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="pm-btn-primary" onClick={handleSave} disabled={saving || saved}>
            {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
