import React, { useState, useEffect, useCallback } from 'react';
import { contactAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN') : '-';
const LIMIT = 10;

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (readFilter !== '') params.isRead = readFilter === 'true';
      const res = await contactAPI.getAll(params);
      const data = res.data;
      setList(data.items || data || []);
      setTotal(data.total || (data.length ? data.length : 0));
    } catch { addToast('Lỗi tải liên hệ', 'error'); }
    finally { setLoading(false); }
  }, [page, search, readFilter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    try {
      const res = await contactAPI.getById(id);
      setDetail(res.data);
      load();
    } catch { addToast('Lỗi tải chi tiết', 'error'); }
  };

  const handleDelete = async () => {
    try { await contactAPI.remove(confirm); addToast('Đã xóa liên hệ'); setConfirm(null); load(); }
    catch { addToast('Lỗi xóa', 'error'); }
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
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên, email, chủ đề..." style={{ width: 220 }}/>
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
              <thead><tr><th>ID</th><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Chủ đề</th><th>Ngày gửi</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>Không có liên hệ</td></tr>}
                {list.map(c => (
                  <tr key={c.contactId} style={{ fontWeight: c.isRead ? 400 : 600 }}>
                    <td>#{c.contactId}</td>
                    <td>{c.fullName}</td>
                    <td>{c.email}</td>
                    <td>{c.phone || '-'}</td>
                    <td>{c.subject || '-'}</td>
                    <td>{fmtDate(c.createdDate)}</td>
                    <td><span className={`badge ${c.isRead ? 'badge-success' : 'badge-warning'}`}>{c.isRead ? 'Đã đọc' : 'Chưa đọc'}</span></td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-info btn-sm" onClick={() => openDetail(c.contactId)}>Xem</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm(c.contactId)}>Xóa</button>
                      </div>
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
            <div className="modal-header"><h3>Chi tiết liên hệ</h3><button className="modal-close" onClick={() => setDetail(null)}>X</button></div>
            <div className="modal-body">
              <p><strong>Họ tên:</strong> {detail.fullName}</p>
              <p><strong>Email:</strong> {detail.email}</p>
              <p><strong>SĐT:</strong> {detail.phone || 'Không có'}</p>
              <p><strong>Chủ đề:</strong> {detail.subject || 'Không có'}</p>
              <p><strong>Ngày gửi:</strong> {fmtDate(detail.createdDate)}</p>
              <p><strong>Nội dung:</strong></p>
              <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap' }}>{detail.message || 'Không có nội dung'}</div>
            </div>
          </div>
        </div>
      )}

      {confirm && <ConfirmModal title="Xóa liên hệ" message="Bạn có chắc chắn muốn xóa tin nhắn này?" onConfirm={handleDelete} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
