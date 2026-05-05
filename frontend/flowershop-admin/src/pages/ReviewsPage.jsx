import React, { useState, useEffect, useCallback } from 'react';
import { reviewAPI, productAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

export default function ReviewsPage() {
  const { addToast } = useAdmin();
  const [list,     setList]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [minRating,setMinRating]= useState('');
  const [confirm,  setConfirm]  = useState(null);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewAPI.getAll({ page, limit: LIMIT, search: search || undefined, minRating: minRating || undefined });
      setList(res.data?.items || res.data || []);
      setTotal(res.data?.total || (res.data?.length ?? 0));
    } catch { addToast('Lỗi tải đánh giá', 'error'); }
    finally { setLoading(false); }
  }, [page, search, minRating, addToast]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    try {
      await reviewAPI.remove(confirm);
      addToast('Đã xóa đánh giá');
      setConfirm(null); load();
    } catch { addToast('Lỗi xóa đánh giá', 'error'); }
  };

  const Stars = ({ n }) => (
    <span className="star-row">
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
      <span style={{ color: 'var(--muted)', marginLeft: 4, fontSize: 11 }}>({n}/5)</span>
    </span>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quản lý đánh giá</div>
          <div className="page-subtitle">{total} đánh giá</div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box" style={{ flex: 1, maxWidth: 340 }}>
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm theo tên sản phẩm, người đánh giá..."/>
        </div>
        <select value={minRating} onChange={e => { setMinRating(e.target.value); setPage(1); }} style={{ width: 160 }}>
          <option value="">Tất cả sao</option>
          {[5,4,3,2,1].map(r => <option key={r} value={r}>{'★'.repeat(r)} {r} sao{r < 5 ? ' trở xuống' : ''}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead>
                <tr><th>ID</th><th>Sản phẩm (ProductId)</th><th>Khách hàng (UserId)</th><th>Xếp hạng (Rating)</th><th>Nhận xét (Comment)</th><th>Ngày đánh giá</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">⭐</div><p>Chưa có đánh giá nào</p></div></td></tr>}
                {list.map(r => (
                  <tr key={r.reviewId}>
                    <td style={{ color: 'var(--muted)', fontWeight: 600 }}>#{r.reviewId}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.productName || `SP #${r.productId}`}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>ProductId: {r.productId}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: 13 }}>{(r.userName || r.fullName || 'K')[0]}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{r.userName || r.fullName || `User #${r.userId}`}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>UserId: {r.userId}</div>
                        </div>
                      </div>
                    </td>
                    <td><Stars n={r.rating}/></td>
                    <td style={{ maxWidth: 280 }}>
                      <div style={{ fontSize: 13, lineHeight: 1.5, color: r.comment ? 'var(--text)' : 'var(--muted)' }}>
                        {r.comment || <em>Không có nhận xét</em>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(r.createdDate).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirm(r.reviewId)}>🗑️ Xóa</button>
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

      {confirm && <ConfirmModal title="Xóa đánh giá" message="Bạn có chắc muốn xóa đánh giá này? Hành động không thể hoàn tác." onConfirm={handleDelete} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
