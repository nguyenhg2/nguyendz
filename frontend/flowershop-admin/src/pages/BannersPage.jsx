import React, { useState, useEffect, useCallback } from 'react';
import { bannerAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import ConfirmModal from '../components/ConfirmModal';

const EMPTY = { Title: '', ImageUrl: '', LinkUrl: '', SortOrder: 0, IsActive: true };

export default function BannersPage() {
  const { addToast } = useAdmin();
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [editId,  setEditId]  = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [imgFile, setImgFile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { 
      const res = await bannerAPI.getAll(); setList(res.data || []); 
    }
    catch { 
      addToast('Lỗi tải banner', 'error'); 
    }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setImgFile(null); setModal(true); };
  const openEdit = (b) => { setForm({ Title: b.title || '', ImageUrl: b.imageUrl || '', LinkUrl: b.linkUrl || '', SortOrder: b.sortOrder || 0, IsActive: b.isActive }); setEditId(b.bannerId); setImgFile(null); setModal(true); };
  const close    = () => setModal(false);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      let savedId = editId;
      const payload = { Title: form.Title, LinkUrl: form.LinkUrl, SortOrder: form.SortOrder, IsActive: form.IsActive };
      if (form.ImageUrl) payload.ImageUrl = form.ImageUrl;
      
      if (editId) { await bannerAPI.update(editId, payload); }
      else { const res = await bannerAPI.create(payload); savedId = res.data?.BannerId; }
      if (imgFile && savedId) { const fd = new FormData(); fd.append('image', imgFile); await bannerAPI.uploadImage(savedId, fd); }
      addToast(editId ? 'Cập nhật banner thành công' : 'Thêm banner thành công');
      close(); load();
    } catch (e) { addToast(e?.response?.data?.message || 'Lỗi lưu banner', 'error'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (b) => {
    try { await bannerAPI.toggle(b.bannerId); addToast(`Đã ${b.isActive ? 'tắt' : 'bật'} banner`); load(); }
    catch { addToast('Lỗi cập nhật', 'error'); }
  };

  const handleDelete = async () => {
    try { await bannerAPI.remove(confirm); addToast('Đã xóa banner'); setConfirm(null); load(); }
    catch { addToast('Lỗi xóa banner', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quản lý banner</div>
          <div className="page-subtitle">{list.length} banner</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Thêm banner</button>
      </div>

      {loading ? <div className="spinner"/> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {list.length === 0 && (
            <div className="card" style={{ gridColumn: '1/-1' }}>
              <div className="empty-state"><div className="empty-icon">🖼️</div><p>Chưa có banner nào. Thêm banner để bắt đầu.</p></div>
            </div>
          )}
          {list.map(b => (
            <div key={b.bannerId} className="card">
              {/* Preview */}
              <div style={{ height: 160, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
                {b.imageUrl
                  ? <img src={b.imageUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  : <span style={{ fontSize: 48, opacity: .3 }}>🖼️</span>
                }
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{b.title || '(Không có tiêu đề)'}</div>
                    {b.linkUrl && <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>🔗 {b.linkUrl}</div>}
                  </div>
                  <label className="switch" title={b.IsActive ? 'Đang hiện' : 'Đang ẩn'}>
                    <input type="checkbox" checked={!!b.isActive} onChange={() => handleToggle(b)}/>
                    <span className="slider"/>
                  </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className={`badge ${b.isActive ? 'badge-active' : 'badge-inactive'}`}>{b.isActive ? '👁️ Đang hiện' : '🚫 Đã ẩn'}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>Thứ tự: {b.sortOrder}</span>
                  </div>
                  <div className="btn-group">
                    <button className="btn btn-info btn-sm" onClick={() => openEdit(b)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirm(b.bannerId)}>🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? '✏️ Sửa banner' : '➕ Thêm banner mới'}</h3>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>Tiêu đề (Title)</label>
                <input value={form.Title} onChange={e => setF('Title', e.target.value)} placeholder="VD: Valentine 2024"/>
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>URL liên kết (LinkUrl)</label>
                <input value={form.LinkUrl} onChange={e => setF('LinkUrl', e.target.value)} placeholder="https://..."/>
              </div>
              <div className="form-row form-row-2" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label>URL ảnh (ImageUrl)</label>
                  <input value={form.ImageUrl} onChange={e => setF('ImageUrl', e.target.value)} placeholder="https://..."/>
                </div>
                <div className="form-group">
                  <label>Upload ảnh mới</label>
                  <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files[0])}/>
                </div>
              </div>
              <div className="form-row form-row-2" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label>Thứ tự (SortOrder)</label>
                  <input type="number" value={form.SortOrder} onChange={e => setF('SortOrder', +e.target.value)}/>
                </div>
                <div className="form-group" style={{ justifyContent: 'center' }}>
                  <label>Hiển thị (IsActive)</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', height: 38 }}>
                    <input type="checkbox" checked={!!form.IsActive} onChange={e => setF('IsActive', e.target.checked)} style={{ width: 'auto' }}/>
                    {form.IsActive ? '✅ Đang hiện' : '🚫 Đang ẩn'}
                  </label>
                </div>
              </div>
              {/* Preview */}
              {(form.ImageUrl || imgFile) && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>XEM TRƯỚC</div>
                  <img src={imgFile ? URL.createObjectURL(imgFile) : form.ImageUrl} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
                    onError={e => e.target.style.display = 'none'}/>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '⏳ Đang lưu...' : (editId ? '💾 Cập nhật' : '➕ Thêm mới')}</button>
            </div>
          </div>
        </div>
      )}

      {confirm && <ConfirmModal title="Xóa banner" message="Bạn có chắc muốn xóa banner này?" onConfirm={handleDelete} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
