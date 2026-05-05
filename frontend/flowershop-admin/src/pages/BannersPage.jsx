import React, { useState, useEffect, useCallback } from 'react';
import { bannerAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

export default function BannersPage() {
  const { addToast } = useAdmin();
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', imageUrl: '', linkUrl: '', sortOrder: 0, isActive: true });
  const [editId, setEditId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const LIMIT = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (activeFilter !== '') params.isActive = activeFilter === 'true';
      const res = await bannerAPI.getAll(params);
      setList(res.data.items || res.data || []);
      setTotal(res.data.total || res.data.length || 0);
    } catch { addToast('Lỗi tải banner', 'error'); }
    finally { setLoading(false); }
  }, [page, search, activeFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm({ title: '', imageUrl: '', linkUrl: '', sortOrder: 0, isActive: true }); setEditId(null); setImgFile(null); setModal(true); };
  const openEdit = (b) => { setForm({ title: b.title || '', imageUrl: b.imageUrl || '', linkUrl: b.linkUrl || '', sortOrder: b.sortOrder || 0, isActive: !!b.isActive }); setEditId(b.bannerId); setImgFile(null); setModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      let id = editId;
      if (editId) await bannerAPI.update(editId, form);
      else { const res = await bannerAPI.create(form); id = res.data.bannerId; }
      if (imgFile && id) { const fd = new FormData(); fd.append('file', imgFile); await bannerAPI.uploadImage(id, fd); }
      addToast(editId ? 'Cập nhật thành công' : 'Thêm thành công');
      setModal(false); load();
    } catch { addToast('Lỗi', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await bannerAPI.remove(confirm); addToast('Đã xóa'); setConfirm(null); load(); }
    catch { addToast('Lỗi', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quản lý banner</div>
          <div className="page-subtitle">{total} banner</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Thêm banner</button>
      </div>

      <div className="filters-bar" style={{ gap: 8 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tiêu đề..." style={{ width: 200 }}/>
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
              <thead><tr><th>ID</th><th>Ảnh</th><th>Tiêu đề</th><th>Thứ tự</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Không có banner</td></tr>}
                {list.map(b => (
                  <tr key={b.bannerId}>
                    <td>#{b.bannerId}</td>
                    <td>{b.imageUrl && <img src={b.imageUrl} alt="" style={{ width: 80, height: 40, objectFit: 'cover', borderRadius: 4 }}/>}</td>
                    <td style={{ fontWeight: 600 }}>{b.title || '-'}</td>
                    <td>{b.sortOrder}</td>
                    <td>
                      <label className="switch">
                        <input type="checkbox" checked={!!b.isActive} onChange={() => bannerAPI.toggle(b.bannerId).then(load)}/>
                        <span className="slider"/>
                      </label>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-info btn-sm" onClick={() => openEdit(b)}>Sửa</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm(b.bannerId)}>Xóa</button>
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
              <h3>{editId ? 'Sửa banner' : 'Thêm banner'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>X</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Tiêu đề</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})}/></div>
              <div className="form-group"><label>Link URL</label><input value={form.linkUrl} onChange={e => setForm({...form, linkUrl: e.target.value})}/></div>
              <div className="form-group"><label>URL ảnh</label><input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})}/></div>
              <div className="form-group"><label>Upload ảnh</label><input type="file" accept="image/*" onChange={e => setImgFile(e.target.files[0])}/></div>
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

      {confirm && <ConfirmModal title="Xóa banner" message="Bạn có chắc muốn xóa?" onConfirm={handleDelete} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
