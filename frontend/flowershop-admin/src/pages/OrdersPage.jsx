import React, { useState, useEffect, useCallback } from 'react';
import { orderAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const fmt    = n => new Intl.NumberFormat('vi-VN').format(n || 0);
const fmtVND = n => fmt(n) + 'đ';

const STATUSES = ['Chờ xử lý', 'Đã xác nhận', 'Đang giao', 'Hoàn thành', 'Đã hủy'];
const NEXT_STATUS = { 'Chờ xử lý': 'Đã xác nhận', 'Đã xác nhận': 'Đang giao', 'Đang giao': 'Hoàn thành' };
const STATUS_CLASS = { 'Chờ xử lý':'badge-pending','Đã xác nhận':'badge-confirmed','Đang giao':'badge-shipping','Hoàn thành':'badge-done','Đã hủy':'badge-cancelled' };

export default function OrdersPage() {
  const { addToast } = useAdmin();
  const [list,     setList]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [detail,   setDetail]   = useState(null);   // order detail modal
  const [confirm,  setConfirm]  = useState(null);   // { id, action } 'cancel'|'status'
  const [nextSt,   setNextSt]   = useState('');
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getAll({ page, limit: LIMIT, status: status || undefined, search: search || undefined });
      setList(res.data?.items || res.data || []);
      setTotal(res.data?.total || (res.data?.length ?? 0));
    } catch { addToast('Lỗi tải đơn hàng', 'error'); }
    finally { setLoading(false); }
  }, [page, search, status, addToast]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    try {
      const res = await orderAPI.getById(id);
      setDetail(res.data);
    } catch { addToast('Lỗi tải chi tiết đơn', 'error'); }
  };

  const handleUpdateStatus = async () => {
    try {
      await orderAPI.updateStatus(confirm.id, nextSt);
      addToast(`Đã cập nhật trạng thái: ${nextSt}`);
      setConfirm(null);
      if (detail?.orderId === confirm.id) setDetail(d => ({ ...d, status: nextSt }));
      load();
    } catch { addToast('Lỗi cập nhật trạng thái', 'error'); }
  };

  const handleCancel = async () => {
    try {
      await orderAPI.cancel(confirm.id, 'Admin hủy đơn');
      addToast('Đã hủy đơn hàng');
      setConfirm(null);
      if (detail?.orderId === confirm.id) setDetail(d => ({ ...d, status: 'Đã hủy' }));
      load();
    } catch { addToast('Lỗi hủy đơn', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quản lý đơn hàng</div>
          <div className="page-subtitle">{total} đơn hàng</div>
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['', ...STATUSES].map(s => (
          <button key={s || 'all'} onClick={() => { setStatus(s); setPage(1); }}
            style={{ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12,
              background: status === s ? 'var(--primary)' : '#f3f4f6',
              color: status === s ? '#fff' : 'var(--muted)' }}>
            {s || 'Tất cả'}
          </button>
        ))}
      </div>

      <div className="filters-bar">
        <div className="search-box" style={{ flex: 1, maxWidth: 340 }}>
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên, SĐT người nhận..."/>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead>
                <tr><th>#ID</th><th>Người nhận</th><th>SĐT</th><th>Thanh toán</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày đặt</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">📦</div><p>Không có đơn hàng nào</p></div></td></tr>}
                {list.map(o => (
                  <tr key={o.orderId}>
                    <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>#{o.orderId}</span></td>
                    <td><span style={{ fontWeight: 600 }}>{o.receiverName}</span></td>
                    <td style={{ color: 'var(--muted)' }}>{o.receiverPhone}</td>
                    <td>{o.paymentMethod === 'COD' ? '💵 COD' : '🏦 Chuyển khoản'}</td>
                    <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{fmtVND(o.totalAmount)}</span></td>
                    <td><span className={`badge ${STATUS_CLASS[o.status]}`}>{o.status}</span></td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(o.orderDate).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-info btn-sm" onClick={() => openDetail(o.orderId)}>📋 Chi tiết</button>
                        {NEXT_STATUS[o.status] && (
                          <button className="btn btn-success btn-sm" onClick={() => { setNextSt(NEXT_STATUS[o.status]); setConfirm({ id: o.orderId, action: 'status' }); }}>
                            → {NEXT_STATUS[o.status]}
                          </button>
                        )}
                        {o.status !== 'Đã hủy' && o.status !== 'Hoàn thành' && (
                          <button className="btn btn-danger btn-sm" onClick={() => setConfirm({ id: o.orderId, action: 'cancel' })}>✕ Hủy</button>
                        )}
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
              <h3>📋 Chi tiết đơn hàng #{detail.orderId}</h3>
              <button className="modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Status flow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24, overflow: 'auto' }}>
                {STATUSES.filter(s => s !== 'Đã hủy').map((s, i, arr) => (
                  <React.Fragment key={s}>
                    <div style={{ textAlign: 'center', minWidth: 110 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', margin: '0 auto 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13,
                        background: detail.status === s ? 'var(--primary)' : STATUSES.indexOf(detail.status) > STATUSES.indexOf(s) ? '#dcfce7' : '#f3f4f6',
                        color: detail.status === s ? '#fff' : STATUSES.indexOf(detail.status) > STATUSES.indexOf(s) ? 'var(--green)' : 'var(--muted)' }}>
                        {i + 1}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: detail.status === s ? 700 : 400, color: detail.status === s ? 'var(--primary)' : 'var(--muted)' }}>{s}</div>
                    </div>
                    {i < arr.length - 1 && <div style={{ flex: 1, height: 2, background: STATUSES.indexOf(detail.status) > i ? 'var(--green)' : '#e5e7eb', minWidth: 20 }}/>}
                  </React.Fragment>
                ))}
              </div>

              <div className="form-row form-row-2" style={{ marginBottom: 20 }}>
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, textTransform: 'uppercase', letterSpacing: .4, color: 'var(--muted)' }}>Thông tin giao hàng</div>
                  <div style={{ fontSize: 13, lineHeight: 2 }}>
                    <div><strong>Người nhận:</strong> {detail.ReceiverName}</div>
                    <div><strong>SĐT:</strong> {detail.ReceiverPhone}</div>
                    <div><strong>Địa chỉ:</strong> {detail.ReceiverAddress}</div>
                    {detail.Note && <div><strong>Ghi chú:</strong> {detail.Note}</div>}
                  </div>
                </div>
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, textTransform: 'uppercase', letterSpacing: .4, color: 'var(--muted)' }}>Thanh toán</div>
                  <div style={{ fontSize: 13, lineHeight: 2 }}>
                    <div><strong>Phương thức:</strong> {detail.PaymentMethod === 'COD' ? '💵 COD' : '🏦 Chuyển khoản'}</div>
                    <div><strong>Ngày đặt:</strong> {new Date(detail.OrderDate).toLocaleString('vi-VN')}</div>
                    <div><strong>Trạng thái:</strong> <span className={`badge ${STATUS_CLASS[detail.status]}`}>{detail.status}</span></div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>{fmtVND(detail.totalAmount)}</div>
                  </div>
                </div>
              </div>

              {/* Order items - OrderDetails join Products */}
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Chi tiết sản phẩm</div>
              <table>
                <thead><tr><th>Sản phẩm</th><th>Đơn giá (UnitPrice)</th><th>SL (Quantity)</th><th>Thành tiền (Subtotal)</th></tr></thead>
                <tbody>
                  {(detail.OrderDetails || detail.Items || []).map((item, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {item.imageUrl ? <img src={item.imageUrl} alt="" className="img-preview"/> : <div className="img-preview">🌸</div>}
                          <span style={{ fontWeight: 600 }}>{item.productName}</span>
                        </div>
                      </td>
                      <td>{fmtVND(item.unitPrice)}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{fmtVND(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>Đóng</button>
              {NEXT_STATUS[detail.status] && (
                <button className="btn btn-success" onClick={() => { setNextSt(NEXT_STATUS[detail.status]); setConfirm({ id: detail.orderId, action: 'status' }); }}>
                  ✅ → {NEXT_STATUS[detail.status]}
                </button>
              )}
              {detail.status !== 'Đã hủy' && detail.status !== 'Hoàn thành' && (
                <button className="btn btn-danger" style={{ background: 'var(--red)', color: '#fff' }} onClick={() => setConfirm({ id: detail.orderId, action: 'cancel' })}>
                  ✕ Hủy đơn
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm */}
      {confirm?.action === 'status' && (
        <ConfirmModal title="Cập nhật trạng thái" message={`Xác nhận chuyển sang trạng thái: "${nextSt}"?`} danger={false} onConfirm={handleUpdateStatus} onCancel={() => setConfirm(null)}/>
      )}
      {confirm?.action === 'cancel' && (
        <ConfirmModal title="Hủy đơn hàng" message="Bạn có chắc muốn hủy đơn hàng này?" onConfirm={handleCancel} onCancel={() => setConfirm(null)}/>
      )}
    </div>
  );
}
