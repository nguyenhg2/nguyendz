import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { getCategories, getProducts } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function CategoryPage() {
  const { navigate, pageParams } = useContext(AppContext);
  const categoryId = pageParams?.id || '';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [priceRange, setPriceRange] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  const pageSize = 12;

  // Load danh mục
  useEffect(() => {
    getCategories().then(res => {
      setCategories(res.data.items || res.data || []);
    }).catch(() => {});
  }, []);

  // Load sản phẩm
  useEffect(() => {
    loadProducts();
  }, [categoryId, sort, page, priceRange, ratingFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize };
      if (categoryId) params.category = categoryId;
      if (priceRange) params.priceRange = priceRange;
      if (ratingFilter) params.rating = ratingFilter;

      switch (sort) {
        case 'price_asc': params.sort = 'price_asc'; break;
        case 'price_desc': params.sort = 'price_desc'; break;
        case 'sold': params.sort = 'sold'; break;
        default: params.sort = 'newest';
      }

      const res = await getProducts(params);
      const data = res.data;
      setProducts(data.items || data || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || 0);
    } catch {
      setProducts([]);
    }
    setLoading(false);
  };

  const currentCategory = categories.find(c =>
    String(c.categoryId || c.id) === String(categoryId)
  );

  const handleCategoryClick = (id) => {
    navigate('category', { id });
    setPage(1);
    setPriceRange('');
    setRatingFilter('');
  };

  const handleSort = (s) => {
    setSort(s);
    setPage(1);
  };

  const handlePriceChange = (value) => {
    setPriceRange(value);
    setPage(1);
  };

  const handleRatingChange = (value) => {
    setRatingFilter(value);
    setPage(1);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20, padding: 20, background: '#f8f9fa', borderRadius: 10 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>
          {currentCategory?.categoryName || currentCategory?.name || 'Tất cả sản phẩm'}
        </h2>
        <p style={{ margin: '8px 0 0', color: '#666', fontSize: 14 }}>{totalItems} sản phẩm</p>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Sidebar */}
        <div style={{ width: 220, flexShrink: 0 }}>

          {/* Danh mục */}
          <div style={sidebarBox}>
            <h4 style={sidebarTitle}>Danh mục</h4>
            <div
              onClick={() => handleCategoryClick('')}
              style={{ ...sidebarItem, fontWeight: !categoryId ? 700 : 400, color: !categoryId ? '#e91e63' : '#333' }}
            >
              Tất cả
            </div>
            {categories.map(c => {
              const cId = String(c.categoryId || c.id);
              const active = cId === String(categoryId);
              return (
                <div
                  key={cId}
                  onClick={() => handleCategoryClick(cId)}
                  style={{ ...sidebarItem, fontWeight: active ? 700 : 400, color: active ? '#e91e63' : '#333' }}
                >
                  {c.categoryName || c.name}
                </div>
              );
            })}
          </div>

          {/* Lọc theo giá */}
          <div style={sidebarBox}>
            <h4 style={sidebarTitle}>Khoảng giá</h4>
            {[
              { label: 'Tất cả', value: '' },
              { label: 'Dưới 100.000đ', value: '0-100000' },
              { label: '100.000đ - 300.000đ', value: '100000-300000' },
              { label: '300.000đ - 500.000đ', value: '300000-500000' },
              { label: '500.000đ - 1.000.000đ', value: '500000-1000000' },
              { label: 'Trên 1.000.000đ', value: '1000000-99999999' }
            ].map(opt => (
              <div
                key={opt.value}
                onClick={() => handlePriceChange(opt.value)}
                style={{ ...sidebarItem, fontWeight: priceRange === opt.value ? 700 : 400, color: priceRange === opt.value ? '#e91e63' : '#333' }}
              >
                {opt.label}
              </div>
            ))}
          </div>

          {/* Lọc theo đánh giá */}
          <div style={sidebarBox}>
            <h4 style={sidebarTitle}>Đánh giá</h4>
            {[
              { label: 'Tất cả', value: '' },
              { label: '★★★★★ (5 sao)', value: '5' },
              { label: '★★★★☆ (4 sao trở lên)', value: '4' },
              { label: '★★★☆☆ (3 sao trở lên)', value: '3' },
              { label: '★★☆☆☆ (2 sao trở lên)', value: '2' }
            ].map(opt => (
              <div
                key={opt.value}
                onClick={() => handleRatingChange(opt.value)}
                style={{ ...sidebarItem, fontWeight: ratingFilter === opt.value ? 700 : 400, color: ratingFilter === opt.value ? '#e91e63' : '#333' }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>

        {/* Nội dung chính */}
        <div style={{ flex: 1 }}>
          {/* Sắp xếp */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Mới nhất', value: 'newest' },
              { label: 'Giá tăng', value: 'price_asc' },
              { label: 'Giá giảm', value: 'price_desc' },
              { label: 'Bán chạy', value: 'sold' }
            ].map(s => (
              <button
                key={s.value}
                onClick={() => handleSort(s.value)}
                style={{
                  padding: '8px 16px', border: '1px solid #ddd', borderRadius: 6,
                  background: sort === s.value ? '#e91e63' : '#fff',
                  color: sort === s.value ? '#fff' : '#333',
                  cursor: 'pointer', fontWeight: 500, fontSize: 13
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Danh sách sản phẩm */}
          {loading ? (
            <p style={{ textAlign: 'center', color: '#888', padding: 40 }}>Đang tải...</p>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
              <p style={{ fontSize: 16 }}>Không tìm thấy sản phẩm nào</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {products.map(p => (
                <ProductCard key={p.productId || p.id} product={p} />
              ))}
            </div>
          )}

          {/* Phân trang */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 24 }}>
              <button
                disabled={page <= 1}
                onClick={() => { setPage(page - 1); window.scrollTo(0, 0); }}
                style={{ ...pageBtn, opacity: page <= 1 ? 0.5 : 1 }}
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => { setPage(n); window.scrollTo(0, 0); }}
                  style={{
                    ...pageBtn,
                    background: n === page ? '#e91e63' : '#fff',
                    color: n === page ? '#fff' : '#333'
                  }}
                >
                  {n}
                </button>
              ))}
              <button
                disabled={page >= totalPages}
                onClick={() => { setPage(page + 1); window.scrollTo(0, 0); }}
                style={{ ...pageBtn, opacity: page >= totalPages ? 0.5 : 1 }}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const sidebarBox = { marginBottom: 16, padding: 14, background: '#fff', border: '1px solid #eee', borderRadius: 8 };
const sidebarTitle = { margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#333' };
const sidebarItem = { padding: '7px 0', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f5f5f5', transition: 'color 0.2s' };
const pageBtn = { width: 36, height: 36, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontWeight: 600, background: '#fff' };
