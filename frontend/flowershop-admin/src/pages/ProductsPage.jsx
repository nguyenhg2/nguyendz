import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { productAPI, categoryAPI, IMG_URL } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const fmtVND = n => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';
const imgSrc = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return IMG_URL + url;
};

export default function ProductsPage() {
  const { addToast } = useAdmin();
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imgFiles, setImgFiles] = useState([]);
  const [mainIdx, setMainIdx] = useState(0);
  const [existingImages, setExistingImages] = useState([]);
  const LIMIT = 10;
  const filePreviews = useMemo(
    () => imgFiles.map(file => ({ file, url: URL.createObjectURL(file) })),
    [imgFiles]
  );
  const categoryMap = useMemo(
    () => new Map(cats.map(c => [String(c.categoryId), c])),
    [cats]
  );
  const getProductCategory = (product) => {
    const categoryId = product.categoryId || product.category?.categoryId || product.category?.id;
    const category = categoryMap.get(String(categoryId));
    if (!product.category) return category || null;
    return { ...category, ...product.category, isActive: product.category.isActive ?? category?.isActive };
  };
  const isProductLockedByCategory = (product) => getProductCategory(product)?.isActive === false;
  const isCategoryLocked = form.categoryId ? categoryMap.get(String(form.categoryId))?.isActive === false : false;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, includeInactive: true };
      if (search) params.search = search;
      if (catFilter) params.categoryId = catFilter;
      if (activeFilter !== '') params.isActive = activeFilter === 'true';
      if (featuredFilter !== '') params.isFeatured = featuredFilter === 'true';
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (sortBy) params.sortBy = sortBy;
      const res = await productAPI.getAll(params);
      setList(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch { addToast('Lỗi tải sản phẩm', 'error'); }
    finally { setLoading(false); }
  }, [page, search, catFilter, activeFilter, featuredFilter, minPrice, maxPrice, sortBy]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { categoryAPI.getAll({ limit: 100, includeInactive: true }).then(r => setCats(r.data.items || r.data || [])); }, []);
  useEffect(() => () => filePreviews.forEach(p => URL.revokeObjectURL(p.url)), [filePreviews]);

  const resetFilter = () => { setSearch(''); setCatFilter(''); setActiveFilter(''); setFeaturedFilter(''); setMinPrice(''); setMaxPrice(''); setSortBy(''); setPage(1); };

  const openAdd = () => {
    setForm({ productName: '', description: '', price: '', discountPrice: '', categoryId: '', stockQuantity: 0, isFeatured: false, isActive: true });
    setEditId(null); setImgFiles([]); setExistingImages([]); setMainIdx(0); setModal(true);
  };

  const openEdit = async (p) => {
    setForm({ productName: p.productName, description: p.description || '', price: p.price, discountPrice: p.discountPrice || '', categoryId: p.categoryId || '', stockQuantity: p.stockQuantity || 0, isFeatured: !!p.isFeatured, isActive: !!p.isActive });
    setEditId(p.productId); setImgFiles([]); setMainIdx(0); setModal(true);
    try {
      const res = await productAPI.getById(p.productId);
      setExistingImages(res.data.images || []);
    } catch {
      setExistingImages(p.images || []);
    }
  };

  const setMainExistingImage = async (imageId) => {
    if (!editId) return;
    try {
      const res = await productAPI.setMainImage(editId, imageId);
      setExistingImages(res.data || []);
      addToast('Đã chọn ảnh chính');
      load();
    } catch {
      addToast('Lỗi chọn ảnh chính', 'error');
    }
  };

  const deleteExistingImage = async (imageId) => {
    if (!editId) return;
    try {
      await productAPI.deleteImage(editId, imageId);
      setExistingImages(images => images.filter(img => img.id !== imageId));
      addToast('Đã xoá ảnh');
      load();
    } catch {
      addToast('Lỗi xoá ảnh', 'error');
    }
  };

  const handleSave = async () => {
    if (!form.productName || !form.price || !form.categoryId) { addToast('Điền đầy đủ tên, giá và danh mục', 'error'); return; }
    setSaving(true);
    try {
      const payload = { ...form, isActive: isCategoryLocked ? false : !!form.isActive, price: parseFloat(form.price), discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null, stockQuantity: parseInt(form.stockQuantity) || 0 };
      let id = editId;
      if (editId) { await productAPI.update(editId, payload); }
      else { const res = await productAPI.create(payload); id = res.data.productId; }
      if (imgFiles.length > 0 && id) {
        const fd = new FormData();
        imgFiles.forEach(f => fd.append('files', f));
        fd.append('mainIndex', mainIdx);
        await productAPI.uploadImages(id, fd);
      }
      addToast(editId ? 'Cập nhật thành công' : 'Thêm thành công');
      setModal(false); load();
    } catch { addToast('Lỗi lưu sản phẩm', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await productAPI.remove(confirm); addToast('Đã xóa sản phẩm'); setConfirm(null); load(); }
    catch { addToast('Lỗi xóa', 'error'); }
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

      <div className="filters-bar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên sản phẩm..." style={{ width: 200 }}/>
        <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }} style={{ width: 160 }}>
          <option value="">Tất cả danh mục</option>
          {cats.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}{c.isActive === false ? ' (Đã ẩn)' : ''}</option>)}
        </select>
        <select value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(1); }} style={{ width: 130 }}>
          <option value="">Trạng thái</option>
          <option value="true">Đang hiện</option>
          <option value="false">Đã ẩn</option>
        </select>
        <select value={featuredFilter} onChange={e => { setFeaturedFilter(e.target.value); setPage(1); }} style={{ width: 130 }}>
          <option value="">Nổi bật</option>
          <option value="true">Có</option>
          <option value="false">Không</option>
        </select>
        <input type="number" value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(1); }} placeholder="Giá từ" style={{ width: 100 }}/>
        <input type="number" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(1); }} placeholder="Giá đến" style={{ width: 100 }}/>
        <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }} style={{ width: 140 }}>
          <option value="">Sắp xếp</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
          <option value="sold">Bán chạy nhất</option>
        </select>
        <button className="btn btn-secondary" onClick={resetFilter}>Xóa bộ lọc</button>
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead>
                <tr><th>ID</th><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Giá KM</th><th>Tồn kho</th><th>Đã bán</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>Không tìm thấy sản phẩm</td></tr>}
                {list.map(p => (
                  <tr key={p.productId}>
                    <td>#{p.productId}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.imageUrl && <img src={imgSrc(p.imageUrl)} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }}/>}
                        <span style={{ fontWeight: 600 }}>{p.productName}</span>
                      </div>
                    </td>
                    <td>
                      <div>{getProductCategory(p)?.categoryName || '-'}</div>
                      {isProductLockedByCategory(p) && <div className="text-muted" style={{ fontSize: 11 }}>Danh mục đã ẩn</div>}
                    </td>
                    <td>{fmtVND(p.price)}</td>
                    <td>{p.discountPrice ? fmtVND(p.discountPrice) : '-'}</td>
                    <td>{p.stockQuantity}</td>
                    <td>{p.soldQuantity}</td>
                    <td>
                      <label className={`switch${isProductLockedByCategory(p) ? ' switch-disabled' : ''}`} title={isProductLockedByCategory(p) ? 'Danh mục đã ẩn nên không thể đổi trạng thái sản phẩm' : ''}>
                        <input type="checkbox" checked={!isProductLockedByCategory(p) && !!p.isActive} disabled={isProductLockedByCategory(p)} onChange={() => productAPI.toggle(p.productId).then(load)}/>
                        <span className="slider"/>
                      </label>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-info btn-sm" onClick={() => openEdit(p)}>Sửa</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm(p.productId)}>Xóa</button>
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
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>X</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Tên sản phẩm *</label>
                <input value={form.productName} onChange={e => setForm({...form, productName: e.target.value})}/>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group"><label>Danh mục *</label>
                  <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}>
                    <option value="">-- Chọn danh mục --</option>
                    {cats.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}{c.isActive === false ? ' (Đã ẩn)' : ''}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Tồn kho</label>
                  <input type="number" value={form.stockQuantity} onChange={e => setForm({...form, stockQuantity: e.target.value})}/>
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group"><label>Giá bán *</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}/>
                </div>
                <div className="form-group"><label>Giá khuyến mãi</label>
                  <input type="number" value={form.discountPrice} onChange={e => setForm({...form, discountPrice: e.target.value})}/>
                </div>
              </div>
              <div className="form-group"><label>Mô tả</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Tải ảnh lên (chọn nhiều file, nhấn vào ảnh để chọn làm ảnh chính)</label>
                <input type="file" accept="image/*" multiple onChange={e => { setImgFiles([...e.target.files]); setMainIdx(0); }}/>
                {existingImages.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>Ảnh hiện có</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {existingImages.map(img => (
                        <div key={img.id} style={{ width: 86 }}>
                          <button type="button" onClick={() => setMainExistingImage(img.id)}
                            style={{ width: 86, height: 86, border: img.isMain ? '3px solid #be3455' : '1px solid #d1d5db', borderRadius: 8, background: '#fff', padding: 2, cursor: 'pointer', overflow: 'hidden' }}>
                            <img src={imgSrc(img.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}/>
                          </button>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 4 }}>
                            <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: img.isMain ? '#be3455' : '#6b7280' }}>{img.isMain ? 'Ảnh chính' : 'Chọn chính'}</span>
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteExistingImage(img.id)} style={{ padding: '2px 6px', fontSize: 10 }}>Xoá</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {imgFiles.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {filePreviews.map((preview, i) => (
                      <div key={preview.url} onClick={() => setMainIdx(i)} style={{ border: i === mainIdx ? '3px solid #2563eb' : '1px solid #ccc', borderRadius: 4, cursor: 'pointer', padding: 2 }}>
                        <img src={preview.url} alt="" style={{ width: 60, height: 60, objectFit: 'contain' }}/>
                        {i === mainIdx && <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#2563eb' }}>Ảnh chính</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <label><input type="checkbox" checked={!!form.isFeatured} onChange={e => setForm({...form, isFeatured: e.target.checked})}/> Nổi bật</label>
                <label title={isCategoryLocked ? 'Danh mục đã ẩn nên sản phẩm không thể kích hoạt' : ''}>
                  <input type="checkbox" checked={!isCategoryLocked && !!form.isActive} disabled={isCategoryLocked} onChange={e => setForm({...form, isActive: e.target.checked})}/> Hiển thị
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
            </div>
          </div>
        </div>
      )}

      {confirm && <ConfirmModal title="Xóa sản phẩm" message="Bạn có chắc chắn muốn xóa sản phẩm này?" onConfirm={handleDelete} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
