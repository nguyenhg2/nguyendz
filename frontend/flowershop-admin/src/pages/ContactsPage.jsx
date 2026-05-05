import React, { useState, useEffect, useCallback } from 'react';
import { contactAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

export default function ContactsPage() {
  const { addToast } = useAdmin();
  const [list,    setList]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('');  
  const [detail,  setDetail]  = useState(null);
  const [confirm, setConfirm] = useState(null);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (filter === 'unread') params.isRead = false;
      if (filter === 'read')   params.isRead = true;
      const res = await contactAPI.getAll(params);
      setList(res.data?.items || res.data || []);
      setTotal(res.data?.total || (res.data?.length ?? 0));
    } catch { addToast('Lỗi tải liên hệ', 'error'); }
    finally { setLoading(false); }
  }, [page, filter, addToast]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (c) => {
    setDetail(c);
    // Mark as read if not already
    if (!c.IsRead) {
      try {
        await contactAPI.markRead(c.ContactId);
        setList(l => l.map(x => x.ContactId === c.ContactId ? { ...x, IsRead: true } : x));
        setDetail(d => d ? { ...d, IsRead: true } : d);
      } catch {}
    }
  };

  const handleDelete = async () => {
    try {
      await contactAPI.remove(confirm);
      addToast('Đã xóa tin nhắn liên hệ');
      setConfirm(null);
      if (detail?.ContactId === confirm) setDetail(null);
      load();
    } catch { addToast('Lỗi xóa liên hệ', 'error'); }
  };

  const handleMarkRead = async (id) => {
    try {
      await contactAPI.markRead(id);
      addToast('Đã đánh dấu đã đọc');
      setList(l => l.map(x => x.ContactId === id ? { ...x, IsRead: true } : x));
      if (detail?.ContactId === id) setDetail(d => ({ ...d, IsRead: true }));
    } catch { addToast('Lỗi cập nhật', 'error'); }
  };

  const unreadCount = list.filter(c => !c.IsRead).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quản lý liên hệ</div>
          <div className="page-subtitle">
            {total} tin nhắn
            {unreadCount > 0 && <span style={{ marginLeft: 8, background: 'var(--primary)', color: '#fff', borderRadius: '50%', padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{unreadCount} chưa đọc</span>}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['', 'Tất cả'], ['unread', '📬 Chưa đọc'], ['read', '📭 Đã đọc']].map(([v, l]) => (
          <button key={v} onClick={() => { setFilter(v); setPage(1); }}
            style={{ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12,
              background: filter === v ? 'var(--primary)' : '#f3f4f6',
              color: filter === v ? '#fff' : 'var(--muted)' }}>
            {l}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead>
                <tr><th>ID</th><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Chủ đề</th><th>Ngày gửi</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">✉️</div><p>Không có tin nhắn nào</p></div></td></tr>}
                {list.map(c => (
                  <tr key={c.ContactId} style={{ background: !c.IsRead ? '#fffbf0' : '', cursor: 'pointer' }} onClick={() => openDetail(c)}>
                    <td style={{ color: 'var(--muted)', fontWeight: 600 }}>#{c.ContactId}</td>
                    <td><span style={{ fontWeight: c.IsRead ? 400 : 700 }}>{c.FullName}</span></td>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>{c.Email}</td>
                    <td style={{ color: 'var(--muted)' }}>{c.Phone || '—'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: c.IsRead ? 400 : 600 }}>{c.Subject || '(Không có chủ đề)'}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(c.CreatedDate).toLocaleDateString('vi-VN')}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <span className={`badge ${c.IsRead ? 'badge-read' : 'badge-unread'}`}>{c.IsRead ? '✅ Đã đọc' : '🔵 Chưa đọc'}</span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="btn-group">
                        {!c.IsRead && <button className="btn btn-success btn-sm" onClick={() => handleMarkRead(c.ContactId)}>✅</button>}
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm(c.ContactId)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ padding: '12px 0' }}>
          <Pagination current={page} total={Math.ceil(total / LIMIT)} onChange={setPage}/>
        </div>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✉️ Chi tiết liên hệ #{detail.ContactId}</h3>
              <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div className="form-row form-row-2" style={{ gap: 12 }}>
                  {[['Họ tên', detail.FullName], ['Email', detail.Email], ['Số điện thoại', detail.Phone || '—'], ['Ngày gửi', new Date(detail.CreatedDate).toLocaleString('vi-VN')]].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Chủ đề (Subject)</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{detail.Subject || '(Không có chủ đề)'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Nội dung tin nhắn (Message)</div>
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16, lineHeight: 1.8, fontSize: 14, whiteSpace: 'pre-wrap' }}>{detail.Message || '(Không có nội dung)'}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>Đóng</button>
              {!detail.IsRead && <button className="btn btn-success" onClick={() => handleMarkRead(detail.ContactId)}>✅ Đánh dấu đã đọc</button>}
              <button className="btn btn-danger" style={{ background: 'var(--red)', color: '#fff' }} onClick={() => setConfirm(detail.ContactId)}>🗑️ Xóa</button>
            </div>
          </div>
        </div>
      )}

      {confirm && <ConfirmModal title="Xóa tin nhắn" message="Bạn có chắc muốn xóa tin nhắn liên hệ này?" onConfirm={handleDelete} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
