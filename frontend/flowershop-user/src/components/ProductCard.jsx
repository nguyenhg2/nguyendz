import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Stars from './Stars';
import { fmt } from './fmt';
import { IMG_URL } from '../services/api';

const imageSrc = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return IMG_URL + url;
  return '';
};

export default function ProductCard({ p, horizontal }) {
  const { addToCart, navigate } = useContext(AppContext);

  const id = p.productId || p.id;
  const name = p.productName || p.name;
  const img = p.imageUrl || p.images?.[0]?.imageUrl || p.img;
  const src = imageSrc(img);
  const price = p.price || 0;
  const sale = p.sale || p.discountPrice || null;
  const currentPrice = sale || price;
  const stock = p.stockQuantity === null || p.stockQuantity === undefined ? 999 : p.stockQuantity;
  const outOfStock = stock === 0;

  if (horizontal) return (
    <div className="card" style={{ display: 'flex', gap: 0, cursor: 'pointer', opacity: outOfStock ? 0.6 : 1 }} onClick={() => navigate('product', { id })}>
      <div className="product-img" style={{ width: 100, minWidth: 100, fontSize: 36, background: 'var(--warm)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {src ? (
          <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }} />
        ) : null}
      </div>
      <div style={{ padding: '12px 16px', flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{name}</div>
        <Stars n={p.rating} size={12} />
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>({p.reviews?.length || 0})</span>
        <div style={{ marginTop: 6, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: 'var(--rose)', fontWeight: 800, fontSize: 15 }}>{fmt(currentPrice)}</span>
          {sale && sale < price && <span style={{ textDecoration: 'line-through', color: 'var(--muted)', fontSize: 12 }}>{fmt(price)}</span>}
        </div>
        {outOfStock && <div style={{ color: '#dc2626', fontSize: 12, fontWeight: 700, marginTop: 4 }}>Hết hàng</div>}
      </div>
    </div>
  );

  return (
    <div className="card" style={{ cursor: 'pointer', opacity: outOfStock ? 0.6 : 1 }}>
      <div onClick={() => navigate('product', { id })}>
        <div className="product-img" style={{ position: 'relative', overflow: 'hidden', height: 180, background: 'var(--warm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#fff' }}>
            {src ? (
              <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }} />
            ) : null}
          </div>
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {outOfStock && <span className="badge" style={{ background: '#6b7280', color: '#fff' }}>Hết hàng</span>}
            {sale && sale < price && !outOfStock && <span className="badge badge-sale">Giảm giá</span>}
            {p.isNew && !outOfStock && <span className="badge badge-new">Mới</span>}
            {(p.soldQuantity > 50 || p.badge === 'hot') && !outOfStock && <span className="badge badge-hot">Bán chạy</span>}
          </div>
        </div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, lineHeight: 1.3, height: '2.6em', overflow: 'hidden' }}>{name}</div>
          <div style={{ marginBottom: 6 }}>
            <Stars n={p.rating} size={12} />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}> ({p.reviews?.length || 0}) - Đã bán {p.soldQuantity || 0}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ color: 'var(--rose)', fontWeight: 800, fontSize: 17 }}>{fmt(currentPrice)}</span>
            {sale && sale < price && <span style={{ textDecoration: 'line-through', color: 'var(--muted)', fontSize: 13 }}>{fmt(price)}</span>}
          </div>
          {!outOfStock && stock < 999 && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Còn {stock} sản phẩm</div>}
        </div>
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        {!outOfStock ? (
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            onClick={(e) => { e.stopPropagation(); addToCart(p); }}>
            Thêm vào giỏ
          </button>
        ) : (
          <button className="btn" style={{ width: '100%', justifyContent: 'center', background: '#d1d5db', color: '#6b7280', cursor: 'not-allowed' }} disabled>
            Hết hàng
          </button>
        )}
      </div>
    </div>
  );
}
