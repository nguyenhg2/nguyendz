import React from 'react';

export default function ConfirmModal({ title, message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title || 'Xác nhận'}</h3>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Hủy</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} style={{ background: danger ? 'var(--red)' : undefined, color: danger ? '#fff' : undefined }}>
            {danger ? '🗑️ Xác nhận xóa' : '✅ Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}
