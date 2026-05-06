import React, { useState, useEffect, useCallback } from 'react';
import { orderAPI, IMG_URL } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const fmtVND = n => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';
const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN') : '-';
const imgSrc = (url) => { if (!url) return ''; if (url.startsWith('http')) return url; return IMG_URL + url; };

const STATUSES = ['Chờ xử lý', 'Đã xác nhận', 'Đang giao', 'Hoàn thành', 'Đã hủy'];
const NEXT = { 'Chờ xử lý': 'Đã xác nhận', 'Đã xác nhận': 'Đang giao', 'Đang giao': 'Hoàn thành' };
const BADGE = { 'Chờ xử lý': 'badge-warning', 'Đã xác nhận': 'badge-info', 'Đang giao': 'badge-primary', 'Hoàn thành': 'badge-success', 'Đã hủy': 'badge-danger' };
const LIMIT = 10;

export default function OrdersPage() {
  const { addToast } = useAdmin();
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (status) params.status = status;
      if (payment) params.paymentMethod = payment;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const res = await orderAPI.getAll(params);
      setList(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch { addToast('Lỗi tải đơn hàng', 'error'); }
    finally { setLoading(false); }
  }, [page, search, status, payment, fromDate, toDate]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    try { const res = await orderAPI.getById(id); setDetail(res.data); }
    catch { addToast('Lỗi tải chi tiết', 'error'); }
  };

  const updateStatus = async () => {
    try { await orderAPI.updateStatus(confirm.id, confirm.nextStatus); addToast('Cập nhật trạng thái thành công'); setConfirm(null); load(); }
    catch { addToast('Lỗi cập nhật', 'error'); }
  };

  const handleCancel = async () => {
    if (!cancelReason) { addToast('Vui lòng nhập lý do hủy', 'error'); return; }
    try { await orderAPI.cancel(cancelId, cancelReason); addToast('Đã hủy đơn hàng'); setCancelId(null); setCancelReason(''); load(); }
    catch { addToast('Lỗi hủy đơn', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quản lý đơn hàng</div>
          <div className="page-subtitle">{total} đơn hàng</div>
        </div>
      </div>

      <div className="filters-bar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên, SĐT người nhận..." style={{ width: 200 }}/>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ width: 140 }}>
          <option value="">Tất cả trạng thái</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={payment} onChange={e => { setPayment(e.target.value); setPage(1); }} style={{ width: 160 }}>
          <option value="">Phương thức TT</option>
          <option value="COD">COD</option>
          <option value="Banking">Chuyển khoản</option>
        </select>
        <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} title="Từ ngày"/>
        <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} title="Đến ngày"/>
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead>
                <tr><th>Mã</th><th>Người nhận</th><th>SĐT</th><th>Thanh toán</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày đặt</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>Không có đơn hàng</td></tr>}
                {list.map(o => (
                  <tr key={o.orderId}>
                    <td>#{o.orderId}</td>
                    <td>{o.receiverName}</td>
                    <td>{o.receiverPhone}</td>
                    <td>{o.paymentMethod}</td>
                    <td>{fmtVND(o.totalAmount)}</td>
                    <td><span className={`badge ${BADGE[o.status] || ''}`}>{o.status}</span></td>
                    <td>{fmtDate(o.orderDate)}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-info btn-sm" onClick={() => openDetail(o.orderId)}>Chi tiết</button>
                        {NEXT[o.status] && <button className="btn btn-success btn-sm" onClick={() => setConfirm({ id: o.orderId, nextStatus: NEXT[o.status] })}>{NEXT[o.status]}</button>}
                        {o.status !== 'Hoàn thành' && o.status !== 'Đã hủy' && <button className="btn btn-danger btn-sm" onClick={() => setCancelId(o.orderId)}>Hủy</button>}
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
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết đơn hàng #{detail.orderId}</h3>
              <button className="modal-close" onClick={() => setDetail(null)}>X</button>
            </div>
            <div className="modal-body">
              <p><strong>Người nhận:</strong> {detail.receiverName} - {detail.receiverPhone}</p>
              <p><strong>Địa chỉ:</strong> {detail.receiverAddress}</p>
              <p><strong>Thanh toán:</strong> {detail.paymentMethod}</p>
              <p><strong>Trạng thái:</strong> {detail.status}</p>
              <p><strong>Ghi chú:</strong> {detail.note || 'Không có'}</p>
              <p><strong>Ngày đặt:</strong> {fmtDate(detail.orderDate)}</p>
              <table style={{ marginTop: 12 }}>
                <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th></tr></thead>
                <tbody>
                  {detail.orderDetails?.map(d => (
                    <tr key={d.orderDetailId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {d.product?.imageUrl && <img src={imgSrc(d.product.imageUrl)} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }}/>}
                          {d.product?.productName || `SP #${d.productId}`}
                        </div>
                      </td>
                      <td>{fmtVND(d.unitPrice)}</td>
                      <td>{d.quantity}</td>
                      <td>{fmtVND(d.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ marginTop: 12, fontWeight: 700 }}>Tổng cộng: {fmtVND(detail.totalAmount)}</p>
            </div>
          </div>
        </div>
      )}

      {confirm && <ConfirmModal title="Cập nhật trạng thái" message={`Chuyển sang "${confirm.nextStatus}"?`} onConfirm={updateStatus} onCancel={() => setConfirm(null)}/>}

      {cancelId && (
        <div className="modal-backdrop" onClick={() => setCancelId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Hủy đơn hàng #{cancelId}</h3><button className="modal-close" onClick={() => setCancelId(null)}>X</button></div>
            <div className="modal-body">
              <div className="form-group"><label>Lý do hủy *</label>
                <textarea rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Nhập lý do hủy đơn hàng..."/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCancelId(null)}>Đóng</button>
              <button className="btn btn-danger" onClick={handleCancel}>Xác nhận hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
