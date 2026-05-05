import { useContext, useState, useEffect } from 'react'; 
import { AppContext } from '../context/AppContext';
import { getProducts } from '../services/api'; 
import ProductCard from '../components/ProductCard';

export function SearchPage() {
  const { pageParams, navigate } = useContext(AppContext);
  const q = pageParams.q || '';
  const [sort, setSort] = useState('newest');
  const [priceRange, setPriceRange] = useState('');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const params = { q, sort };
        if (priceRange) params.priceRange = priceRange;
        
        const response = await getProducts(params);
        
        const items = response.data.items || response.data || [];
        const total = response.data.totalItems || items.length;

        setProducts(items);
        setTotalItems(total);
      } catch (error) {
        console.error("Lỗi khi tìm kiếm sản phẩm:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [q, sort, priceRange]);

  return (
    <div className="page">
      <div style={{ background: 'var(--warm)', padding: '28px 0', marginBottom: 28 }}>
        <div className="container">
          <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 24, marginBottom: 4 }}>
            🔍 Kết quả tìm kiếm: "{q}"
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>
            {loading ? 'Đang tìm kiếm...' : `Tìm thấy ${totalItems} sản phẩm`}
          </div>
        </div>
      </div>

      <div className="container">
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Giá:</span>
            <select 
              value={priceRange} 
              onChange={e => setPriceRange(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)', fontSize: 13, background: '#fff', cursor: 'pointer' }}
            >
              <option value="">Tất cả</option>
              <option value="0-100000">Dưới 100k</option>
              <option value="100000-300000">100k - 300k</option>
              <option value="300000-500000">300k - 500k</option>
              <option value="500000-1000000">500k - 1tr</option>
              <option value="1000000-">Trên 1tr</option>
            </select>
          </div>
          
          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />
          
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              ['newest', 'Mới nhất'],
              ['price_asc', 'Giá ↑'],
              ['price_desc', 'Giá ↓']
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setSort(v)}
                className="tag"
                style={{
                  background: sort === v ? 'var(--rose)' : 'var(--warm)',
                  color: sort === v ? '#fff' : 'var(--muted)',
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>Đang tải dữ liệu...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Không tìm thấy kết quả</div>
            <div style={{ color: 'var(--muted)', marginBottom: 20 }}>Thử tìm kiếm với từ khóa khác</div>
            <button className="btn btn-primary" onClick={() => navigate('home')}>Về trang chủ</button>
          </div>
        ) : (
          <div className="grid-4">
            {/* Sử dụng key duy nhất từ database */}
            {products.map(p => (
              <ProductCard key={p.productId || p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}