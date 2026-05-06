import React, { useState, useEffect, useCallback } from 'react';
import { reviewAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN') : '-';
const LIMIT = 10;

export default function ReviewsPage() {
  const { addToast } = useAdmin();
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (minRating) params.minRating = minRating;
      if (maxRating) params.maxRating = maxRating;
      const res = await reviewAPI.getAll(params);
      const data = res.data;
      setList(data.items || data || []);
      setTotal(data.total || (data.length ? data.length : 0));
    } catch { addToast('Lỗi tải đánh giá', 'error'); }
    finally { setLoading(false); }
  }, [page, search, minRating, maxRating]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    try { await reviewAPI.remove(confirm); addToast('Đã xóa đánh giá'); setConfirm(null); load(); }
    catch { addToast('Lỗi xóa', 'error'); }
  };

  const stars = (n) => '★'.repeat(n || 0) + '☆'.repeat(5 - (n || 0));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quản lý đánh giá</div>
          <div className="page-subtitle">{total} đánh giá</div>
        </div>
      </div>

      <div className="filters-bar" style={{ gap: 8 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên sản phẩm, người dùng..." style={{ width: 240 }}/>
        <select value={minRating} onChange={e => { setMinRating(e.target.value); setPage(1); }} style={{ width: 120 }}>
          <option value="">Từ sao</option>
          <option value="1">1 sao</option>
          <option value="2">2 sao</option>
          <option value="3">3 sao</option>
          <option value="4">4 sao</option>
          <option value="5">5 sao</option>
        </select>
        <select value={maxRating} onChange={e => { setMaxRating(e.target.value); setPage(1); }} style={{ width: 120 }}>
          <option value="">Đến sao</option>
          <option value="1">1 sao</option>
          <option value="2">2 sao</option>
          <option value="3">3 sao</option>
          <option value="4">4 sao</option>
          <option value="5">5 sao</option>
        </select>
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead><tr><th>ID</th><th>Sản phẩm</th><th>Người đánh giá</th><th>Số sao</th><th>Nội dung</th><th>Ngày</th><th>Thao tác</th></tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Không có đánh giá</td></tr>}
                {list.map(r => (
                  <tr key={r.reviewId}>
                    <td>#{r.reviewId}</td>
                    <td>{r.product?.productName || `SP #${r.productId}`}</td>
                    <td>{r.user?.fullName || `User #${r.userId}`}</td>
                    <td style={{ color: '#f59e0b' }}>{stars(r.rating)}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment || '-'}</td>
                    <td>{fmtDate(r.createdDate)}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => setConfirm(r.reviewId)}>Xóa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination current={page} total={Math.ceil(total / LIMIT)} onChange={setPage}/>
      </div>

      {confirm && <ConfirmModal title="Xóa đánh giá" message="Bạn có chắc chắn muốn xóa đánh giá này?" onConfirm={handleDelete} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
