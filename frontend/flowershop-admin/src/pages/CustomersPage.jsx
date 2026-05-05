import React, { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

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
  const LIMIT = 15;

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
    try { await userAPI.toggle(confirm.userId); addToast('Đã cập nhật'); setConfirm(null); load(); }
    catch { addToast('Lỗi', 'error'); }
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
          <option value="Customer">Khách hàng</option>
          <option value="Admin">Quản trị</option>
        </select>
        <select value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(1); }} style={{ width: 140 }}>
          <option value="">Trạng thái</option>
          <option value="true">Hoạt động</option>
          <option value="false">Đã khóa</option>
        </select>
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead><tr><th>ID</th><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Không có người dùng</td></tr>}
                {list.map(u => (
                  <tr key={u.userId}>
                    <td>#{u.userId}</td>
                    <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '-'}</td>
                    <td>{u.role}</td>
                    <td><span className={`badge ${u.isActive ? 'badge-active' : 'badge-inactive'}`}>{u.isActive ? 'Hoạt động' : 'Đã khóa'}</span></td>
                    <td>
                      <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => setConfirm(u)}>
                        {u.isActive ? 'Khóa' : 'Mở khóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination current={page} total={Math.ceil(total / LIMIT)} onChange={setPage}/>
      </div>

      {confirm && <ConfirmModal title={confirm.isActive ? 'Khóa tài khoản' : 'Mở khóa'} message={`${confirm.isActive ? 'Khóa' : 'Mở khóa'} tài khoản "${confirm.fullName}"?`} onConfirm={handleToggle} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
