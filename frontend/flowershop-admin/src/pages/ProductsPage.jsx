import React, { useState, useEffect, useCallback } from 'react';
import { productAPI, categoryAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const fmtVND = n => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';

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
  const LIMIT = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
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
  useEffect(() => { categoryAPI.getAll({ limit: 100 }).then(r => setCats(r.data.items || r.data || [])); }, []);

  const resetFilter = () => { setSearch(''); setCatFilter(''); setActiveFilter(''); setFeaturedFilter(''); setMinPrice(''); setMaxPrice(''); setSortBy(''); setPage(1); };

  const openAdd = () => {
    setForm({ productName: '', description: '', price: '', discountPrice: '', imageUrl: '', categoryId: '', stockQuantity: 0, isFeatured: false, isActive: true });
    setEditId(null); setImgFiles([]); setMainIdx(0); setModal(true);
  };

  const openEdit = (p) => {
    setForm({ productName: p.productName, description: p.description || '', price: p.price, discountPrice: p.discountPrice || '', imageUrl: p.imageUrl || '', categoryId: p.categoryId || '', stockQuantity: p.stockQuantity || 0, isFeatured: !!p.isFeatured, isActive: !!p.isActive });
    setEditId(p.productId); setImgFiles([]); setMainIdx(0); setModal(true);
  };

  const handleSave = async () => {
    if (!form.productName || !form.price || !form.categoryId) { addToast('Điền đầy đủ thông tin bắt buộc', 'error'); return; }
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null, stockQuantity: parseInt(form.stockQuantity) || 0 };
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
    try { await productAPI.remove(confirm); addToast('Đã xóa'); setConfirm(null); load(); }
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
          {cats.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
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
          <option value="price_asc">Giá tăng</option>
          <option value="price_desc">Giá giảm</option>
          <option value="sold">Bán chạy</option>
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
                        {p.imageUrl && <img src={p.imageUrl} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }}/>}
                        <span style={{ fontWeight: 600 }}>{p.productName}</span>
                      </div>
                    </td>
                    <td>{p.category?.categoryName || '-'}</td>
                    <td>{fmtVND(p.price)}</td>
                    <td>{p.discountPrice ? fmtVND(p.discountPrice) : '-'}</td>
                    <td>{p.stockQuantity}</td>
                    <td>{p.soldQuantity}</td>
                    <td>
                      <label className="switch">
                        <input type="checkbox" checked={!!p.isActive} onChange={() => productAPI.toggle(p.productId).then(load)}/>
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
                    <option value="">-- Chọn --</option>
                    {cats.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Tồn kho</label>
                  <input type="number" value={form.stockQuantity} onChange={e => setForm({...form, stockQuantity: e.target.value})}/>
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group"><label>Giá *</label>
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
                <label>Upload ảnh (chọn nhiều file, click để chọn ảnh chính)</label>
                <input type="file" accept="image/*" multiple onChange={e => { setImgFiles([...e.target.files]); setMainIdx(0); }}/>
                {imgFiles.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {imgFiles.map((f, i) => (
                      <div key={i} onClick={() => setMainIdx(i)} style={{ border: i === mainIdx ? '3px solid blue' : '1px solid #ccc', borderRadius: 4, cursor: 'pointer', padding: 2 }}>
                        <img src={URL.createObjectURL(f)} alt="" style={{ width: 60, height: 60, objectFit: 'cover' }}/>
                        {i === mainIdx && <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700 }}>Ảnh chính</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <label><input type="checkbox" checked={!!form.isFeatured} onChange={e => setForm({...form, isFeatured: e.target.checked})}/> Nổi bật</label>
                <label><input type="checkbox" checked={!!form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})}/> Hiển thị</label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
            </div>
          </div>
        </div>
      )}

      {confirm && <ConfirmModal title="Xóa sản phẩm" message="Bạn có chắc muốn xóa sản phẩm này?" onConfirm={handleDelete} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
