import React, { useState, useMemo } from 'react';
import { 
  ChevronUp, ChevronDown, Search, ArrowLeft, ArrowRight, 
  ListFilter, SortAsc, SortDesc, Filter, Download, Table as TableIcon
} from 'lucide-react';

const TableRenderer = ({ data, isDark = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-20 rounded-3xl border border-dashed animate-premium-slide ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-slate-900/50' : 'bg-slate-200/50'}`}>
           <TableIcon size={32} className={isDark ? "text-slate-700" : "text-slate-400"} />
        </div>
        <p className={`${isDark ? 'text-slate-500' : 'text-slate-400'} font-medium tracking-tight`}>Technical details will appear in table format here.</p>
      </div>
    );
  }

  const headers = Object.keys(data[0]);

  // Handle Sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and Sort Logic
  const processedData = useMemo(() => {
    let filtered = data.filter(item => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? '';
        const bVal = b[sortConfig.key] ?? '';
        
        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const downloadCSV = () => {
    if (processedData.length === 0) return;
    const csvContent = [
      headers.join(','),
      ...processedData.map(row => headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'voxnote_data_analysis.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="table-viz-container animate-premium-slide" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'var(--accent-gradient)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
          <TableIcon size={18} color="white" />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: isDark ? 'white' : '#0f172a', letterSpacing: '-0.02em' }}>Data Analysis Table</h3>
      </div>

      {/* Table Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: isDark ? 'var(--text-secondary)' : '#64748b', opacity: 0.6 }} />
          <input 
            type="text" 
            placeholder="Search within table..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ 
              width: '100%', padding: '14px 16px 14px 48px', 
              background: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', 
              border: `1px solid ${isDark ? 'var(--surface-border)' : 'rgba(0,0,0,0.1)'}`, 
              borderRadius: '18px', 
              color: isDark ? 'white' : '#0f172a', 
              fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s',
              boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.02)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-secondary)'}
            onBlur={(e) => e.target.style.borderColor = isDark ? 'var(--surface-border)' : 'rgba(0,0,0,0.1)'}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={downloadCSV}
            className="hover-lift"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', 
              background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', 
              border: `1px solid ${isDark ? 'var(--surface-border)' : 'rgba(0,0,0,0.1)'}`, 
              borderRadius: '16px', color: isDark ? 'var(--text-secondary)' : '#475569', fontWeight: 600, fontSize: '0.85rem',
              transition: 'all 0.2s', cursor: 'pointer',
              boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.03)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = isDark ? 'white' : '#0f172a'; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#f8fafc'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = isDark ? 'var(--text-secondary)' : '#475569'; e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'; }}
          >
            <Download size={14} /> Export CSV
          </button>
          <div className="info-badge" style={{ padding: '12px 20px', borderRadius: '16px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', fontWeight: 800, border: '1px solid rgba(139, 92, 246, 0.2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <ListFilter size={14} style={{ marginRight: '8px' }} /> {processedData.length} ROWS
          </div>
        </div>
      </div>

      {/* Table Body with Sticky Header */}
      <div className="glass-panel" style={{ 
        maxHeight: '600px', overflowY: 'auto', 
        background: isDark ? 'rgba(0,0,0,0.25)' : '#ffffff', 
        border: `1px solid ${isDark ? 'var(--surface-border)' : 'rgba(0,0,0,0.06)'}`, 
        borderRadius: '28px',
        boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.02)' : '0 10px 40px rgba(0,0,0,0.03)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '0.95rem' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ background: isDark ? 'rgba(15, 20, 28, 0.95)' : '#f8fafc', backdropFilter: 'blur(10px)' }}>
              {headers.map((header, i) => (
                <th 
                  key={header} 
                  onClick={() => requestSort(header)} 
                  style={{ 
                    padding: '24px 20px', color: isDark ? 'var(--accent-secondary)' : '#0891b2', fontWeight: 800, 
                    textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                    borderBottom: `2px solid ${isDark ? 'var(--surface-border)' : 'rgba(0,0,0,0.05)'}`, whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    fontSize: '0.75rem',
                    borderRadius: i === 0 ? '28px 0 0 0' : i === headers.length - 1 ? '0 28px 0 0' : '0'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {header.replace(/_/g, ' ').replace(/Column\d+/, header)}
                    <div style={{ display: 'flex', flexDirection: 'column', opacity: sortConfig.key === header ? 1 : 0.2 }}>
                      <ChevronUp size={12} style={{ marginBottom: '-6px', color: sortConfig.key === header && sortConfig.direction === 'asc' ? (isDark ? 'white' : 'black') : 'inherit' }} />
                      <ChevronDown size={12} style={{ color: sortConfig.key === header && sortConfig.direction === 'desc' ? (isDark ? 'white' : 'black') : 'inherit' }} />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: 'transparent' }}>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} 
                  style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`, transition: 'background 0.3s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {headers.map(header => (
                    <td key={header} style={{ padding: '20px', color: isDark ? 'var(--text-secondary)' : '#475569', lineHeight: 1.7, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}` }}>
                      {typeof row[header] === 'object' ? JSON.stringify(row[header]) : String(row[header] || '—').replace(/\*\*(.*?)\*\*/g, '$1')}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic', opacity: 0.5 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <Search size={32} />
                    <span>No matching details found in this analysis.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Container */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff', 
          padding: '16px 24px', borderRadius: '20px',
          border: `1px solid ${isDark ? 'var(--surface-border)' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', 
              background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', 
              border: `1px solid ${isDark ? 'var(--surface-border)' : 'rgba(0,0,0,0.05)'}`, 
              borderRadius: '14px', color: isDark ? 'white' : '#0f172a', fontWeight: 700, fontSize: '0.8rem',
              opacity: currentPage === 1 ? 0.3 : 1, transition: 'all 0.2s', cursor: 'pointer'
            }}
            onMouseOver={(e) => { if (currentPage !== 1) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'; }}
            onMouseOut={(e) => { if (currentPage !== 1) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'; }}
          >
            <ArrowLeft size={16} /> Previous
          </button>
          
          <div style={{ fontSize: '0.8rem', color: isDark ? 'var(--text-secondary)' : '#64748b', fontWeight: 800, letterSpacing: '0.1em' }}>
            PAGE <span style={{ color: 'var(--accent-secondary)' }}>{currentPage}</span> / {totalPages}
          </div>
          
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', 
              background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', 
              border: `1px solid ${isDark ? 'var(--surface-border)' : 'rgba(0,0,0,0.05)'}`, 
              borderRadius: '14px', color: isDark ? 'white' : '#0f172a', fontWeight: 700, fontSize: '0.8rem',
              opacity: currentPage === totalPages ? 0.3 : 1, transition: 'all 0.2s', cursor: 'pointer'
            }}
            onMouseOver={(e) => { if (currentPage !== totalPages) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'; }}
            onMouseOut={(e) => { if (currentPage !== totalPages) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'; }}
          >
            Next <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TableRenderer;
