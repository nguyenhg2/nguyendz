import { useState } from 'react';
import { userAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import usePagedList from '../hooks/usePagedList';
import { boolParam, formatDate } from '../utils/format';

export default function CustomersPage() {
  const { addToast } = useAdmin();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [confirm, setConfirm] = useState(null);
  const { list, total, totalPages, page, setPage, loading, load } = usePagedList(
    userAPI.getAll,
    { search, role: roleFilter, isActive: boolParam(activeFilter) },
    'Loi tai nguoi dung'
  );

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
                    <td>{formatDate(u.createdDate)}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => setConfirm(u.userId)}>{u.isActive ? 'Khóa' : 'Mở khóa'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination current={page} total={totalPages} onChange={setPage}/>
      </div>

      {confirm && <ConfirmModal title="Thay đổi trạng thái" message="Bạn có chắc chắn muốn khóa/mở khóa người dùng này?" onConfirm={handleToggle} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
