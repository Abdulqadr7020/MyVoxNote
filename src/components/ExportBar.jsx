import React, { useState } from 'react';
import { Copy, CheckCheck, FileDown } from 'lucide-react';

const ExportBar = React.memo(({ summary, bullets, questions }) => {
  const [copied, setCopied] = useState(false);

  const buildPlainText = () => {
    let text = '';
    if (summary) {
      text += '=== SUMMARY ===\n';
      // Clean up [HEADING] and **bold** markers
      text += summary.replace(/\[HEADING\]/g, '\n\n').replace(/\*\*(.*?)\*\*/g, '$1') + '\n\n';
    }
    if (bullets && bullets.length > 0) {
      text += '=== KEY POINTS ===\n';
      bullets.forEach(b => {
        const title = typeof b === 'object' ? b.title : b;
        text += `• ${title}\n`;
        if (typeof b === 'object' && b.details) {
          b.details.forEach(d => { text += `  → ${d}\n`; });
        }
      });
      text += '\n';
    }
    if (questions && questions.length > 0) {
      text += '=== QUESTIONS & ANSWERS ===\n';
      questions.forEach((q, i) => {
        const question = typeof q === 'object' ? q.question : q;
        const answer = typeof q === 'object' ? q.answer : '';
        text += `Q${i + 1}: ${question}\n`;
        if (answer) text += `A: ${answer}\n`;
        text += '\n';
      });
    }
    return text.trim();
  };

  const handleCopy = async () => {
    const text = buildPlainText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handlePDF = () => {
    // Helper to convert **markdown** to <strong> and strip any [HEADING] markers
    const format = (txt) => {
      if (!txt || typeof txt !== 'string') return txt;
      return txt
        .replace(/\[HEADING\]/g, '')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    };

    const summaryHtml = summary ? format(summary) : '';
    
    const bulletsHtml = bullets && bullets.length > 0
      ? '<ul>' + bullets.map(b => {
          const t = typeof b === 'object' ? b.title : b;
          const details = (typeof b === 'object' && b.details) 
            ? '<ul>' + b.details.map(d => `<li>${format(d)}</li>`).join('') + '</ul>' 
            : '';
          return `<li><strong>${format(t)}</strong>${details}</li>`;
        }).join('') + '</ul>'
      : '';

    const questionsHtml = questions && questions.length > 0
      ? '<div class="qa-section">' + questions.map((q, i) => {
          const question = typeof q === 'object' ? q.question : q;
          const answer = typeof q === 'object' ? q.answer : '';
          return `<div class="qa-item"><p class="q">Q${i+1}: ${format(question)}</p>${answer ? `<p class="a">A: ${format(answer)}</p>` : ''}</div>`;
        }).join('') + '</div>'
      : '';


    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>VoxNote Export - ${new Date().toLocaleDateString()}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { font-family: 'Inter', system-ui, sans-serif; max-width: 800px; margin: 40px auto; color: #1e293b; line-height: 1.6; padding: 20px; background: #fff; }
          .header { border-bottom: 2px solid #7c3aed; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
          .logo { font-size: 24px; font-weight: 800; color: #7c3aed; }
          .date { color: #64748b; font-size: 14px; }
          h2 { color: #7c3aed; font-size: 18px; margin: 24px 0 12px; border-left: 4px solid #7c3aed; padding-left: 12px; }
          section { margin-bottom: 40px; }
          h3 { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; }
          ul { padding-left: 20px; }
          li { margin-bottom: 8px; }
          li strong { color: #4338ca; }
          ul ul { margin-top: 4px; list-style: circle; color: #475569; }
          .qa-item { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
          .q { font-weight: 700; color: #0f172a; margin: 0 0 10px 0; }
          .a { color: #334155; margin: 0; }
          @media print { body { margin: 0; padding: 20px; } .header { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">VoxNote Export</div>
          <div class="date">${new Date().toLocaleString()}</div>
        </div>
        ${summaryHtml ? `<section><h3>📝 Summary</h3>${summaryHtml}</section>` : ''}
        ${bulletsHtml ? `<section><h3>🎯 Key Points</h3>${bulletsHtml}</section>` : ''}
        ${questionsHtml ? `<section><h3>❓ Questions & Answers</h3>${questionsHtml}</section>` : ''}
        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  return (
    <div
      className="export-bar glass-panel"
      style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px',
        flexWrap: 'wrap', justifyContent: 'flex-end',
        animation: 'result-reveal 0.5s ease-out forwards'
      }}
    >
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginRight: 'auto' }}>
        ✨ Notes ready
      </span>

      <button
        onClick={handleCopy}
        className="magic-reveal-btn hover-lift tap-effect"
        style={{ background: copied ? 'rgba(16, 185, 129, 0.15)' : undefined, color: copied ? 'var(--success)' : undefined }}
      >
        {copied ? <><CheckCheck size={15} /> Copied!</> : <><Copy size={15} /> Copy</>}
      </button>

      <button onClick={handlePDF} className="magic-reveal-btn hover-lift tap-effect">
        <FileDown size={15} /> Export PDF
      </button>
    </div>
  );
});

export default ExportBar;
