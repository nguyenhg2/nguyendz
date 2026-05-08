import React, { useState, useEffect, useCallback } from 'react';
import { bannerAPI, IMG_URL } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const imgSrc = (url) => { if (!url) return ''; if (url.startsWith('http')) return url; return IMG_URL + url; };
const LIMIT = 10;

export default function BannersPage() {
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
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (activeFilter !== '') params.isActive = activeFilter === 'true';
      const res = await bannerAPI.getAll(params);
      const data = res.data;
      setList(data.items || data || []);
      setTotal(data.total || (data.length ? data.length : 0));
    } catch { addToast('Lỗi tải banner', 'error'); }
    finally { setLoading(false); }
  }, [page, search, activeFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm({ title: '', sortOrder: 0, isActive: true });
    setEditId(null); setImgFile(null); setModal(true);
  };

  const openEdit = (b) => {
    setForm({ title: b.title || '', sortOrder: b.sortOrder || 0, isActive: !!b.isActive, currentImage: b.imageUrl || '' });
    setEditId(b.bannerId); setImgFile(null); setModal(true);
  };

  const handleSave = async () => {
    if (!form.title) { addToast('Vui lòng nhập tiêu đề', 'error'); return; }
    setSaving(true);
    try {
      let id = editId;
      const payload = { title: form.title, sortOrder: form.sortOrder, isActive: form.isActive };
      if (editId) { await bannerAPI.update(editId, payload); }
      else { const res = await bannerAPI.create(payload); id = res.data.bannerId; }
      if (imgFile && id) {
        const fd = new FormData();
        fd.append('file', imgFile);
        await bannerAPI.uploadImage(id, fd);
      }
      addToast(editId ? 'Cập nhật thành công' : 'Thêm thành công');
      setModal(false); load();
    } catch { addToast('Lỗi lưu banner', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await bannerAPI.remove(confirm); addToast('Đã xóa banner'); setConfirm(null); load(); }
    catch { addToast('Lỗi xóa', 'error'); }
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
          <option value="">Tất cả trạng thái</option>
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
                    <td>{b.imageUrl && <img src={imgSrc(b.imageUrl)} alt="" style={{ width: 80, height: 40, objectFit: 'cover', borderRadius: 4 }}/>}</td>
                    <td style={{ fontWeight: 600 }}>{b.title}</td>
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
            <div className="modal-header"><h3>{editId ? 'Sửa banner' : 'Thêm banner'}</h3><button className="modal-close" onClick={() => setModal(false)}>X</button></div>
            <div className="modal-body">
              <div className="form-group"><label>Tiêu đề *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})}/></div>
              <div className="form-group"><label>Thứ tự</label><input type="number" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: parseInt(e.target.value) || 0})}/></div>
              <div className="form-group">
                <label>Ảnh banner</label>
                <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files[0])}/>
                {imgFile && <img src={URL.createObjectURL(imgFile)} alt="" style={{ width: 120, marginTop: 8, borderRadius: 4 }}/>}
                {!imgFile && form.currentImage && <img src={imgSrc(form.currentImage)} alt="" style={{ width: 120, marginTop: 8, borderRadius: 4 }}/>}
              </div>
              <label><input type="checkbox" checked={!!form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})}/> Hiển thị</label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
            </div>
          </div>
        </div>
      )}

      {confirm && <ConfirmModal title="Xóa banner" message="Bạn có chắc chắn muốn xóa banner này?" onConfirm={handleDelete} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
