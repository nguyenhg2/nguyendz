import React, { useState, useEffect, useCallback } from 'react';
import { userAPI, orderAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const fmt    = n => new Intl.NumberFormat('vi-VN').format(n || 0);
const fmtVND = n => fmt(n) + 'đ';
const STATUS_CLASS = { 'Chờ xử lý':'badge-pending','Đã xác nhận':'badge-confirmed','Đang giao':'badge-shipping','Hoàn thành':'badge-done','Đã hủy':'badge-cancelled' };

export default function CustomersPage() {
  const { addToast } = useAdmin();
  const [list,    setList]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [detail,  setDetail]  = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [confirm, setConfirm] = useState(null);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userAPI.getAll({ page, limit: LIMIT, search: search || undefined, role: 'Customer' });
      setList(res.data?.items || res.data || []);
      setTotal(res.data?.total || (res.data?.length ?? 0));
    } catch { addToast('Lỗi tải danh sách khách hàng', 'error'); }
    finally { setLoading(false); }
  }, [page, search, addToast]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (user) => {
    setDetail(user); setOrders([]);
    try {
      const res = await orderAPI.getAll({ page: 1, limit: 50 });
      // Filter orders by UserId (or the API returns user's orders directly)
      const userOrders = (res.data?.items || res.data || []).filter(o => o.userId === user.userId);
      setOrders(userOrders);
    } catch {}
  };

  const handleToggle = async () => {
    try {
      await userAPI.toggle(confirm.userId);
      addToast(`Đã ${confirm.isActive ? 'khóa' : 'mở khóa'} tài khoản ${confirm.fullName}`);
      setConfirm(null);
      if (detail?.userId === confirm.userId) setDetail(d => ({ ...d, isActive: !d.isActive }));
      load();
    } catch { addToast('Lỗi cập nhật tài khoản', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quản lý khách hàng</div>
          <div className="page-subtitle">{total} khách hàng</div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box" style={{ flex: 1, maxWidth: 360 }}>
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm theo tên, email, SĐT..."/>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead>
                <tr><th>ID</th><th>Khách hàng</th><th>Email</th><th>Số điện thoại</th><th>Địa chỉ</th><th>Ngày đăng ký</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">👥</div><p>Không có khách hàng nào</p></div></td></tr>}
                {list.map(u => (
                  <tr key={u.userId}>
                    <td style={{ color: 'var(--muted)', fontWeight: 600 }}>#{u.userId}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {u.avatar ? <img src={u.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}/> : <div className="avatar">{u.fullName?.[0] || 'K'}</div>}
                        <span style={{ fontWeight: 700 }}>{u.fullName}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>{u.email}</td>
                    <td style={{ color: 'var(--muted)' }}>{u.phone || '—'}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.address || '—'}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(u.createdDate).toLocaleDateString('vi-VN')}</td>
                    <td><span className={`badge ${u.isActive ? 'badge-active' : 'badge-inactive'}`}>{u.isActive ? '✅ Hoạt động' : '🔒 Đã khóa'}</span></td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-info btn-sm" onClick={() => openDetail(u)}>👁️ Chi tiết</button>
                        <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => setConfirm(u)}>
                          {u.isActive ? '🔒 Khóa' : '🔓 Mở'}
                        </button>
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
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👤 Chi tiết khách hàng</h3>
              <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: '#f9fafb', borderRadius: 12 }}>
                {detail.avatar ? <img src={detail.avatar} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}/> : <div className="avatar" style={{ width: 64, height: 64, fontSize: 26 }}>{detail.fullName?.[0]}</div>}
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{detail.fullName}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 13 }}>{detail.email}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <span className={`badge ${detail.isActive ? 'badge-active' : 'badge-inactive'}`}>{detail.isActive ? '✅ Hoạt động' : '🔒 Bị khóa'}</span>
                    <span className="badge badge-new">Role: {detail.role}</span>
                  </div>
                </div>
              </div>

              <div className="form-row form-row-2" style={{ marginBottom: 20 }}>
                {[['fullName','Họ tên'],['email','Email'],['phone','Số điện thoại'],['address','Địa chỉ']].map(([k, l]) => (
                  <div key={k} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{detail[k] || '—'}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Lịch sử đơn hàng ({orders.length})</div>
              {orders.length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}><p>Chưa có đơn hàng nào</p></div>
              ) : (
                <table>
                  <thead><tr><th>#ID</th><th>Ngày</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.orderId}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>#{o.orderId}</td>
                        <td style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(o.orderDate).toLocaleDateString('vi-VN')}</td>
                        <td style={{ fontWeight: 700 }}>{fmtVND(o.totalAmount)}</td>
                        <td><span className={`badge ${STATUS_CLASS[o.status]}`}>{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>Đóng</button>
              <button className={`btn ${detail.isActive ? 'btn-danger' : 'btn-success'}`} style={{ background: detail.isActive ? 'var(--red)' : 'var(--green)', color: '#fff' }}
                onClick={() => { setConfirm(detail); }}>
                {detail.isActive ? '🔒 Khóa tài khoản' : '🔓 Mở khóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
          message={`Bạn có chắc muốn ${confirm.isActive ? 'khóa' : 'mở khóa'} tài khoản của "${confirm.fullName}"?`}
          danger={confirm.isActive}
          onConfirm={handleToggle}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
