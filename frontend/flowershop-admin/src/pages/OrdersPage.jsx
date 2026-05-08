import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../context/AdminContext';
import { orderAPI, IMG_URL } from '../services/api';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

export default function OrdersPage() {
  const { showToast } = useContext(AdminContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [detail, setDetail] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [confirmOrder, setConfirmOrder] = useState(null);

  const pageSize = 10;

  useEffect(() => {
    load();
  }, [page, statusFilter, paymentFilter, dateFrom, dateTo]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.paymentMethod = paymentFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await orderAPI.getAll(params);
      setOrders(res.data.items || res.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      showToast('Lỗi tải đơn hàng', 'error');
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const imgSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return IMG_URL + url;
  };

  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';

  const statusLabel = (s) => {
    const map = {
      Pending: 'Chờ xử lý',
      Confirmed: 'Đã xác nhận',
      Shipping: 'Đang giao',
      Completed: 'Hoàn thành',
      Cancelled: 'Đã hủy'
    };
    return map[s] || s;
  };

  const statusColor = (s) => {
    const map = {
      Pending: '#f39c12',
      Confirmed: '#3498db',
      Shipping: '#9b59b6',
      Completed: '#27ae60',
      Cancelled: '#e74c3c'
    };
    return map[s] || '#666';
  };

  // Sửa lỗi: normalize payment method để tìm kiếm chính xác
  const paymentLabel = (p) => {
    if (!p) return '-';
    const lower = p.toLowerCase().replace(/[\s_]/g, '');
    if (lower === 'cod') return 'COD';
    if (lower === 'bank' || lower === 'banktransfer' || lower.includes('chuyenkhoan') || lower.includes('chuyển')) return 'Chuyển khoản';
    return p;
  };

  const nextStatus = (s) => {
    const flow = { Pending: 'Confirmed', Confirmed: 'Shipping', Shipping: 'Completed' };
    return flow[s] || null;
  };

  const handleConfirmStatus = async () => {
    if (!confirmOrder) return;
    const next = nextStatus(confirmOrder.status);
    if (!next) return;
    try {
      await orderAPI.updateStatus(confirmOrder.orderId || confirmOrder.id, { status: next });
      showToast('Cập nhật trạng thái thành công');
      setConfirmOrder(null);
      load();
    } catch {
      showToast('Lỗi cập nhật trạng thái', 'error');
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      showToast('Vui lòng nhập lý do hủy', 'error');
      return;
    }
    try {
      await orderAPI.cancel(cancelId, { reason: cancelReason });
      showToast('Đã hủy đơn hàng');
      setCancelId(null);
      setCancelReason('');
      load();
    } catch {
      showToast('Lỗi hủy đơn hàng', 'error');
    }
  };

  const openDetail = async (id) => {
    try {
      const res = await orderAPI.getById(id);
      setDetail(res.data);
    } catch {
      showToast('Lỗi tải chi tiết', 'error');
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Quản lý đơn hàng</h2>

      {/* Bộ lọc */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Tìm theo tên, SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" style={btnPrimary}>Tìm</button>
        </form>

        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={inputStyle}>
          <option value="">Tất cả trạng thái</option>
          <option value="Pending">Chờ xử lý</option>
          <option value="Confirmed">Đã xác nhận</option>
          <option value="Shipping">Đang giao</option>
          <option value="Completed">Hoàn thành</option>
          <option value="Cancelled">Đã hủy</option>
        </select>

        <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1); }} style={inputStyle}>
          <option value="">Tất cả PT thanh toán</option>
          <option value="COD">COD</option>
          <option value="BankTransfer">Chuyển khoản</option>
        </select>

        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} style={inputStyle} />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} style={inputStyle} />
      </div>

      {/* Bảng đơn hàng */}
      {loading ? <p>Đang tải...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
              <th style={th}>#</th>
              <th style={th}>Người nhận</th>
              <th style={th}>SĐT</th>
              <th style={th}>Thanh toán</th>
              <th style={th}>Tổng tiền</th>
              <th style={th}>Trạng thái</th>
              <th style={th}>Ngày đặt</th>
              <th style={th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 20, textAlign: 'center', color: '#888' }}>Không có đơn hàng nào</td></tr>
            )}
            {orders.map(o => (
              <tr key={o.orderId || o.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={td}>{o.orderId || o.id}</td>
                <td style={td}>{o.receiverName || o.fullName || '-'}</td>
                <td style={td}>{o.receiverPhone || o.phone || '-'}</td>
                <td style={td}>{paymentLabel(o.paymentMethod)}</td>
                <td style={td}>{fmt(o.totalPrice || o.total)}</td>
                <td style={td}>
                  <span style={{
                    padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                    color: '#fff', background: statusColor(o.status)
                  }}>
                    {statusLabel(o.status)}
                  </span>
                </td>
                <td style={td}>{new Date(o.orderDate || o.createdDate).toLocaleDateString('vi-VN')}</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openDetail(o.orderId || o.id)} style={{ ...btnSmall, background: '#3498db' }}>Chi tiết</button>
                    {nextStatus(o.status) && (
                      <button onClick={() => setConfirmOrder(o)} style={{ ...btnSmall, background: '#27ae60' }}>Duyệt</button>
                    )}
                    {o.status !== 'Cancelled' && o.status !== 'Completed' && (
                      <button onClick={() => setCancelId(o.orderId || o.id)} style={{ ...btnSmall, background: '#e74c3c' }}>Hủy</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Modal chi tiết - có thêm tên khách hàng */}
      {detail && (
        <div style={backdrop} onClick={() => setDetail(null)}>
          <div style={{ ...modalStyle, maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Chi tiết đơn hàng #{detail.orderId || detail.id}</h3>
              <button onClick={() => setDetail(null)} style={closeBtn}>&times;</button>
            </div>

            <div style={{ marginBottom: 16, padding: 14, background: '#f8f9fa', borderRadius: 8, fontSize: 14, lineHeight: 2 }}>
              <p style={{ margin: 0 }}><strong>Khách hàng:</strong> {detail.customerName || detail.userName || detail.user?.fullName || '-'}</p>
              <p style={{ margin: 0 }}><strong>Người nhận:</strong> {detail.receiverName || detail.fullName || '-'}</p>
              <p style={{ margin: 0 }}><strong>SĐT:</strong> {detail.receiverPhone || detail.phone || '-'}</p>
              <p style={{ margin: 0 }}><strong>Địa chỉ:</strong> {detail.shippingAddress || detail.address || '-'}</p>
              <p style={{ margin: 0 }}><strong>Thanh toán:</strong> {paymentLabel(detail.paymentMethod)}</p>
              <p style={{ margin: 0 }}><strong>Trạng thái:</strong> {statusLabel(detail.status)}</p>
              <p style={{ margin: 0 }}><strong>Ghi chú:</strong> {detail.note || 'Không có'}</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f0f0f0' }}>
                  <th style={th}>Ảnh</th>
                  <th style={th}>Sản phẩm</th>
                  <th style={th}>SL</th>
                  <th style={th}>Đơn giá</th>
                  <th style={th}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {(detail.orderDetails || detail.items || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={td}>
                      <img src={imgSrc(item.imageUrl || item.image)} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }} />
                    </td>
                    <td style={td}>{item.productName || item.name}</td>
                    <td style={td}>{item.quantity}</td>
                    <td style={td}>{fmt(item.price)}</td>
                    <td style={td}>{fmt(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'right', marginTop: 14, fontWeight: 700, fontSize: 16, color: '#e91e63' }}>
              Tổng: {fmt(detail.totalPrice || detail.total)}
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận duyệt đơn */}
      {confirmOrder && (
        <ConfirmModal
          title="Xác nhận"
          message={`Duyệt đơn hàng #${confirmOrder.orderId || confirmOrder.id} sang trạng thái "${statusLabel(nextStatus(confirmOrder.status))}"?`}
          onConfirm={handleConfirmStatus}
          onCancel={() => setConfirmOrder(null)}
        />
      )}

      {/* Modal hủy đơn */}
      {cancelId && (
        <div style={backdrop} onClick={() => setCancelId(null)}>
          <div style={{ ...modalStyle, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Hủy đơn hàng #{cancelId}</h3>
            <textarea
              placeholder="Nhập lý do hủy..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              style={{ width: '100%', minHeight: 80, padding: 10, borderRadius: 6, border: '1px solid #ddd', resize: 'vertical', fontSize: 14 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <button onClick={() => { setCancelId(null); setCancelReason(''); }} style={{ padding: '8px 18px', border: 'none', borderRadius: 6, background: '#e74c3c', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
              <button onClick={handleCancel} style={{ padding: '8px 18px', border: 'none', borderRadius: 6, background: '#27ae60', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 };
const btnPrimary = { padding: '8px 16px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 };
const btnSmall = { padding: '5px 10px', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 };
const th = { padding: '10px 8px', fontSize: 13, fontWeight: 600 };
const td = { padding: '10px 8px', fontSize: 13 };
const backdrop = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 };
const modalStyle = { background: '#fff', borderRadius: 10, padding: 24, width: '90%', maxHeight: '85vh', overflow: 'auto' };
const closeBtn = { background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' };
