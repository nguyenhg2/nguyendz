import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { getProducts, getCategories, getBanners } from '../services/api'; // 1. Import thêm getBanners
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const { navigate } = useContext(AppContext);
  
  const [banners, setBanners] = useState([]); 
  const [bannerIdx, setBannerIdx] = useState(0);
  const [bannerBg, setBannerBg] = useState('#fff'); 
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (banners.length === 0) return;

    const t = setInterval(() => {
      setBannerIdx(i => {
        const n = (i + 1) % banners.length;
        setBannerBg(banners[n].bg || '#c84b6b'); 
        return n;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [banners]); 

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes, bannerRes] = await Promise.all([
          getCategories(),
          getProducts(),
          getBanners()
        ]);

        const categoryData = catRes.data.items || catRes.data || [];
        const productData = prodRes.data.items || prodRes.data || [];
        const bannerData = bannerRes.data.items || bannerRes.data || [];

        setCategories(categoryData);
        setProducts(productData);
        setBanners(bannerData);
        
        if (bannerData.length > 0) {
          setBannerBg(bannerData[0].bg || '#c84b6b');
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu trang chủ:", error);
        setCategories([]);
        setProducts([]);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  console.log("Products:", products);

  const sale = (products || [])
    .filter(p => p.sale !== null && p.sale < p.price)
    .slice(0, 4);

  const hot = (products || [])
      .filter(p => p.isFeatured || p.soldQuantity > 100)
      .slice(0, 4);

  const newArr = [...(products || [])]
      .sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0))
      .slice(0, 4);

  if (loading) return <div style={{ padding: 100, textAlign: 'center' }}>Đang tải hoa tươi...</div>;
  const currentBanner = banners[bannerIdx] || {};

  return (
    <div className="page">
      {/* Banner Section */}
      <div style={{ background: bannerBg, transition: 'background 1s', padding: '64px 0', textAlign: 'center', color: '#fff', marginBottom: 48 }}>
        <div className="container">
          <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 42, fontWeight: 600, marginBottom: 12 }}>
            {currentBanner.title}
          </div>
          <div style={{ fontSize: 18, marginBottom: 28, opacity: .9 }}>
            {currentBanner.sub}
          </div>
          <button 
            className="btn" 
            style={{ background: '#fff', color: 'var(--rose)', padding: '12px 32px', fontSize: 16, borderRadius: 40 }} 
            onClick={() => navigate('category', {})}
          >
            {currentBanner.cta}
          </button>
          
          {/* Các nút chấm tròn chuyển banner */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            {banners.map((_, i) => (
              <div 
                key={i} 
                onClick={() => { setBannerIdx(i); setBannerBg(banners[i].bg) }} 
                style={{ 
                  width: i === bannerIdx ? 28 : 10, 
                  height: 10, 
                  borderRadius: 5, 
                  background: 'rgba(255, 255, 255, ' + (i === bannerIdx ? 1 : .5) + ')', 
                  cursor: 'pointer', 
                  transition: 'all .3s' 
                }} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Categories Section - Lấy từ DB */}
      <div className="container" style={{ marginBottom: 48 }}>
        <div className="section-title">Danh mục sản phẩm</div>
        <div className="section-sub">Tìm hoa phù hợp cho mọi dịp</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16 }}>
          {categories.map(c => (
            <div key={c.id} onClick={() => navigate('category', { cat: c.id })} style={{ background: c.color || '#fff4f6', borderRadius: 16, padding: '20px 14px', textAlign: 'center', cursor: 'pointer', transition: 'transform .2s', border: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = ''}>
              <img src={c.imageUrl || '🌸'} alt={c.name} style={{ width: 60, height: 60, objectFit: 'cover', marginBottom: 8 }} />
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{c.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sale Section - Lấy từ DB */}
      <div className="container" style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
          <div className="section-title">🔥 Đang Giảm Giá</div>
          <button className="btn btn-ghost" onClick={() => navigate('category', { filter: 'sale' })}>Xem tất cả →</button>
        </div>
        <div className="section-sub">Ưu đãi có thời hạn, đặt ngay kẻo hết!</div>
        <div className="grid-4">{sale.map(p => <ProductCard key={p.productId || p.id} p={p} />)}</div>
      </div>

      {/* Hot Section - Lấy từ DB */}
      <div style={{ background: 'var(--warm)', padding: '48px 0', marginBottom: 0 }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
            <div className="section-title">⭐ Bán Chạy Nhất</div>
            <button className="btn btn-ghost" onClick={() => navigate('category', { sort: 'sold' })}>Xem tất cả →</button>
          </div>
          <div className="section-sub">Được khách hàng yêu thích nhất</div>
          <div className="grid-4">{hot.map(p => <ProductCard key={p.productId || p.id} p={p} />)}</div>
        </div>
      </div>

      {/* New Section - Lấy từ DB */}
      <div className="container" style={{ marginTop: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
          <div className="section-title">✨ Hoa Mới Về</div>
          <button className="btn btn-ghost" onClick={() => navigate('category', { sort: 'newest' })}>Xem tất cả →</button>
        </div>
        <div className="section-sub">Những mẫu hoa mới nhất vừa cập bến</div>
        <div className="grid-4">{newArr.map(p => <ProductCard key={p.productId || p.id} p={p} />)}</div>
      </div>

      {/* Banner CTA Section */}
      <div className="container" style={{ margin: '48px auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #c84b6b, #4a7c59)', borderRadius: 24, padding: '40px 40px', color: '#fff', display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28, marginBottom: 8 }}>🚚 Miễn phí giao hàng nội thành</div>
            <div style={{ opacity: .9 }}>Đơn từ 500.000đ · Giao trong 2-4 giờ · Hoa tươi đảm bảo</div>
          </div>
          <button className="btn" style={{ background: '#fff', color: 'var(--rose)', padding: '12px 28px', fontSize: 15 }} onClick={() => navigate('category', {})}>Đặt hoa ngay</button>
        </div>
      </div>
    </div>
  );
}