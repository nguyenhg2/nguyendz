import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { orderAPI, IMG_URL } from '../services/api';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

export default function OrdersPage() {
  const { addToast } = useAdmin();
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
    load(page);
  }, [page, statusFilter, paymentFilter, dateFrom, dateTo]);

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const params = { page: nextPage, pageSize };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.paymentMethod = paymentFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await orderAPI.getAll(params);
      setOrders(res.data.items || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      addToast('Lỗi tải đơn hàng', 'error');
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (page === 1) load(1);
    else setPage(1);
  };

  const imgSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return IMG_URL + url;
  };

  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
  const orderItems = (order) => order?.orderDetails || order?.items || [];
  const orderTotal = (order) => order?.totalAmount || order?.totalPrice || order?.total || 0;
  const itemPrice = (item) => item.price || item.unitPrice || 0;
  const itemTotal = (item) => item.subtotal || itemPrice(item) * (item.quantity || 0);

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
      Cancelled: '#e74c3c',
      'Chờ xử lý': '#f39c12',
      'Đã xác nhận': '#3498db',
      'Đang giao': '#9b59b6',
      'Hoàn thành': '#27ae60',
      'Đã hủy': '#e74c3c'
    };
    return map[s] || '#666';
  };

  const paymentLabel = (p) => {
    if (!p) return '-';
    return p.toLowerCase() === 'cod' ? 'COD' : 'Thanh toán';
  };

  const nextStatus = (s) => {
    const flow = {
      Pending: 'Confirmed',
      Confirmed: 'Shipping',
      Shipping: 'Completed',
      'Chờ xử lý': 'Đã xác nhận',
      'Đã xác nhận': 'Đang giao',
      'Đang giao': 'Hoàn thành'
    };
    return flow[s] || null;
  };

  const openDetail = async (id) => {
    try {
      const res = await orderAPI.getById(id);
      setDetail(res.data);
    } catch {
      addToast('Lỗi tải chi tiết', 'error');
    }
  };

  const handleConfirmStatus = async () => {
    if (!confirmOrder) return;
    const next = nextStatus(confirmOrder.status);
    if (!next) return;
    try {
      await orderAPI.updateStatus(confirmOrder.orderId || confirmOrder.id, { status: next });
      addToast('Cập nhật trạng thái thành công');
      setConfirmOrder(null);
      load();
    } catch {
      addToast('Lỗi cập nhật trạng thái', 'error');
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      addToast('Vui lòng nhập lý do hủy', 'error');
      return;
    }
    try {
      await orderAPI.cancel(cancelId, { reason: cancelReason });
      addToast('Đã hủy đơn hàng');
      setCancelId(null);
      setCancelReason('');
      load();
    } catch {
      addToast('Lỗi hủy đơn hàng', 'error');
    }
  };

  const exportPdf = () => {
    if (!detail) return;
    const rows = orderItems(detail).map(item => `
      <tr>
        <td>${item.productName || item.name || ''}</td>
        <td>${item.quantity || 0}</td>
        <td>${fmt(itemPrice(item))}</td>
        <td>${fmt(itemTotal(item))}</td>
      </tr>
    `).join('');
    const html = `
      <html>
        <head>
          <title>Hoa don #${detail.orderId || detail.id}</title>
          <style>
            body{font-family:Arial,sans-serif;padding:24px;color:#222}
            h2{text-align:center;margin:0 0 20px}
            p{margin:4px 0}
            table{width:100%;border-collapse:collapse;margin-top:18px}
            th,td{border:1px solid #ddd;padding:8px;text-align:left}
            th{background:#f5f5f5}
            .total{text-align:right;margin-top:16px;font-size:18px;font-weight:700}
          </style>
        </head>
        <body>
          <h2>Hóa đơn bán hàng</h2>
          <p><b>Mã đơn:</b> #${detail.orderId || detail.id}</p>
          <p><b>Khách hàng:</b> ${detail.customerName || detail.userName || '-'}</p>
          <p><b>Người nhận:</b> ${detail.receiverName || '-'}</p>
          <p><b>SĐT:</b> ${detail.receiverPhone || '-'}</p>
          <p><b>Địa chỉ:</b> ${detail.receiverAddress || detail.shippingAddress || detail.address || '-'}</p>
          <p><b>Thanh toán:</b> ${paymentLabel(detail.paymentMethod)}</p>
          <table>
            <thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="total">Tổng: ${fmt(orderTotal(detail))}</div>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Quản lý đơn hàng</h2>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Tìm theo tên, SĐT..." value={search} onChange={e => setSearch(e.target.value)} style={inputStyle} />
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
          <option value="">Tất cả thanh toán</option>
          <option value="cod">COD</option>
          <option value="payment">Thanh toán</option>
        </select>

        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} style={inputStyle} />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} style={inputStyle} />
      </div>

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
                <td style={td}>{fmt(orderTotal(o))}</td>
                <td style={td}>
                  <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', background: statusColor(o.status) }}>
                    {statusLabel(o.status)}
                  </span>
                </td>
                <td style={td}>{new Date(o.orderDate || o.createdDate).toLocaleDateString('vi-VN')}</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openDetail(o.orderId || o.id)} style={{ ...btnSmall, background: '#3498db' }}>Chi tiết</button>
                    {nextStatus(o.status) && <button onClick={() => setConfirmOrder(o)} style={{ ...btnSmall, background: '#27ae60' }}>Duyệt</button>}
                    {o.status !== 'Cancelled' && o.status !== 'Completed' && o.status !== 'Đã hủy' && o.status !== 'Hoàn thành' && (
                      <button onClick={() => setCancelId(o.orderId || o.id)} style={{ ...btnSmall, background: '#e74c3c' }}>Hủy</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pagination current={page} total={totalPages} onChange={setPage} />

      {detail && (
        <div style={backdrop} onClick={() => setDetail(null)}>
          <div style={{ ...modalStyle, maxWidth: 660 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Chi tiết đơn hàng #{detail.orderId || detail.id}</h3>
              <button onClick={() => setDetail(null)} style={closeBtn}>&times;</button>
            </div>

            <div style={{ marginBottom: 16, padding: 14, background: '#f8f9fa', borderRadius: 8, fontSize: 14, lineHeight: 2 }}>
              <p style={{ margin: 0 }}><strong>Khách hàng:</strong> {detail.customerName || detail.userName || '-'}</p>
              <p style={{ margin: 0 }}><strong>Người nhận:</strong> {detail.receiverName || '-'}</p>
              <p style={{ margin: 0 }}><strong>SĐT:</strong> {detail.receiverPhone || '-'}</p>
              <p style={{ margin: 0 }}><strong>Địa chỉ:</strong> {detail.receiverAddress || detail.shippingAddress || detail.address || '-'}</p>
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
                {orderItems(detail).map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={td}>
                      {imgSrc(item.imageUrl || item.image) && <img src={imgSrc(item.imageUrl || item.image)} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }} />}
                    </td>
                    <td style={td}>{item.productName || item.name}</td>
                    <td style={td}>{item.quantity}</td>
                    <td style={td}>{fmt(itemPrice(item))}</td>
                    <td style={td}>{fmt(itemTotal(item))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'right', marginTop: 14, fontWeight: 700, fontSize: 16, color: '#e91e63' }}>
              Tổng: {fmt(orderTotal(detail))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => setDetail(null)} style={btnDanger}>Hủy</button>
              <button onClick={exportPdf} style={btnPrimary}>Xuất PDF</button>
            </div>
          </div>
        </div>
      )}

      {confirmOrder && (
        <ConfirmModal
          title="Xác nhận"
          message={`Duyệt đơn hàng #${confirmOrder.orderId || confirmOrder.id} sang trạng thái "${statusLabel(nextStatus(confirmOrder.status))}"?`}
          onConfirm={handleConfirmStatus}
          onCancel={() => setConfirmOrder(null)}
        />
      )}

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
              <button onClick={() => { setCancelId(null); setCancelReason(''); }} style={btnDanger}>Hủy</button>
              <button onClick={handleCancel} style={btnPrimary}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 };
const btnBase = { padding: '8px 18px', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontWeight: 600 };
const btnPrimary = { ...btnBase, background: '#27ae60' };
const btnDanger = { ...btnBase, background: '#e74c3c' };
const btnSmall = { padding: '5px 10px', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 };
const th = { padding: '10px 8px', fontSize: 13, fontWeight: 600 };
const td = { padding: '10px 8px', fontSize: 13 };
const backdrop = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 };
const modalStyle = { background: '#fff', borderRadius: 10, padding: 24, width: '90%', maxHeight: '85vh', overflow: 'auto' };
const closeBtn = { background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' };
