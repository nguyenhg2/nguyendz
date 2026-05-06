import React, { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN') : '-';
const LIMIT = 10;

export default function CustomersPage() {
  const { addToast } = useAdmin();
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (activeFilter !== '') params.isActive = activeFilter === 'true';
      const res = await userAPI.getAll(params);
      setList(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch { addToast('Lỗi tải người dùng', 'error'); }
    finally { setLoading(false); }
  }, [page, search, roleFilter, activeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async () => {
    try { await userAPI.toggle(confirm); addToast('Cập nhật trạng thái thành công'); setConfirm(null); load(); }
    catch { addToast('Lỗi cập nhật', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quản lý người dùng</div>
          <div className="page-subtitle">{total} người dùng</div>
        </div>
      </div>

      <div className="filters-bar" style={{ gap: 8 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên, email, SĐT..." style={{ width: 220 }}/>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={{ width: 140 }}>
          <option value="">Tất cả vai trò</option>
          <option value="Admin">Admin</option>
          <option value="Customer">Khách hàng</option>
        </select>
        <select value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(1); }} style={{ width: 140 }}>
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã khóa</option>
        </select>
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead><tr><th>ID</th><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>Không có người dùng</td></tr>}
                {list.map(u => (
                  <tr key={u.userId}>
                    <td>#{u.userId}</td>
                    <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '-'}</td>
                    <td><span className={`badge ${u.role === 'Admin' ? 'badge-primary' : 'badge-info'}`}>{u.role === 'Admin' ? 'Quản trị' : 'Khách hàng'}</span></td>
                    <td>
                      <label className="switch">
                        <input type="checkbox" checked={!!u.isActive} onChange={() => setConfirm(u.userId)}/>
                        <span className="slider"/>
                      </label>
                    </td>
                    <td>{fmtDate(u.createdDate)}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => setConfirm(u.userId)}>{u.isActive ? 'Khóa' : 'Mở khóa'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination current={page} total={Math.ceil(total / LIMIT)} onChange={setPage}/>
      </div>

      {confirm && <ConfirmModal title="Thay đổi trạng thái" message="Bạn có chắc chắn muốn khóa/mở khóa người dùng này?" onConfirm={handleToggle} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
