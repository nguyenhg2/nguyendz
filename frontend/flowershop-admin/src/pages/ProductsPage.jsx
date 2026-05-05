import React, { useState, useEffect, useCallback } from 'react';
import { productAPI, categoryAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const fmt    = n => new Intl.NumberFormat('vi-VN').format(n || 0);
const fmtVND = n => fmt(n) + 'đ';
const EMPTY_FORM = { ProductName: '', Description: '', Price: '', DiscountPrice: '', ImageUrl: '', CategoryId: '', StockQuantity: 0, IsFeatured: false, IsActive: true };

export default function ProductsPage() {
  const { addToast } = useAdmin();
  const [list,     setList]     = useState([]);
  const [cats,     setCats]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter]= useState('');
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [editId,   setEditId]   = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [imgFile,  setImgFile]  = useState(null);
  const LIMIT = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll({ page, limit: LIMIT, search: search || undefined, categoryId: catFilter || undefined });
      setList(res.data?.items || res.data || []);
      setTotal(res.data?.total || (res.data?.length ?? 0));
    } catch { addToast('Lỗi tải sản phẩm', 'error'); }
    finally { setLoading(false); }
  }, [page, search, catFilter, addToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    categoryAPI.getAll().then(r => setCats(r.data || [])).catch(() => {});
  }, []);

  const openAdd  = () => { setForm(EMPTY_FORM); setEditId(null); setImgFile(null); setModal(true); };
  const openEdit = (p) => {
    setForm({ ProductName: p.productName, Description: p.description || '', Price: p.price, DiscountPrice: p.discountPrice || '', ImageUrl: p.imageUrl || '', CategoryId: p.categoryId || '', StockQuantity: p.stockQuantity || 0, IsFeatured: !!p.isFeatured, IsActive: !!p.isActive });
    setEditId(p.productId); setImgFile(null); setModal(true);
  };
  const close = () => setModal(false);
  const setF  = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.ProductName.trim() || !form.Price || !form.CategoryId) { addToast('Vui lòng điền đủ thông tin bắt buộc', 'error'); return; }
    setSaving(true);
    try {
      let savedId = editId;
      const payload = { ...form, Price: parseFloat(form.Price), DiscountPrice: form.DiscountPrice ? parseFloat(form.DiscountPrice) : null };
      if (editId) {
        await productAPI.update(editId, payload);
      } else {
        const res = await productAPI.create(payload);
        savedId = res.data?.ProductId;
      }
      if (imgFile && savedId) {
        const fd = new FormData(); fd.append('image', imgFile);
        await productAPI.uploadImage(savedId, fd);
      }
      addToast(editId ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm thành công');
      close(); load();
    } catch (e) { addToast(e?.response?.data?.message || 'Lỗi lưu sản phẩm', 'error'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (p) => {
    try { await productAPI.toggle(p.ProductId); addToast(`Đã ${p.IsActive ? 'ẩn' : 'hiện'} sản phẩm`); load(); }
    catch { addToast('Lỗi cập nhật', 'error'); }
  };

  const handleDelete = async () => {
    try { await productAPI.remove(confirm); addToast('Đã xóa sản phẩm'); setConfirm(null); load(); }
    catch { addToast('Lỗi xóa sản phẩm', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quản lý sản phẩm</div>
          <div className="page-subtitle">{total} sản phẩm</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Thêm sản phẩm</button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box" style={{ flex: 1, maxWidth: 340 }}>
          <span className="search-icon">🔍</span>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên sản phẩm..."/>
        </div>
        <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }} style={{ width: 200 }}>
          <option value="">Tất cả danh mục</option>
          {cats.map(c => <option key={c.CategoryId} value={c.CategoryId}>{c.CategoryName}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead>
                <tr><th>ID</th><th>Sản phẩm</th><th>Danh mục</th><th>Giá gốc</th><th>Giá KM</th><th>Tồn kho</th><th>Đã bán</th><th>Nổi bật</th><th>Hiển thị</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={10}><div className="empty-state"><div className="empty-icon">🌸</div><p>Không tìm thấy sản phẩm</p></div></td></tr>}
                {list.map(p => (
                  <tr key={p.productId}>
                    <td style={{ color: 'var(--muted)', fontWeight: 600 }}>#{p.productId}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.imageUrl ? <img src={p.imageUrl} alt="" className="img-preview"/> : <div className="img-preview">🌸</div>}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{p.productName}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>ID: {p.productId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{cats.find(c => c.categoryId === p.categoryId)?.categoryName || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{fmtVND(p.price)}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{p.discountPrice ? fmtVND(p.discountPrice) : '—'}</td>
                    <td style={{ textAlign: 'center' }}>{fmt(p.stockQuantity)}</td>
                    <td style={{ textAlign: 'center' }}>{fmt(p.soldQuantity)}</td>
                    <td style={{ textAlign: 'center' }}>{p.isFeatured ? '⭐' : '—'}</td>
                    <td>
                      <label className="switch">
                        <input type="checkbox" checked={!!p.isActive} onChange={() => handleToggle(p)}/>
                        <span className="slider"/>
                      </label>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-info btn-sm" onClick={() => openEdit(p)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm(p.productId)}>🗑️</button>
                      </div>
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

      {/* Product Form Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? '✏️ Sửa sản phẩm' : '➕ Thêm sản phẩm mới'}</h3>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row form-row-2" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label>Tên sản phẩm *</label>
                  <input value={form.productName} onChange={e => setF('productName', e.target.value)} placeholder="VD: Bó hoa hồng đỏ 20 bông"/>
                </div>
                <div className="form-group">
                  <label>Danh mục *</label>
                  <select value={form.categoryId} onChange={e => setF('categoryId', e.target.value)}>
                    <option value="">-- Chọn danh mục --</option>
                    {cats.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row form-row-3" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label>Giá gốc (Price) *</label>
                  <input type="number" value={form.price} onChange={e => setF('price', e.target.value)} placeholder="450000"/>
                </div>
                <div className="form-group">
                  <label>Giá khuyến mãi (DiscountPrice)</label>
                  <input type="number" value={form.discountPrice} onChange={e => setF('discountPrice', e.target.value)} placeholder="Để trống nếu không KM"/>
                </div>
                <div className="form-group">
                  <label>Tồn kho (StockQuantity)</label>
                  <input type="number" value={form.stockQuantity} onChange={e => setF('stockQuantity', +e.target.value)} placeholder="0"/>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label>Mô tả (Description)</label>
                <textarea rows={4} value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Mô tả chi tiết sản phẩm..."/>
              </div>
              <div className="form-row form-row-2" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label>URL ảnh (ImageUrl)</label>
                  <input value={form.imageUrl} onChange={e => setF('imageUrl', e.target.value)} placeholder="https://..."/>
                </div>
                <div className="form-group">
                  <label>Upload ảnh mới</label>
                  <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files[0])}/>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={!!form.IsFeatured} onChange={e => setF('IsFeatured', e.target.checked)} style={{ width: 'auto' }}/>
                  ⭐ Sản phẩm nổi bật (IsFeatured)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={!!form.IsActive} onChange={e => setF('IsActive', e.target.checked)} style={{ width: 'auto' }}/>
                  👁️ Hiển thị (IsActive)
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

      {confirm && <ConfirmModal title="Xóa sản phẩm" message="Bạn có chắc muốn xóa sản phẩm này?" onConfirm={handleDelete} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
