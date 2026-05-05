import React, { useState, useEffect, useCallback } from 'react';
import { categoryAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import ConfirmModal from '../components/ConfirmModal';

const EMPTY = { CategoryName: '', Description: '', ImageUrl: '', SortOrder: 0, IsActive: true };

export default function CategoriesPage() {
  const { addToast } = useAdmin();
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);   
  const [form,    setForm]    = useState(EMPTY);
  const [editId,  setEditId]  = useState(null);
  const [confirm, setConfirm] = useState(null);   
  const [saving,  setSaving]  = useState(false);
  const [imgFile, setImgFile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryAPI.getAll({ includeInactive: true });
      setList(res.data || []);
    } catch { addToast('Lỗi tải danh mục', 'error'); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setImgFile(null); setModal('form'); };
  const openEdit = (cat) => { setForm({ CategoryName: cat.CategoryName, Description: cat.Description || '', ImageUrl: cat.ImageUrl || '', SortOrder: cat.SortOrder || 0, IsActive: cat.IsActive }); setEditId(cat.CategoryId); setImgFile(null); setModal('form'); };
  const close    = () => setModal(null);

  const handleSave = async () => {
    if (!form.CategoryName.trim()) { addToast('Vui lòng nhập tên danh mục', 'error'); return; }
    setSaving(true);
    try {
      let savedId = editId;
      if (editId) {
        await categoryAPI.update(editId, form);
      } else {
        const res = await categoryAPI.create(form);
        savedId = res.data?.CategoryId;
      }
      
      if (imgFile && savedId) {
        const fd = new FormData(); fd.append('image', imgFile);
        await categoryAPI.uploadImage(savedId, fd);
      }
      addToast(editId ? 'Cập nhật danh mục thành công' : 'Thêm danh mục thành công');
      close(); load();
    } catch (e) { addToast(e?.response?.data?.message || 'Lỗi lưu danh mục', 'error'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (cat) => {
    try {
      await categoryAPI.toggle(cat.CategoryId);
      addToast(`Đã ${cat.IsActive ? 'ẩn' : 'hiện'} danh mục`);
      load();
    } catch { addToast('Lỗi cập nhật', 'error'); }
  };

  const handleDelete = async () => {
    try {
      await categoryAPI.remove(confirm);
      addToast('Đã xóa danh mục');
      setConfirm(null); load();
    } catch { addToast('Lỗi xóa danh mục', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quản lý danh mục</div>
          <div className="page-subtitle">{list.length} danh mục</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Thêm danh mục</button>
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Tên danh mục</th><th>Mô tả</th>
                  <th>Thứ tự</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">🗂️</div><p>Chưa có danh mục nào</p></div></td></tr>}
                {list.map(cat => (
                  <tr key={cat.categoryId}>
                    <td style={{ color: 'var(--muted)', fontWeight: 600 }}>#{cat.categoryId}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {cat.imageUrl
                          ? <img src={cat.imageUrl} alt="" className="img-preview"/>
                          : <div className="img-preview">🌸</div>
                        }
                        <span style={{ fontWeight: 700 }}>{cat.categoryName}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cat.description || '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>{cat.sortOrder}</td>
                    <td>
                      <label className="switch" title={cat.isActive ? 'Đang hiện – click để ẩn' : 'Đang ẩn – click để hiện'}>
                        <input type="checkbox" checked={!!cat.isActive} onChange={() => handleToggle(cat)}/>
                        <span className="slider"/>
                      </label>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(cat.createdDate).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-info btn-sm" onClick={() => openEdit(cat)}>✏️ Sửa</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm(cat.categoryId)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {modal === 'form' && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? '✏️ Sửa danh mục' : '➕ Thêm danh mục mới'}</h3>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row form-row-2" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label>Tên danh mục *</label>
                  <input value={form.CategoryName} onChange={e => setForm(f => ({ ...f, CategoryName: e.target.value }))} placeholder="VD: Hoa Sinh Nhật"/>
                </div>
                <div className="form-group">
                  <label>Thứ tự hiển thị</label>
                  <input type="number" value={form.SortOrder} onChange={e => setForm(f => ({ ...f, SortOrder: +e.target.value }))} placeholder="0"/>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Mô tả</label>
                <textarea rows={3} value={form.Description} onChange={e => setForm(f => ({ ...f, Description: e.target.value }))} placeholder="Mô tả ngắn về danh mục..."/>
              </div>
              <div className="form-row form-row-2" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label>URL ảnh (ImageUrl)</label>
                  <input value={form.ImageUrl} onChange={e => setForm(f => ({ ...f, ImageUrl: e.target.value }))} placeholder="https://..."/>
                </div>
                <div className="form-group">
                  <label>Upload ảnh</label>
                  <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files[0])}/>
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', fontSize: 13 }}>
                  <input type="checkbox" checked={!!form.IsActive} onChange={e => setForm(f => ({ ...f, IsActive: e.target.checked }))} style={{ width: 'auto' }}/>
                  Hiển thị danh mục (IsActive)
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Đang lưu...' : (editId ? '💾 Cập nhật' : '➕ Thêm mới')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirm && (
        <ConfirmModal
          title="Xóa danh mục"
          message="Bạn có chắc muốn xóa danh mục này? Hành động này không thể hoàn tác."
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
