import React from 'react';

export default function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;

  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="pagination">
      <button className="pg-btn" onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1}>
        Trước
      </button>

      {start > 1 && (
        <>
          <button className="pg-btn" onClick={() => onChange(1)}>1</button>
          {start > 2 && <span className="pg-dots">...</span>}
        </>
      )}

      {pages.map(page => (
        <button key={page} className={`pg-btn${current === page ? ' active' : ''}`} onClick={() => onChange(page)}>
          {page}
        </button>
      ))}

      {end < total && (
        <>
          {end < total - 1 && <span className="pg-dots">...</span>}
          <button className="pg-btn" onClick={() => onChange(total)}>{total}</button>
        </>
      )}

      <button className="pg-btn" onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total}>
        Sau
      </button>
    </div>
  );
}
