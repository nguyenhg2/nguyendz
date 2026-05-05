import React, { useState, useEffect, useCallback } from 'react';
import { reviewAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

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
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (minRating) params.minRating = minRating;
      if (maxRating) params.maxRating = maxRating;
      const res = await reviewAPI.getAll(params);
      setList(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch { addToast('Lỗi tải đánh giá', 'error'); }
    finally { setLoading(false); }
  }, [page, search, minRating, maxRating]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    try { await reviewAPI.remove(confirm); addToast('Đã xóa'); setConfirm(null); load(); }
    catch { addToast('Lỗi', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quản lý đánh giá</div>
          <div className="page-subtitle">{total} đánh giá</div>
        </div>
      </div>

      <div className="filters-bar" style={{ gap: 8 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm sản phẩm, người dùng..." style={{ width: 220 }}/>
        <select value={minRating} onChange={e => { setMinRating(e.target.value); setPage(1); }} style={{ width: 120 }}>
          <option value="">Sao từ</option>
          {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} sao</option>)}
        </select>
        <select value={maxRating} onChange={e => { setMaxRating(e.target.value); setPage(1); }} style={{ width: 120 }}>
          <option value="">Sao đến</option>
          {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} sao</option>)}
        </select>
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead><tr><th>ID</th><th>Sản phẩm</th><th>Người dùng</th><th>Số sao</th><th>Nhận xét</th><th>Ngày</th><th>Thao tác</th></tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Không có đánh giá</td></tr>}
                {list.map(r => (
                  <tr key={r.reviewId}>
                    <td>#{r.reviewId}</td>
                    <td>{r.productName || 'SP #' + r.productId}</td>
                    <td>{r.userName || 'User #' + r.userId}</td>
                    <td>{r.rating}/5</td>
                    <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment || '-'}</td>
                    <td>{new Date(r.createdDate).toLocaleDateString('vi-VN')}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => setConfirm(r.reviewId)}>Xóa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination current={page} total={Math.ceil(total / LIMIT)} onChange={setPage}/>
      </div>

      {confirm && <ConfirmModal title="Xóa đánh giá" message="Bạn có chắc muốn xóa đánh giá này?" onConfirm={handleDelete} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
