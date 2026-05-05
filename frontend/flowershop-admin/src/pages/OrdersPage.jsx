import React, { useState, useEffect, useCallback } from 'react';
import { orderAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const fmtVND = n => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';
const STATUSES = ['Chờ xử lý', 'Đã xác nhận', 'Đang giao', 'Hoàn thành', 'Đã hủy'];
const NEXT = { 'Chờ xử lý': 'Đã xác nhận', 'Đã xác nhận': 'Đang giao', 'Đang giao': 'Hoàn thành' };

export default function OrdersPage() {
  const { addToast } = useAdmin();
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [payment, setPayment] = useState('');
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (status) params.status = status;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (payment) params.paymentMethod = payment;
      const res = await orderAPI.getAll(params);
      setList(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch { addToast('Lỗi tải đơn hàng', 'error'); }
    finally { setLoading(false); }
  }, [page, search, status, fromDate, toDate, payment]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    try { const res = await orderAPI.getById(id); setDetail(res.data); }
    catch { addToast('Lỗi tải chi tiết', 'error'); }
  };

  const handleNext = async (id, nextStatus) => {
    try { await orderAPI.updateStatus(id, nextStatus); addToast('Đã cập nhật: ' + nextStatus); load(); if (detail?.orderId === id) setDetail(d => ({...d, status: nextStatus})); }
    catch { addToast('Lỗi', 'error'); }
  };

  const handleCancel = async () => {
    try { await orderAPI.cancel(confirm, 'Admin hủy đơn'); addToast('Đã hủy đơn hàng'); setConfirm(null); load(); }
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
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên, SĐT người nhận..." style={{ width: 220 }}/>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ width: 150 }}>
          <option value="">Tất cả trạng thái</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={payment} onChange={e => { setPayment(e.target.value); setPage(1); }} style={{ width: 160 }}>
          <option value="">Phương thức TT</option>
          <option value="COD">COD</option>
          <option value="Banking">Chuyển khoản</option>
        </select>
        <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} style={{ width: 140 }}/>
        <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} style={{ width: 140 }}/>
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead>
                <tr><th>ID</th><th>Người nhận</th><th>SĐT</th><th>Thanh toán</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày đặt</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>Không có đơn hàng</td></tr>}
                {list.map(o => (
                  <tr key={o.orderId}>
                    <td>#{o.orderId}</td>
                    <td style={{ fontWeight: 600 }}>{o.receiverName}</td>
                    <td>{o.receiverPhone}</td>
                    <td>{o.paymentMethod}</td>
                    <td style={{ fontWeight: 700 }}>{fmtVND(o.totalAmount)}</td>
                    <td><span className="badge">{o.status}</span></td>
                    <td>{new Date(o.orderDate).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-info btn-sm" onClick={() => openDetail(o.orderId)}>Xem</button>
                        {NEXT[o.status] && <button className="btn btn-success btn-sm" onClick={() => handleNext(o.orderId, NEXT[o.status])}>{NEXT[o.status]}</button>}
                        {o.status !== 'Đã hủy' && o.status !== 'Hoàn thành' && <button className="btn btn-danger btn-sm" onClick={() => setConfirm(o.orderId)}>Hủy</button>}
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
              <p><strong>Thanh toán:</strong> {detail.paymentMethod} | <strong>Trạng thái:</strong> {detail.status}</p>
              {detail.note && <p><strong>Ghi chú:</strong> {detail.note}</p>}
              <table>
                <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th></tr></thead>
                <tbody>
                  {(detail.orderDetails || []).map((item, i) => (
                    <tr key={i}>
                      <td>{item.product?.productName || 'SP #' + item.productId}</td>
                      <td>{fmtVND(item.unitPrice)}</td>
                      <td>{item.quantity}</td>
                      <td>{fmtVND(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontWeight: 700, marginTop: 12 }}>Tổng cộng: {fmtVND(detail.totalAmount)}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDetail(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {confirm && <ConfirmModal title="Hủy đơn hàng" message="Bạn có chắc muốn hủy đơn hàng này?" onConfirm={handleCancel} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
