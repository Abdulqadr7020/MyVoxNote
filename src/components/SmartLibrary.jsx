"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen, Upload, Search, Download, Bookmark, BookmarkCheck,
  FolderOpen, FileText, Star, Clock, ChevronRight, ChevronDown,
  Filter, Grid, List, X, Plus, Eye, Trash2, Award, BookMarked,
  GraduationCap, ArrowLeft, File, Image, FileCode, Presentation
} from 'lucide-react';

const SEMESTERS = ['Semester 1','Semester 2','Semester 3','Semester 4','Semester 5','Semester 6','Semester 7','Semester 8'];
const DEFAULT_SUBJECTS = {
  'Semester 1': ['Mathematics I','Physics','Engineering Drawing','C Programming','Environmental Science'],
  'Semester 2': ['Mathematics II','Chemistry','Electrical Engineering','Data Structures','Communication Skills'],
  'Semester 3': ['Mathematics III','Digital Electronics','OOP with Java','Computer Organization','Discrete Math'],
  'Semester 4': ['DBMS','Java','Microprocessor','Operating Systems','Computer Networks','Maths IV'],
  'Semester 5': ['T&C','Compiler Design','Software Engineering','DAA','Elective I'],
  'Semester 6': ['Machine Learning','Cloud Computing','Information Security','Big Data','Elective II'],
  'Semester 7': ['AI','IoT','Project I','Elective III','Open Elective'],
  'Semester 8': ['Project II','Seminar','Elective IV','Industry Training'],
};
const CATEGORIES = ['Unit 1','Unit 2','Unit 3','Unit 4','Unit 5','PPTs','PYQs','Important Questions','Syllabus','Reference Books'];
const FILE_ICONS = { pdf: FileText, ppt: Presentation, doc: FileCode, docx: FileCode, png: Image, jpg: Image, jpeg: Image, default: File };

function getFileIcon(name) {
  const ext = name?.split('.').pop()?.toLowerCase();
  return FILE_ICONS[ext] || FILE_ICONS.default;
}
function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(1) + ' MB';
}
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff/60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m/60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h/24) + 'd ago';
}

export default function SmartLibrary() {
  const [notes, setNotes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeSem, setActiveSem] = useState('Semester 4');
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [view, setView] = useState('home'); // home | semester | subject | category
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title:'', semester: 'Semester 4', subject:'', category:'Unit 1', file: null });
  const [previewNote, setPreviewNote] = useState(null);
  const [activeTab, setActiveTab] = useState('browse'); // browse | recent | top | bookmarks
  const fileRef = useRef();

  useEffect(() => {
    const saved = localStorage.getItem('voxnote-library-notes');
    const savedBm = localStorage.getItem('voxnote-library-bookmarks');
    if (saved) setNotes(JSON.parse(saved));
    if (savedBm) setBookmarks(JSON.parse(savedBm));
  }, []);

  const saveNotes = (n) => { setNotes(n); localStorage.setItem('voxnote-library-notes', JSON.stringify(n)); };
  const saveBm = (b) => { setBookmarks(b); localStorage.setItem('voxnote-library-bookmarks', JSON.stringify(b)); };

  const handleUpload = () => {
    if (!uploadForm.title || !uploadForm.subject) return;
    const note = {
      id: Date.now().toString(),
      title: uploadForm.title,
      semester: uploadForm.semester,
      subject: uploadForm.subject,
      category: uploadForm.category,
      fileName: uploadForm.file?.name || 'document.pdf',
      fileSize: uploadForm.file?.size || 0,
      uploadedAt: Date.now(),
      downloads: 0,
      uploader: 'Faculty',
    };
    saveNotes([note, ...notes]);
    setUploadForm({ title:'', semester: 'Semester 4', subject:'', category:'Unit 1', file: null });
    setShowUpload(false);
  };

  const toggleBookmark = (id) => {
    const next = bookmarks.includes(id) ? bookmarks.filter(b => b !== id) : [...bookmarks, id];
    saveBm(next);
  };

  const handleDownload = (id) => {
    saveNotes(notes.map(n => n.id === id ? { ...n, downloads: (n.downloads||0)+1 } : n));
  };

  const deleteNote = (id) => saveNotes(notes.filter(n => n.id !== id));

  const filtered = notes.filter(n => {
    if (search) return n.title.toLowerCase().includes(search.toLowerCase()) || n.subject?.toLowerCase().includes(search.toLowerCase());
    if (view === 'semester') return n.semester === activeSem;
    if (view === 'subject') return n.semester === activeSem && n.subject === activeSubject;
    if (view === 'category') return n.semester === activeSem && n.subject === activeSubject && n.category === activeCategory;
    return true;
  });

  const recentNotes    = [...notes].sort((a,b) => b.uploadedAt - a.uploadedAt).slice(0,6);
  const topNotes       = [...notes].sort((a,b) => b.downloads - a.downloads).slice(0,6);
  const bookmarkedNotes = notes.filter(n => bookmarks.includes(n.id));

  const displayNotes = activeTab === 'recent' ? recentNotes : activeTab === 'top' ? topNotes : activeTab === 'bookmarks' ? bookmarkedNotes : filtered;
  const subjects = DEFAULT_SUBJECTS[activeSem] || [];

  return (
    <div className="sl-layout">
      {/* Sidebar */}
      <aside className="sl-sidebar">
        <div className="sl-sidebar-brand">
          <div className="sl-brand-icon"><BookMarked size={20} color="white" /></div>
          <div>
            <div className="sl-brand-title">Smart Library</div>
            <div className="sl-brand-sub">{notes.length} materials</div>
          </div>
        </div>

        <nav className="sl-nav">
          {[
            { id: 'browse',    icon: FolderOpen, label: 'Browse' },
            { id: 'recent',    icon: Clock,      label: 'Recent Uploads' },
            { id: 'top',       icon: Star,       label: 'Top Downloads' },
            { id: 'bookmarks', icon: Bookmark,   label: 'Bookmarks', count: bookmarks.length },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id); if (item.id !== 'browse') setView('home'); }}
                className={`sl-nav-item ${activeTab === item.id ? 'active' : ''}`}>
                <Icon size={17} />
                <span>{item.label}</span>
                {item.count > 0 && <span className="sl-nav-badge">{item.count}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sl-sidebar-section-label">SEMESTERS</div>
        {SEMESTERS.map(sem => (
          <button key={sem} onClick={() => { setActiveSem(sem); setView('semester'); setActiveSubject(null); setActiveCategory(null); setActiveTab('browse'); }}
            className={`sl-sem-btn ${activeSem === sem && view !== 'home' && activeTab === 'browse' ? 'active' : ''}`}>
            <GraduationCap size={14} />
            <span>{sem}</span>
            <span className="sl-sem-count">{notes.filter(n => n.semester === sem).length}</span>
          </button>
        ))}

        <button className="sl-upload-btn" onClick={() => setShowUpload(true)}>
          <Upload size={16} /> Upload Material
        </button>
      </aside>

      {/* Main */}
      <main className="sl-main">
        {/* Topbar */}
        <div className="sl-topbar">
          <div className="sl-breadcrumb">
            <button onClick={() => { setView('home'); setActiveTab('browse'); }} className="sl-breadcrumb-item">Library</button>
            {view !== 'home' && activeTab === 'browse' && <>
              <ChevronRight size={14} className="sl-breadcrumb-sep" />
              <button onClick={() => { setView('semester'); setActiveSubject(null); setActiveCategory(null); }} className="sl-breadcrumb-item">{activeSem}</button>
            </>}
            {activeSubject && activeTab === 'browse' && <>
              <ChevronRight size={14} className="sl-breadcrumb-sep" />
              <button onClick={() => { setView('subject'); setActiveCategory(null); }} className="sl-breadcrumb-item">{activeSubject}</button>
            </>}
            {activeCategory && activeTab === 'browse' && <>
              <ChevronRight size={14} className="sl-breadcrumb-sep" />
              <span className="sl-breadcrumb-item active">{activeCategory}</span>
            </>}
          </div>

          <div className="sl-search-bar">
            <Search size={16} className="sl-search-icon" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes, subjects..." className="sl-search-input" />
            {search && <button onClick={() => setSearch('')} className="sl-search-clear"><X size={14} /></button>}
          </div>

          <div className="sl-view-toggle">
            <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''}><Grid size={16} /></button>
            <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'active' : ''}><List size={16} /></button>
          </div>
        </div>

        <div className="sl-content">
          {/* Home view – semester cards */}
          {view === 'home' && activeTab === 'browse' && !search && (
            <div>
              <div className="sl-section-title">
                <BookOpen size={20} />
                <span>All Semesters</span>
              </div>
              <div className="sl-sem-grid">
                {SEMESTERS.map((sem, i) => (
                  <div key={sem} className="sl-sem-card" onClick={() => { setActiveSem(sem); setView('semester'); }}>
                    <div className="sl-sem-card-num">Sem {i+1}</div>
                    <div className="sl-sem-card-title">{sem}</div>
                    <div className="sl-sem-card-subjects">{(DEFAULT_SUBJECTS[sem]||[]).length} subjects</div>
                    <div className="sl-sem-card-files">{notes.filter(n=>n.semester===sem).length} files</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Semester view – subject cards */}
          {view === 'semester' && activeTab === 'browse' && !search && (
            <div>
              <div className="sl-section-title">
                <FolderOpen size={20} /> <span>{activeSem} — Subjects</span>
              </div>
              <div className="sl-subject-grid">
                {subjects.map(sub => (
                  <div key={sub} className="sl-subject-card" onClick={() => { setActiveSubject(sub); setView('subject'); }}>
                    <div className="sl-subject-icon"><BookOpen size={22} /></div>
                    <div className="sl-subject-title">{sub}</div>
                    <div className="sl-subject-files">{notes.filter(n=>n.semester===activeSem&&n.subject===sub).length} files</div>
                    <ChevronRight size={16} className="sl-subject-arr" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subject view – category folders */}
          {view === 'subject' && activeTab === 'browse' && !search && (
            <div>
              <div className="sl-section-title">
                <FolderOpen size={20} /> <span>{activeSubject} — Categories</span>
              </div>
              <div className="sl-category-grid">
                {CATEGORIES.map(cat => (
                  <div key={cat} className="sl-category-card" onClick={() => { setActiveCategory(cat); setView('category'); }}>
                    <div className="sl-category-icon">
                      {cat.includes('PY') ? '📄' : cat.includes('Syl') ? '📋' : cat.includes('PPT') ? '🖥️' : cat.includes('Book') ? '📚' : cat.includes('Imp') ? '⭐' : '📁'}
                    </div>
                    <div className="sl-category-name">{cat}</div>
                    <div className="sl-category-count">{notes.filter(n=>n.semester===activeSem&&n.subject===activeSubject&&n.category===cat).length} files</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File list */}
          {(view === 'category' || search || activeTab !== 'browse') && (
            <div>
              <div className="sl-section-title">
                <FileText size={20} />
                <span>
                  {activeTab === 'recent' ? 'Recent Uploads' : activeTab === 'top' ? 'Top Downloads' : activeTab === 'bookmarks' ? 'Bookmarks' : activeCategory || 'All Files'}
                </span>
                <span className="sl-count-badge">{displayNotes.length}</span>
              </div>

              {displayNotes.length === 0 ? (
                <div className="sl-empty">
                  <div style={{fontSize:'3rem',marginBottom:'12px'}}>📭</div>
                  <div style={{fontWeight:600,fontSize:'1.1rem',marginBottom:'6px'}}>No files here yet</div>
                  <div style={{opacity:0.5,fontSize:'0.85rem'}}>Upload some materials to get started</div>
                  <button className="sl-upload-btn" style={{marginTop:'20px',width:'auto'}} onClick={() => setShowUpload(true)}>
                    <Upload size={14}/> Upload Now
                  </button>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'sl-files-grid' : 'sl-files-list'}>
                  {displayNotes.map(note => {
                    const Icon = getFileIcon(note.fileName);
                    const isBookmarked = bookmarks.includes(note.id);
                    return (
                      <div key={note.id} className="sl-file-card">
                        <div className="sl-file-icon-wrap">
                          <Icon size={28} />
                        </div>
                        <div className="sl-file-info">
                          <div className="sl-file-title">{note.title}</div>
                          <div className="sl-file-meta">
                            <span className="sl-file-tag">{note.subject}</span>
                            <span className="sl-file-tag">{note.category}</span>
                          </div>
                          <div className="sl-file-stats">
                            <span>{formatSize(note.fileSize)}</span>
                            <span>·</span>
                            <span>{timeAgo(note.uploadedAt)}</span>
                            <span>·</span>
                            <span>{note.downloads || 0} downloads</span>
                          </div>
                        </div>
                        <div className="sl-file-actions">
                          <button onClick={() => setPreviewNote(note)} className="sl-file-btn" title="Preview"><Eye size={15}/></button>
                          <button onClick={() => toggleBookmark(note.id)} className={`sl-file-btn ${isBookmarked ? 'bookmarked' : ''}`} title="Bookmark">
                            {isBookmarked ? <BookmarkCheck size={15}/> : <Bookmark size={15}/>}
                          </button>
                          <button onClick={() => handleDownload(note.id)} className="sl-file-btn download" title="Download"><Download size={15}/></button>
                          <button onClick={() => deleteNote(note.id)} className="sl-file-btn danger" title="Delete"><Trash2 size={15}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <div className="sl-modal-backdrop" onClick={() => setShowUpload(false)}>
          <div className="sl-modal" onClick={e => e.stopPropagation()}>
            <div className="sl-modal-header">
              <h3><Upload size={18}/> Upload Material</h3>
              <button onClick={() => setShowUpload(false)}><X size={20}/></button>
            </div>
            <div className="sl-modal-body">
              <div className="sl-form-group">
                <label>Title *</label>
                <input value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} placeholder="e.g. DBMS Unit 1 Notes" className="sl-input"/>
              </div>
              <div className="sl-form-row">
                <div className="sl-form-group">
                  <label>Semester *</label>
                  <select value={uploadForm.semester} onChange={e => setUploadForm({...uploadForm, semester: e.target.value})} className="sl-input">
                    {SEMESTERS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="sl-form-group">
                  <label>Subject *</label>
                  <select value={uploadForm.subject} onChange={e => setUploadForm({...uploadForm, subject: e.target.value})} className="sl-input">
                    <option value="">— Select —</option>
                    {(DEFAULT_SUBJECTS[uploadForm.semester]||[]).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="sl-form-group">
                <label>Category</label>
                <select value={uploadForm.category} onChange={e => setUploadForm({...uploadForm, category: e.target.value})} className="sl-input">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="sl-form-group">
                <label>File</label>
                <div className="sl-file-drop" onClick={() => fileRef.current?.click()}>
                  {uploadForm.file ? (
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <FileText size={20}/> <span>{uploadForm.file.name}</span>
                    </div>
                  ) : (
                    <div style={{opacity:0.5}}><Upload size={24}/><br/>Click to browse or drop a file</div>
                  )}
                  <input ref={fileRef} type="file" style={{display:'none'}} accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={e => setUploadForm({...uploadForm, file: e.target.files[0]})}/>
                </div>
              </div>
            </div>
            <div className="sl-modal-footer">
              <button onClick={() => setShowUpload(false)} className="sl-btn-ghost">Cancel</button>
              <button onClick={handleUpload} className="sl-btn-primary" disabled={!uploadForm.title || !uploadForm.subject}>
                <Upload size={15}/> Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewNote && (
        <div className="sl-modal-backdrop" onClick={() => setPreviewNote(null)}>
          <div className="sl-modal sl-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="sl-modal-header">
              <h3><Eye size={18}/> {previewNote.title}</h3>
              <button onClick={() => setPreviewNote(null)}><X size={20}/></button>
            </div>
            <div className="sl-modal-body">
              <div className="sl-preview-meta">
                <div className="sl-meta-chip"><GraduationCap size={14}/> {previewNote.semester}</div>
                <div className="sl-meta-chip"><BookOpen size={14}/> {previewNote.subject}</div>
                <div className="sl-meta-chip"><FolderOpen size={14}/> {previewNote.category}</div>
              </div>
              <div className="sl-preview-placeholder">
                <FileText size={60} style={{opacity:0.2}}/>
                <div style={{marginTop:'16px',opacity:0.4,fontSize:'0.9rem'}}>Preview not available<br/>Download to view the file</div>
              </div>
              <div className="sl-preview-details">
                <div><span>File:</span><strong>{previewNote.fileName}</strong></div>
                <div><span>Size:</span><strong>{formatSize(previewNote.fileSize)}</strong></div>
                <div><span>Uploaded:</span><strong>{timeAgo(previewNote.uploadedAt)}</strong></div>
                <div><span>Downloads:</span><strong>{previewNote.downloads}</strong></div>
              </div>
            </div>
            <div className="sl-modal-footer">
              <button onClick={() => toggleBookmark(previewNote.id)} className="sl-btn-ghost">
                {bookmarks.includes(previewNote.id) ? <><BookmarkCheck size={15}/> Bookmarked</> : <><Bookmark size={15}/> Bookmark</>}
              </button>
              <button onClick={() => { handleDownload(previewNote.id); setPreviewNote(null); }} className="sl-btn-primary">
                <Download size={15}/> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
