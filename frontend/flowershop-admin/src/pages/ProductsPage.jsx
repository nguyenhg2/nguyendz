import React, { useState, useEffect, useCallback } from 'react';
import { productAPI, categoryAPI, IMG_URL } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';

const fmtVND = n => new Intl.NumberFormat('vi-VN').format(n || 0) + 'd';
const img = (url) => {
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
    } catch { addToast('Loi tai san pham', 'error'); }
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
    if (!form.productName || !form.price || !form.categoryId) { addToast('Dien day du thong tin bat buoc', 'error'); return; }
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
      addToast(editId ? 'Cap nhat thanh cong' : 'Them thanh cong');
      setModal(false); load();
    } catch { addToast('Loi luu san pham', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await productAPI.remove(confirm); addToast('Da xoa'); setConfirm(null); load(); }
    catch { addToast('Loi xoa', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quan ly san pham</div>
          <div className="page-subtitle">{total} san pham</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Them san pham</button>
      </div>

      <div className="filters-bar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tim ten san pham..." style={{ width: 200 }}/>
        <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }} style={{ width: 160 }}>
          <option value="">Tat ca danh muc</option>
          {cats.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
        </select>
        <select value={activeFilter} onChange={e => { setActiveFilter(e.target.value); setPage(1); }} style={{ width: 130 }}>
          <option value="">Trang thai</option>
          <option value="true">Dang hien</option>
          <option value="false">Da an</option>
        </select>
        <select value={featuredFilter} onChange={e => { setFeaturedFilter(e.target.value); setPage(1); }} style={{ width: 130 }}>
          <option value="">Noi bat</option>
          <option value="true">Co</option>
          <option value="false">Khong</option>
        </select>
        <input type="number" value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(1); }} placeholder="Gia tu" style={{ width: 100 }}/>
        <input type="number" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(1); }} placeholder="Gia den" style={{ width: 100 }}/>
        <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }} style={{ width: 140 }}>
          <option value="">Sap xep</option>
          <option value="price_asc">Gia tang</option>
          <option value="price_desc">Gia giam</option>
          <option value="sold">Ban chay</option>
        </select>
        <button className="btn btn-secondary" onClick={resetFilter}>Xoa bo loc</button>
      </div>

      <div className="card">
        <div className="tbl-wrapper">
          {loading ? <div className="spinner"/> : (
            <table>
              <thead>
                <tr><th>ID</th><th>San pham</th><th>Danh muc</th><th>Gia</th><th>Gia KM</th><th>Ton kho</th><th>Da ban</th><th>Trang thai</th><th>Thao tac</th></tr>
              </thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>Khong tim thay san pham</td></tr>}
                {list.map(p => (
                  <tr key={p.productId}>
                    <td>#{p.productId}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.imageUrl && <img src={img(p.imageUrl)} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }}/>}
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
                        <button className="btn btn-info btn-sm" onClick={() => openEdit(p)}>Sua</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirm(p.productId)}>Xoa</button>
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
              <h3>{editId ? 'Sua san pham' : 'Them san pham'}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>X</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Ten san pham *</label>
                <input value={form.productName} onChange={e => setForm({...form, productName: e.target.value})}/>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group"><label>Danh muc *</label>
                  <select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}>
                    <option value="">-- Chon --</option>
                    {cats.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Ton kho</label>
                  <input type="number" value={form.stockQuantity} onChange={e => setForm({...form, stockQuantity: e.target.value})}/>
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group"><label>Gia *</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}/>
                </div>
                <div className="form-group"><label>Gia khuyen mai</label>
                  <input type="number" value={form.discountPrice} onChange={e => setForm({...form, discountPrice: e.target.value})}/>
                </div>
              </div>
              <div className="form-group"><label>Mo ta</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Upload anh (chon nhieu file, click de chon anh chinh)</label>
                <input type="file" accept="image/*" multiple onChange={e => { setImgFiles([...e.target.files]); setMainIdx(0); }}/>
                {imgFiles.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {imgFiles.map((f, i) => (
                      <div key={i} onClick={() => setMainIdx(i)} style={{ border: i === mainIdx ? '3px solid blue' : '1px solid #ccc', borderRadius: 4, cursor: 'pointer', padding: 2 }}>
                        <img src={URL.createObjectURL(f)} alt="" style={{ width: 60, height: 60, objectFit: 'cover' }}/>
                        {i === mainIdx && <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700 }}>Anh chinh</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <label><input type="checkbox" checked={!!form.isFeatured} onChange={e => setForm({...form, isFeatured: e.target.checked})}/> Noi bat</label>
                <label><input type="checkbox" checked={!!form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})}/> Hien thi</label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Huy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Dang luu...' : 'Luu'}</button>
            </div>
          </div>
        </div>
      )}

      {confirm && <ConfirmModal title="Xoa san pham" message="Ban co chac muon xoa san pham nay?" onConfirm={handleDelete} onCancel={() => setConfirm(null)}/>}
    </div>
  );
}
