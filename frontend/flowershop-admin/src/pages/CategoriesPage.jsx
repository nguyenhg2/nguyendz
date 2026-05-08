import React, { useState, useEffect, useCallback } from 'react';
import { categoryAPI, IMG_URL } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const imgSrc = (url) => { if (!url) return ''; if (url.startsWith('http')) return url; return IMG_URL + url; };
const LIMIT = 10;

export default function CategoriesPage() {
  const { addToast } = useAdmin();
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imgFile, setImgFile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, includeInactive: true };
      if (search) params.search = search;
      if (activeFilter !== '') params.isActive = activeFilter === 'true';
      const res = await categoryAPI.getAll(params);
      const data = res.data;
      setList(data.items || data || []);
      setTotal(data.total || (data.length ? data.length : 0));
    } catch { addToast('Lỗi tải danh mục', 'error'); }
    finally { setLoading(false); }
  }, [page, search, activeFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm({ categoryName: '', description: '', sortOrder: 0, isActive: true });
    setEditId(null); setImgFile(null); setModal(true);
  };

  const openEdit = (c) => {
    setForm({ categoryName: c.categoryName, description: c.description || '', sortOrder: c.sortOrder || 0, isActive: !!c.isActive, currentImage: c.imageUrl || '' });
    setEditId(c.categoryId); setImgFile(null); setModal(true);
  };

  const handleSave = async () => {
    if (!form.categoryName) { addToast('Vui lòng nhập tên danh mục', 'error'); return; }
    setSaving(true);
    try {
      let id = editId;
      const payload = { categoryName: form.categoryName, description: form.description, sortOrder: form.sortOrder, isActive: form.isActive };
      if (editId) { await categoryAPI.update(editId, payload); }
      else { const res = await categoryAPI.create(payload); id = res.data.categoryId; }
      if (imgFile && id) {
        const fd = new FormData();
        fd.append('file', imgFile);
        await categoryAPI.uploadImage(id, fd);
      }
      addToast(editId ? 'Cập nhật thành công' : 'Thêm thành công');
      setModal(false); load();
    } catch { addToast('Lỗi lưu danh mục', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await categoryAPI.remove(confirm); addToast('Đã xóa danh mục'); setConfirm(null); load(); }
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
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên danh mục..." style={{ width: 200 }}/>
        <select value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(1); }} style={{ width: 140 }}>
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hiện</option>
          <option value="false">Đã ẩn</option>
        </select>
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead><tr><th>ID</th><th>Danh mục</th><th>Mô tả</th><th>Thứ tự</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Không có danh mục</td></tr>}
                {list.map(c => (
                  <tr key={c.categoryId}>
                    <td>#{c.categoryId}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {c.imageUrl && <img src={imgSrc(c.imageUrl)} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }}/>}
                        <span style={{ fontWeight: 600 }}>{c.categoryName}</span>
                      </div>
                    </td>
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
            <div className="modal-header"><h3>{editId ? 'Sửa danh mục' : 'Thêm danh mục'}</h3><button className="modal-close" onClick={() => setModal(false)}>X</button></div>
            <div className="modal-body">
              <div className="form-group"><label>Tên danh mục *</label><input value={form.categoryName} onChange={e => setForm({...form, categoryName: e.target.value})}/></div>
              <div className="form-group"><label>Mô tả</label><textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})}/></div>
              <div className="form-group">
                <label>Ảnh danh mục</label>
                <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files[0])}/>
                {imgFile && <img src={URL.createObjectURL(imgFile)} alt="" style={{ width: 80, marginTop: 8, borderRadius: 4 }}/>}
                {!imgFile && form.currentImage && <img src={imgSrc(form.currentImage)} alt="" style={{ width: 80, marginTop: 8, borderRadius: 4 }}/>}
              </div>
              <div className="form-group"><label>Thứ tự hiển thị</label><input type="number" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: parseInt(e.target.value) || 0})}/></div>
              <label><input type="checkbox" checked={!!form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})}/> Hiển thị</label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
            </div>
          </div>
        </div>
      )}

      {confirm && <ConfirmModal title="Xóa danh mục" message="Bạn có chắc chắn muốn xóa danh mục này?" onConfirm={handleDelete} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
