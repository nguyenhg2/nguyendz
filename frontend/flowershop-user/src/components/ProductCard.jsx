import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { IMG_URL } from '../services/api';
import Stars from './Stars';

export default function ProductCard({ product, horizontal }) {
  const { navigate, addToCart } = useContext(AppContext);

  const p = product || {};
  const id = p.productId || p.id;
  const name = p.productName || p.name || '';
  const price = p.price || 0;
  const sale = p.sale || p.discountPrice || null;
  const stock = (p.stockQuantity === null || p.stockQuantity === undefined) ? 999 : p.stockQuantity;
  const outOfStock = stock === 0;
  const rating = p.rating || 0;
  const reviewCount = p.reviews?.length || p.reviewCount || 0;
  const sold = p.soldQuantity || 0;

  const imageSrc = (url) => {
    if (!url) return '/placeholder.jpg';
    if (url.startsWith('http')) return url;
    return IMG_URL + url;
  };

  const imageUrl = imageSrc(p.imageUrl || p.image);
  const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';

  const isNew = p.isNew;
  const isFeatured = p.isFeatured;
  const hasSale = sale && sale < price;

  const handleClick = () => navigate('product', { id });
  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(p);
  };

  // Layout ngang
  if (horizontal) {
    return (
      <div onClick={handleClick} style={styles.hCard}>
        <img src={imageUrl} alt={name} style={styles.hImg} />
        <div style={{ flex: 1 }}>
          <p style={styles.hName}>{name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Stars n={rating} size={12} />
            <span style={{ fontSize: 11, color: '#888' }}>({reviewCount})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={styles.price}>{fmt(hasSale ? sale : price)}</span>
            {hasSale && <span style={styles.oldPrice}>{fmt(price)}</span>}
          </div>
        </div>
      </div>
    );
  }

  // Layout dọc (mặc định)
  return (
    <div onClick={handleClick} style={{ ...styles.card, opacity: outOfStock ? 0.6 : 1 }}>
      {/* Ảnh */}
      <div style={styles.imgWrap}>
        <img src={imageUrl} alt={name} style={styles.img} />
        <div style={styles.badges}>
          {outOfStock && <span style={{ ...styles.badge, background: '#666' }}>Hết hàng</span>}
          {hasSale && !outOfStock && <span style={{ ...styles.badge, background: '#e74c3c' }}>Sale</span>}
          {isNew && <span style={{ ...styles.badge, background: '#27ae60' }}>Mới</span>}
          {isFeatured && <span style={{ ...styles.badge, background: '#f39c12' }}>Hot</span>}
        </div>
      </div>

      {/* Thông tin */}
      <div style={styles.info}>
        <p style={styles.name}>{name}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Stars n={rating} size={13} />
          <span style={{ fontSize: 12, color: '#888' }}>({reviewCount})</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={styles.price}>{fmt(hasSale ? sale : price)}</span>
          {hasSale && <span style={styles.oldPrice}>{fmt(price)}</span>}
        </div>

        {sold > 0 && <p style={{ fontSize: 11, color: '#888', margin: '0 0 4px' }}>Đã bán: {sold}</p>}
        {stock < 20 && stock > 0 && <p style={{ fontSize: 11, color: '#e67e22', margin: '0 0 4px' }}>Còn {stock} sản phẩm</p>}

        <button
          onClick={handleAdd}
          disabled={outOfStock}
          style={{
            ...styles.btn,
            background: outOfStock ? '#ccc' : 'var(--rose, #e91e63)',
            cursor: outOfStock ? 'not-allowed' : 'pointer'
          }}
        >
          {outOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    border: '1px solid #eee', borderRadius: 10, overflow: 'hidden',
    cursor: 'pointer', transition: 'transform 0.2s', background: '#fff'
  },
  imgWrap: { position: 'relative', paddingTop: '100%', background: '#f9f9f9' },
  img: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' },
  badges: { position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 4 },
  badge: { padding: '2px 8px', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 600 },
  info: { padding: 12 },
  name: {
    fontSize: 14, fontWeight: 600, margin: '0 0 6px', lineHeight: 1.3,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
  },
  price: { fontSize: 15, fontWeight: 700, color: '#e91e63' },
  oldPrice: { fontSize: 12, color: '#999', textDecoration: 'line-through' },
  btn: { width: '100%', padding: '8px 0', border: 'none', borderRadius: 6, color: '#fff', fontWeight: 600, fontSize: 13 },
  hCard: { display: 'flex', gap: 12, padding: 10, border: '1px solid #eee', borderRadius: 8, cursor: 'pointer', background: '#fff' },
  hImg: { width: 70, height: 70, objectFit: 'cover', borderRadius: 6 },
  hName: { fontSize: 13, fontWeight: 600, margin: '0 0 4px', lineHeight: 1.3 }
};
