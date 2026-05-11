import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { getProducts, getCategories, getBanners, IMG_URL } from '../services/api';
import ProductCard from '../components/ProductCard';

const imgSrc = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return IMG_URL + url;
};

export default function HomePage() {
  const { navigate } = useContext(AppContext);
  const [banners, setBanners] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => {
      setBannerIdx(i => (i + 1) % banners.length);
    }, 3000);
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
        setCategories(catRes.data.items || catRes.data || []);
        setProducts(prodRes.data.items || prodRes.data || []);
        setBanners(bannerRes.data.items || bannerRes.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sale = (products || []).filter(p => (p.sale || p.discountPrice) && (p.sale || p.discountPrice) < p.price).slice(0, 4);
  const hot = (products || []).filter(p => p.isFeatured || (p.soldQuantity || 0) > 50).slice(0, 4);
  const newArr = [...(products || [])].sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0)).slice(0, 4);

  if (loading) return <div style={{ padding: 100, textAlign: 'center' }}>Đang tải...</div>;

  return (
    <div className="page">
      <div style={{position: 'relative',width: '100%',height: 500,borderRadius: 20,overflow: 'hidden',margin: '0 auto 48px',maxWidth: 1200,boxShadow: '0 8px 32px rgba(0,0,0,0.12)'}}>
        {banners.map((b, i) => (
          <div key={b.id || i} style={{position: 'absolute',inset: 0,opacity: i === bannerIdx ? 1 : 0,transition: 'opacity 1s ease',pointerEvents: i === bannerIdx ? 'auto' : 'none'}}>
            {b.imageUrl ? (
              <img src={imgSrc(b.imageUrl)} alt={b.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}/>
            ) : (
              <div style={{ width: '100%', height: '100%', background: b.bg || 'linear-gradient(135deg, #c84b6b, #e8a4b8)' }}/>
            )}

            <div style={{position: 'absolute',inset: 0,background: 'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',display: 'flex',flexDirection: 'column',justifyContent: 'center',padding: '0 80px'}}>
              {b.title && (
                <div style={{fontFamily: 'Playfair Display, serif',fontSize: 44,fontWeight: 700,color: '#fff',marginBottom: 16,textShadow: '0 3px 12px rgba(0,0,0,0.4)',maxWidth: 500,lineHeight: 1.2}}>
                  {b.title}
                </div>
              )}
              {b.sub && (
                <div style={{fontSize: 17,color: '#fff',opacity: 0.92,marginBottom: 28,maxWidth: 420,lineHeight: 1.5,textShadow: '0 1px 6px rgba(0,0,0,0.3)'}}>
                  {b.sub}
                </div>
              )}
              {b.cta && (
                <button
                  className="btn"
                  style={{background: '#fff',color: '#c84b6b',padding: '14px 36px',fontSize: 15,borderRadius: 50,width: 'fit-content',fontWeight: 700,boxShadow: '0 4px 16px rgba(200,75,107,0.3)',border: 'none',cursor: 'pointer',transition: 'transform 0.2s'}}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = ''}
                  onClick={() => navigate('category', {})}>
                  {b.cta}
                </button>
              )}
            </div>
          </div>
        ))}

        {banners.length > 1 && (
          <div style={{position: 'absolute',bottom: 24,left: '50%',transform: 'translateX(-50%)',display: 'flex',gap: 10,zIndex: 2}}>
            {banners.map((_, i) => (
              <div
                key={i}
                onClick={() => setBannerIdx(i)}
                style={{width: i === bannerIdx ? 32 : 12,height: 12,borderRadius: 6,background: i === bannerIdx ? '#fff' : 'rgba(255,255,255,0.4)',cursor: 'pointer',transition: 'all .3s ease',boxShadow: '0 2px 6px rgba(0,0,0,0.2)'}}
              />
            ))}
          </div>
        )}

        {banners.length > 1 && (
          <>
            <div
              onClick={() => setBannerIdx(i => (i - 1 + banners.length) % banners.length)}
              style={{position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.8)',display: 'flex', alignItems: 'center', justifyContent: 'center',cursor: 'pointer', fontSize: 20, fontWeight: 700, color: '#333',boxShadow: '0 2px 12px rgba(0,0,0,0.15)', zIndex: 2}}>&#8249;
          </div>
            <div
              onClick={() => setBannerIdx(i => (i + 1) % banners.length)}
              style={{position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.8)',display: 'flex', alignItems: 'center', justifyContent: 'center',cursor: 'pointer', fontSize: 20, fontWeight: 700, color: '#333',boxShadow: '0 2px 12px rgba(0,0,0,0.15)', zIndex: 2}}>&#8250;
            </div>
          </>
        )}
      </div>

      <div className="container" style={{ marginBottom: 48 }}>
        <div className="section-title">Danh mục sản phẩm</div>
        <div className="section-sub">Tìm hoa phù hợp cho mọi dịp</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16 }}>
          {categories.map(c => {
            const cId = c.categoryId || c.id;
            const cName = c.categoryName || c.name;
            return (
              <div key={cId} onClick={() => navigate('category', { id: cId })}
                style={{ background: c.color || '#fff4f6', borderRadius: 16, padding: '20px 14px', textAlign: 'center', cursor: 'pointer', transition: 'transform .2s', border: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>
                {c.imageUrl ? (
                  <img src={imgSrc(c.imageUrl)} alt={cName} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}/>
                ) : (
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{c.emoji || ''}</div>
                )}
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{cName}</div>
              </div>
            );
          })}
        </div>
      </div>

      {sale.length > 0 && (
        <div className="container" style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
            <div className="section-title">Đang Giảm Giá</div>
            <button className="btn btn-ghost" onClick={() => navigate('category', { filter: 'sale' })}>Xem tất cả</button>
          </div>
          <div className="section-sub">Ưu đãi có thời hạn, đặt ngay!</div>
          <div className="grid-4">{sale.map(p => <ProductCard key={p.productId || p.id} product={p}/>)}</div>
        </div>
      )}

      {hot.length > 0 && (
        <div style={{ background: 'var(--warm)', padding: '48px 0' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
              <div className="section-title">Bán Chạy Nhất</div>
              <button className="btn btn-ghost" onClick={() => navigate('category', { sort: 'sold' })}>Xem tất cả</button>
            </div>
            <div className="section-sub">Được khách hàng yêu thích nhất</div>
            <div className="grid-4">{hot.map(p => <ProductCard key={p.productId || p.id} product={p}/>)}</div>
          </div>
        </div>
      )}

      {newArr.length > 0 && (
        <div className="container" style={{ marginTop: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
            <div className="section-title">Hoa Mới Về</div>
            <button className="btn btn-ghost" onClick={() => navigate('category', { sort: 'newest' })}>Xem tất cả</button>
          </div>
          <div className="section-sub">Những mẫu hoa mới nhất</div>
          <div className="grid-4">{newArr.map(p => <ProductCard key={p.productId || p.id} product={p}/>)}</div>
        </div>
      )}

      <div className="container" style={{ margin: '48px auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #c84b6b, #4a7c59)', borderRadius: 24, padding: '40px', color: '#fff', display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28, marginBottom: 8 }}>Miễn phí giao hàng nội thành</div>
            <div style={{ opacity: .9 }}>Đơn từ 500.000đ - Giao trong 2-4 giờ - Hoa tươi đảm bảo</div>
          </div>
          <button className="btn" style={{ background: '#fff', color: 'var(--rose)', padding: '12px 28px', fontSize: 15 }} onClick={() => navigate('category', {})}>Đặt hoa ngay</button>
        </div>
      </div>
    </div>
  );
}
