import React, { useState, useEffect, useCallback } from 'react';
import { contactAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

export default function ContactsPage() {
  const { addToast } = useAdmin();
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (readFilter === 'true') params.isRead = true;
      if (readFilter === 'false') params.isRead = false;
      const res = await contactAPI.getAll(params);
      setList(res.data.items || res.data || []);
      setTotal(res.data.total || res.data.length || 0);
    } catch { addToast('Lỗi tải liên hệ', 'error'); }
    finally { setLoading(false); }
  }, [page, search, readFilter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (c) => {
    setDetail(c);
    if (!c.isRead) { try { await contactAPI.markRead(c.contactId); load(); } catch {} }
  };

  const handleDelete = async () => {
    try { await contactAPI.remove(confirm); addToast('Đã xóa'); setConfirm(null); setDetail(null); load(); }
    catch { addToast('Lỗi', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quản lý liên hệ</div>
          <div className="page-subtitle">{total} tin nhắn</div>
        </div>
      </div>

      <div className="filters-bar" style={{ gap: 8 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên, email, chủ đề..." style={{ width: 240 }}/>
        <select value={readFilter} onChange={e => { setReadFilter(e.target.value); setPage(1); }} style={{ width: 140 }}>
          <option value="">Tất cả</option>
          <option value="false">Chưa đọc</option>
          <option value="true">Đã đọc</option>
        </select>
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead><tr><th>ID</th><th>Họ tên</th><th>Email</th><th>Chủ đề</th><th>Ngày gửi</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Không có liên hệ</td></tr>}
                {list.map(c => (
                  <tr key={c.contactId} style={{ cursor: 'pointer', fontWeight: c.isRead ? 400 : 700 }} onClick={() => openDetail(c)}>
                    <td>#{c.contactId}</td>
                    <td>{c.fullName}</td>
                    <td>{c.email}</td>
                    <td>{c.subject || '-'}</td>
                    <td>{new Date(c.createdDate).toLocaleDateString('vi-VN')}</td>
                    <td><span className="badge">{c.isRead ? 'Đã đọc' : 'Chưa đọc'}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirm(c.contactId)}>Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination current={page} total={Math.ceil(total / LIMIT)} onChange={setPage}/>
      </div>

      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Liên hệ #{detail.contactId}</h3>
              <button className="modal-close" onClick={() => setDetail(null)}>X</button>
            </div>
            <div className="modal-body">
              <p><strong>Họ tên:</strong> {detail.fullName}</p>
              <p><strong>Email:</strong> {detail.email}</p>
              <p><strong>SĐT:</strong> {detail.phone || '-'}</p>
              <p><strong>Chủ đề:</strong> {detail.subject || '-'}</p>
              <p><strong>Nội dung:</strong></p>
              <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap' }}>{detail.message || '-'}</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>Đóng</button>
              <button className="btn btn-danger" onClick={() => setConfirm(detail.contactId)}>Xóa</button>
            </div>
          </div>
        </div>
      )}

      {confirm && <ConfirmModal title="Xóa liên hệ" message="Bạn có chắc muốn xóa?" onConfirm={handleDelete} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
