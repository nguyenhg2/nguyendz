import React from 'react';

export default function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;

  const pages = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="pagination">
      <button className="pg-btn" onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1}>
        Trước
      </button>
      {pages.map(page => (
        <button key={page} className={`pg-btn${current === page ? ' active' : ''}`} onClick={() => onChange(page)}>
          {page}
        </button>
      ))}
      <button className="pg-btn" onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total}>
        Sau
      </button>
    </div>
  );
}
