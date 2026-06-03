import { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { orderAPI } from '../services/api';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_OPTIONS,
  canCancelOrder,
  getNextOrderStatus,
  isCompletedOrder,
  orderStatusLabel,
} from '../constants/orderStatus';
import { formatCurrency, formatDate, imageSrc } from '../utils/format';

const LIMIT = 10;

const paymentLabel = (method) => (
  String(method || '').toLowerCase() === 'cod' ? 'COD' : 'Thanh toán'
);

const orderItems = (order) => order?.orderDetails || [];
const itemTotal = (item) => item.subtotal ?? (item.unitPrice || 0) * (item.quantity || 0);

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

  async function load(nextPage = page) {
    setLoading(true);
    try {
      const params = { page: nextPage, limit: LIMIT };
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
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, statusFilter, paymentFilter, dateFrom, dateTo]);

  function handleSearch(e) {
    e.preventDefault();
    if (page === 1) load(1);
    else setPage(1);
  }

  async function openDetail(id) {
    try {
      const res = await orderAPI.getById(id);
      setDetail(res.data);
    } catch {
      addToast('Lỗi tải chi tiết', 'error');
    }
  }

  async function handleConfirmStatus() {
    const next = getNextOrderStatus(confirmOrder?.status);
    if (!next) return;

    try {
      await orderAPI.updateStatus(confirmOrder.orderId, { status: next });
      addToast('Cập nhật trạng thái thành công');
      setConfirmOrder(null);
      load();
    } catch {
      addToast('Lỗi cập nhật trạng thái', 'error');
    }
  }

  async function handleCancel() {
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
  }

  function exportInvoice() {
    if (!detail) return;
    if (!isCompletedOrder(detail)) {
      addToast('Chỉ xuất được hóa đơn khi đơn hàng đã hoàn thành', 'error');
      return;
    }

    const rows = orderItems(detail).map(item => `
      <tr>
        <td>${item.productName || ''}</td>
        <td>${item.quantity || 0}</td>
        <td>${formatCurrency(item.unitPrice)}</td>
        <td>${formatCurrency(itemTotal(item))}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Hoa don #${detail.orderId}</title>
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
          <p><b>Mã đơn:</b> #${detail.orderId}</p>
          <p><b>Khách hàng:</b> ${detail.customerName || '-'}</p>
          <p><b>Người nhận:</b> ${detail.receiverName || '-'}</p>
          <p><b>SĐT:</b> ${detail.receiverPhone || '-'}</p>
          <p><b>Địa chỉ:</b> ${detail.receiverAddress || '-'}</p>
          <p><b>Thanh toán:</b> ${paymentLabel(detail.paymentMethod)}</p>
          <table>
            <thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="total">Tổng: ${formatCurrency(detail.totalAmount)}</div>
        </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quản lý đơn hàng</div>
          <div className="page-subtitle">Duyệt, hủy và xem chi tiết đơn hàng</div>
        </div>
      </div>

      <div className="filters-bar">
        <form onSubmit={handleSearch} className="gap-8">
          <input placeholder="Tìm theo tên, SĐT..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn btn-primary">Tìm</button>
        </form>

        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">Tất cả trạng thái</option>
          {ORDER_STATUS_OPTIONS.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>

        <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1); }}>
          <option value="">Tất cả thanh toán</option>
          <option value="cod">COD</option>
          <option value="payment">Thanh toán</option>
        </select>

        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner" /> : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Người nhận</th>
                  <th>SĐT</th>
                  <th>Thanh toán</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày đặt</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>Không có đơn hàng nào</td></tr>}
                {orders.map(order => (
                  <tr key={order.orderId}>
                    <td>#{order.orderId}</td>
                    <td>{order.receiverName || '-'}</td>
                    <td>{order.receiverPhone || '-'}</td>
                    <td>{paymentLabel(order.paymentMethod)}</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td><span className={`badge ${ORDER_STATUS_BADGE[orderStatusLabel(order.status)] || 'badge-pending'}`}>{orderStatusLabel(order.status)}</span></td>
                    <td>{formatDate(order.orderDate)}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-info btn-sm" onClick={() => openDetail(order.orderId)}>Chi tiết</button>
                        {getNextOrderStatus(order.status) && <button className="btn btn-success btn-sm" onClick={() => setConfirmOrder(order)}>Duyệt</button>}
                        {canCancelOrder(order) && <button className="btn btn-danger btn-sm" onClick={() => setCancelId(order.orderId)}>Hủy</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination current={page} total={totalPages} onChange={setPage} />
      </div>

      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết đơn hàng #{detail.orderId}</h3>
              <button className="modal-close" onClick={() => setDetail(null)}>X</button>
            </div>
            <div className="modal-body">
              <div className="detail-box">
                <p><strong>Khách hàng:</strong> {detail.customerName || '-'}</p>
                <p><strong>Người nhận:</strong> {detail.receiverName || '-'}</p>
                <p><strong>SĐT:</strong> {detail.receiverPhone || '-'}</p>
                <p><strong>Địa chỉ:</strong> {detail.receiverAddress || '-'}</p>
                <p><strong>Thanh toán:</strong> {paymentLabel(detail.paymentMethod)}</p>
                <p><strong>Trạng thái:</strong> {orderStatusLabel(detail.status)}</p>
                <p><strong>Ghi chú:</strong> {detail.note || 'Không có'}</p>
              </div>

              <table>
                <thead><tr><th>Ảnh</th><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
                <tbody>
                  {orderItems(detail).map(item => (
                    <tr key={item.orderDetailId}>
                      <td>{item.imageUrl && <img src={imageSrc(item.imageUrl)} alt="" className="img-preview img-sm" />}</td>
                      <td>{item.productName}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td>{formatCurrency(itemTotal(item))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="total-line">Tổng: {formatCurrency(detail.totalAmount)}</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>Đóng</button>
              {isCompletedOrder(detail) && <button className="btn btn-primary" onClick={exportInvoice}>Xuất hóa đơn</button>}
            </div>
          </div>
        </div>
      )}

      {confirmOrder && (
        <ConfirmModal
          title="Xác nhận"
          message={`Duyệt đơn hàng #${confirmOrder.orderId} sang trạng thái "${orderStatusLabel(getNextOrderStatus(confirmOrder.status))}"?`}
          onConfirm={handleConfirmStatus}
          onCancel={() => setConfirmOrder(null)}
        />
      )}

      {cancelId && (
        <div className="modal-backdrop" onClick={() => setCancelId(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Hủy đơn hàng #{cancelId}</h3><button className="modal-close" onClick={() => setCancelId(null)}>X</button></div>
            <div className="modal-body">
              <textarea rows={4} placeholder="Nhập lý do hủy..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setCancelId(null); setCancelReason(''); }}>Đóng</button>
              <button className="btn btn-primary" onClick={handleCancel}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
