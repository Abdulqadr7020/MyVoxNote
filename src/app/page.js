"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, Sun, Moon, RefreshCw, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { signIn, signOut, useSession } from "next-auth/react";
import DashboardSwitcher from '../components/DashboardSwitcher';
import FocusMode from '../components/FocusMode';
import ChatDashboard from '../components/chat/ChatDashboard';
import SmartLibrary from '../components/SmartLibrary';
import SmartSchedule from '../components/SmartSchedule';
import EditProfileModal from '../components/EditProfileModal';
import SettingsModal from '../components/SettingsModal';
import ModelSelector from '../components/ModelSelector';

export default function Home() {
  const { data: session } = useSession();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('groq');
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b');
  const [availableProviders, setAvailableProviders] = useState([]);

  // Dashboard state: 'focus' or 'chat'
  const [activeDashboard, setActiveDashboard] = useState('focus');

  useEffect(() => {
    const saved = localStorage.getItem('voxnote-dashboard');
    if (['focus', 'chat', 'library', 'schedule'].includes(saved)) {
      setActiveDashboard(saved);
    }
  }, []);

  const handleDashboardSwitch = useCallback((id) => {
    setActiveDashboard(id);
    localStorage.setItem('voxnote-dashboard', id);
    setShowProfileMenu(false);
  }, []);

  // Theme
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem('voxnote-theme');
    const dark = saved !== 'light';
    setIsDark(dark);
    document.body.classList.toggle('light-mode', !dark);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.body.classList.toggle('light-mode', !next);
    localStorage.setItem('voxnote-theme', next ? 'dark' : 'light');
  }, [isDark]);

  // ── AI Model Selection ──────────────────────────────────────────
  useEffect(() => {
    const savedProvider = localStorage.getItem('voxnote-ai-provider');
    const savedModel = localStorage.getItem('voxnote-ai-model');
    if (savedProvider) setSelectedProvider(savedProvider);
    if (savedModel) setSelectedModel(savedModel);

    fetch('/api/providers')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAvailableProviders(data); })
      .catch(() => { });
  }, []);

  const handleModelChange = useCallback((providerId, modelId) => {
    setSelectedProvider(providerId);
    setSelectedModel(modelId);
    localStorage.setItem('voxnote-ai-provider', providerId);
    localStorage.setItem('voxnote-ai-model', modelId);
  }, []);

  // Click-away listener to close profile menu
  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClickAway = (e) => {
      if (!e.target.closest('.profile-menu-wrapper')) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [showProfileMenu]);

  return (
    <>
      <header className="animate-slide-up" style={{
        padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 100, background: 'transparent', border: 'none',
        borderBottom: '1px solid var(--surface-border)',
        position: 'relative',
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-start' }}>
          <img src="/logo.png" alt="VoxNote Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <h1 className="gradient-text" style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.04em', display: 'var(--show-title, block)' }}>VoxNote</h1>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <DashboardSwitcher active={activeDashboard} onSwitch={handleDashboardSwitch} />
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={toggleTheme} className="header-icon-btn">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="header-model-selector">
            <ModelSelector
              selectedProvider={selectedProvider}
              selectedModel={selectedModel}
              onSelect={handleModelChange}
              availableProviders={availableProviders}
              compact={true}
            />
          </div>
          {session ? (
            <div className="profile-menu-wrapper" style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfileMenu(prev => !prev)}
                style={{
                  position: 'relative', width: '42px', height: '42px', borderRadius: '50%',
                  padding: '2px', background: 'var(--accent-gradient)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                  transition: 'all 0.2s ease', boxShadow: showProfileMenu ? '0 0 0 3px rgba(139,92,246,0.4)' : 'none'
                }}
              >
                <img src={session.user?.image || ''} alt="Profile" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #0d0f14', objectFit: 'cover' }} />
              </button>

              {showProfileMenu && (
                <div
                  className="glass-panel profile-menu animate-slide-up"
                  style={{
                    position: 'absolute', top: '120%', right: 0, minWidth: '200px',
                    padding: '8px', zIndex: 1000, background: 'rgba(13, 15, 20, 0.95)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid var(--surface-border)'
                  }}
                >
                  <div style={{ padding: '12px', borderBottom: '1px solid var(--surface-border)', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{session.user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>{session.user?.email}</div>
                  </div>

                  <button className="menu-item" onClick={() => { setShowProfileMenu(false); setShowEditProfile(true); }}>
                    <User size={16} />
                    <span>Edit Profile</span>
                  </button>
                  <button className="menu-item" onClick={() => { setShowProfileMenu(false); setShowSettings(true); }}>
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                  <div style={{ height: '1px', background: 'var(--surface-border)', margin: '4px 0' }} />
                  <button className="menu-item logout" onClick={() => { setShowProfileMenu(false); signOut({ callbackUrl: '/' }); }}>
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => signIn('google')} className="magic-reveal-btn" style={{ padding: '0 20px', height: '38px', borderRadius: '12px', background: 'var(--accent-gradient)', color: 'white', fontWeight: 700, border: 'none', fontSize: '0.85rem' }}>
              Sign In
            </button>
          )}
        </div>
      </header>

      {showAuthModal && (
        <div className="modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <div className="auth-modal-glow" />
            <div style={{ background: 'var(--accent-gradient)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
              <Mic size={40} color="white" />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em' }}>Unlock Your <span className="gradient-text">Intelligence</span></h2>
            <button
              onClick={() => {
                setIsLoggingIn(true);
                setShowAuthModal(false);
                signIn('google');
              }}
              disabled={isLoggingIn}
              className="gradient-bg-animated"
              style={{
                width: '100%', padding: '18px', borderRadius: '16px', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                opacity: isLoggingIn ? 0.7 : 1, pointerEvents: isLoggingIn ? 'none' : 'auto'
              }}
            >
              {isLoggingIn ? <RefreshCw size={20} className="animate-spin" /> : null}
              {isLoggingIn ? 'Connecting...' : 'Get Started with Google'}
            </button>
            <button onClick={() => setShowAuthModal(false)} style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '0.9rem', marginTop: '16px' }}>Maybe Later</button>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      {activeDashboard === 'focus' && (
        <FocusMode
          session={session}
          isDark={isDark}
          showAuthModal={showAuthModal}
          setShowAuthModal={setShowAuthModal}
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          availableProviders={availableProviders}
        />
      )}
      {activeDashboard === 'chat' && (
        <ChatDashboard
          session={session}
          selectedProvider={selectedProvider}
          selectedModel={selectedModel}
          availableProviders={availableProviders}
          onModelChange={handleModelChange}
        />
      )}
      {activeDashboard === 'library' && <SmartLibrary />}
      {activeDashboard === 'schedule' && <SmartSchedule />}

      {/* Modals */}
      {showEditProfile && (
        <EditProfileModal session={session} onClose={() => setShowEditProfile(false)} />
      )}
      {showSettings && (
        <SettingsModal
          isDark={isDark}
          onThemeChange={(dark) => {
            setIsDark(dark);
            document.body.classList.toggle('light-mode', !dark);
            localStorage.setItem('voxnote-theme', dark ? 'dark' : 'light');
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
