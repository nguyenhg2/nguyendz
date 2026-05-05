import React, { useState, useEffect, useCallback } from 'react';
import { categoryAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

export default function CategoriesPage() {
  const { addToast } = useAdmin();
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ categoryName: '', description: '', imageUrl: '', sortOrder: 0, isActive: true });
  const [editId, setEditId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (activeFilter !== '') params.isActive = activeFilter === 'true';
      const res = await categoryAPI.getAll(params);
      setList(res.data.items || res.data || []);
      setTotal(res.data.total || res.data.length || 0);
    } catch { addToast('Lỗi tải danh mục', 'error'); }
    finally { setLoading(false); }
  }, [page, search, activeFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ categoryName: '', description: '', imageUrl: '', sortOrder: 0, isActive: true }); setEditId(null); setModal(true); };
  const openEdit = (c) => { setForm({ categoryName: c.categoryName, description: c.description || '', imageUrl: c.imageUrl || '', sortOrder: c.sortOrder || 0, isActive: !!c.isActive }); setEditId(c.categoryId); setModal(true); };

  const handleSave = async () => {
    if (!form.categoryName) { addToast('Nhập tên danh mục', 'error'); return; }
    setSaving(true);
    try {
      if (editId) await categoryAPI.update(editId, form);
      else await categoryAPI.create(form);
      addToast(editId ? 'Cập nhật thành công' : 'Thêm thành công');
      setModal(false); load();
    } catch { addToast('Lỗi', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await categoryAPI.remove(confirm); addToast('Đã xóa'); setConfirm(null); load(); }
    catch { addToast('Lỗi xóa', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quản lý danh mục</div>
          <div className="page-subtitle">{total} danh mục</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Thêm danh mục</button>
      </div>

      <div className="filters-bar" style={{ gap: 8 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên danh mục..." style={{ width: 220 }}/>
        <select value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(1); }} style={{ width: 140 }}>
          <option value="">Tất cả</option>
          <option value="true">Đang hiện</option>
          <option value="false">Đã ẩn</option>
        </select>
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead><tr><th>ID</th><th>Tên</th><th>Mô tả</th><th>Thứ tự</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Không có danh mục</td></tr>}
                {list.map(c => (
                  <tr key={c.categoryId}>
                    <td>#{c.categoryId}</td>
                    <td style={{ fontWeight: 600 }}>{c.categoryName}</td>
                    <td>{c.description || '-'}</td>
                    <td>{c.sortOrder}</td>
                    <td>
                      <label className="switch">
                        <input type="checkbox" checked={!!c.isActive} onChange={() => categoryAPI.toggle(c.categoryId).then(load)}/>
                        <span className="slider"/>
                      </label>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-info btn-sm" onClick={() => openEdit(c)}>Sửa</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm(c.categoryId)}>Xóa</button>
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

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>X</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Tên danh mục *</label><input value={form.categoryName} onChange={e => setForm({...form, categoryName: e.target.value})}/></div>
              <div className="form-group"><label>Mô tả</label><textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})}/></div>
              <div className="form-group"><label>URL ảnh</label><input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})}/></div>
              <div className="form-group"><label>Thứ tự</label><input type="number" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: +e.target.value})}/></div>
              <label><input type="checkbox" checked={!!form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})}/> Hiển thị</label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
            </div>
          </div>
        </div>
      )}

      {confirm && <ConfirmModal title="Xóa danh mục" message="Bạn có chắc muốn xóa?" onConfirm={handleDelete} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
