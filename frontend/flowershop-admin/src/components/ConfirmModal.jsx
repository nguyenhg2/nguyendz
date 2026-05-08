import React from 'react';

export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div style={styles.backdrop} onClick={onCancel}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ margin: 0, fontSize: 16 }}>{title || 'Xác nhận'}</h3>
          <button style={styles.closeBtn} onClick={onCancel}>&times;</button>
        </div>
        <div style={styles.body}>
          <p style={{ margin: 0, color: '#555', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onCancel}>Hủy</button>
          <button style={styles.confirmBtn} onClick={onConfirm}>Xác nhận</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999
  },
  modal: {
    background: '#fff', borderRadius: 10, width: '90%', maxWidth: 400,
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)', overflow: 'hidden'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 20px', borderBottom: '1px solid #eee'
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888'
  },
  body: {
    padding: '20px'
  },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: 10,
    padding: '14px 20px', borderTop: '1px solid #eee'
  },
  cancelBtn: {
    padding: '8px 20px', border: 'none', borderRadius: 6,
    background: '#e74c3c', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14
  },
  confirmBtn: {
    padding: '8px 20px', border: 'none', borderRadius: 6,
    background: '#27ae60', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14
  }
};
