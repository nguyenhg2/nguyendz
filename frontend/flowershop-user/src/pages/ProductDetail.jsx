import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { IMG_URL, getProductDetail, getProducts, submitReview as submitReviewApi, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import Stars from '../components/Stars';
import { fmt } from '../components/fmt';

const imageSrc = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return IMG_URL + url;
  return '';
};

export function ProductDetailPage() {
  const { pageParams, navigate, addToCart, user, setShowLogin, showToast } = useContext(AppContext);

  const [p, setP] = useState(null);
  const [categories, setCategories] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('desc');
  const [myStars, setMyStars] = useState(0);
  const [myReview, setMyReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const initData = async () => {
      if (!pageParams.id) return;
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          getProductDetail(pageParams.id),
          getCategories()
        ]);

        const productData = prodRes.data;
        setP(productData);
        setCategories(catRes.data.items || catRes.data || []);
        setSelectedImage(productData.images?.[0]?.imageUrl || productData.imageUrl || '');
        setQty(1);

        const relatedRes = await getProducts({ cat: productData.cat || productData.categoryId });
        const relatedItems = relatedRes.data.items || relatedRes.data || [];
        setRelated(
          relatedItems
            .filter(x => (x.id || x.productId) !== (productData.id || productData.productId))
            .slice(0, 4)
        );
      } catch (error) {
        showToast('Không thể tải thông tin sản phẩm');
      } finally {
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };
    initData();
  }, [pageParams.id]);

  const stock = (p?.stockQuantity === null || p?.stockQuantity === undefined) ? 999 : p.stockQuantity;

  const handleQtyChange = (value) => {
    const num = parseInt(value);
    if (isNaN(num) || num < 1) { setQty(1); return; }
    if (stock > 0 && num > stock) { setQty(stock); return; }
    setQty(num);
  };

  const handleAddToCart = () => {
    if (stock === 0) { showToast('Sản phẩm đã hết hàng'); return; }
    addToCart(p, qty);
  };

  const handleBuyNow = () => {
    if (stock === 0) { showToast('Sản phẩm đã hết hàng'); return; }
    addToCart(p, qty);
    navigate('cart');
  };

  const handleReview = async () => {
    if (!user) { setShowLogin(true); return; }
    if (!myStars || !myReview.trim()) {
      showToast('Vui lòng chọn số sao và nhập nhận xét');
      return;
    }
    setIsSubmitting(true);
    try {
      await submitReviewApi({
        productId: p.id || p.productId,
        rating: myStars,
        comment: myReview
      });
      showToast('Cảm ơn bạn đã đánh giá sản phẩm!');
      setMyStars(0);
      setMyReview('');
      const updatedProd = await getProductDetail(p.id || p.productId);
      setP(updatedProd.data);
    } catch (error) {
      showToast(error.response?.data?.message || 'Gửi đánh giá thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 100, textAlign: 'center' }}>Đang tải thông tin...</div>;
  if (!p) return <div style={{ padding: 100, textAlign: 'center' }}>Sản phẩm không tồn tại.</div>;

  const discount = p.sale ? Math.round((1 - p.sale / p.price) * 100) : 0;
  const currentCat = categories.find(c => (c.categoryId || c.id) === p.cat);
  const galleryImages = (p.images?.length ? p.images : [{ id: 'main', imageUrl: p.imageUrl }])
    .filter(x => x.imageUrl);
  const mainImageSrc = imageSrc(selectedImage || p.imageUrl);

  return (
    <div className="page">
      <div style={{ background: 'var(--warm)', padding: '14px 0', marginBottom: 28 }}>
        <div className="container" style={{ fontSize: 13, color: 'var(--muted)' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('home')}>Trang chủ</span> {'>'}{' '}
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('category', { cat: p.cat })}>
            {currentCat?.categoryName || currentCat?.name || 'Sản phẩm'}
          </span> {'>'}{' '}
          {p.name}
        </div>
      </div>

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 48 }}>
          <div>
            <div style={{ background: '#fff', borderRadius: 20, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border)' }}>
              {mainImageSrc ? (
                <img src={mainImageSrc} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }} />
              ) : null}
            </div>
            {galleryImages.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 92px))', gap: 10, marginTop: 12, justifyContent: 'start' }}>
                {galleryImages.map(img => {
                  const thumbSrc = imageSrc(img.imageUrl);
                  const active = img.imageUrl === (selectedImage || p.imageUrl);
                  return (
                    <button
                      key={img.id || img.imageUrl}
                      type="button"
                      onClick={() => setSelectedImage(img.imageUrl)}
                      style={{
                        aspectRatio: '1',
                        border: active ? '2px solid var(--rose)' : '1px solid var(--border)',
                        borderRadius: 10,
                        padding: 0,
                        background: '#fff',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                    >
                      {thumbSrc ? (
                        <img src={thumbSrc} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            {p.isNew && <span className="badge badge-new" style={{ marginBottom: 10, display: 'inline-block' }}>Hàng mới về</span>}
            <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 32, marginBottom: 10, lineHeight: 1.2 }}>{p.name}</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Stars n={p.rating} size={16} />
              <span style={{ fontSize: 14, color: 'var(--muted)' }}>
                {p.rating} ({p.reviews?.length || 0} đánh giá) - Đã bán <b>{p.soldQuantity || 0}</b>
              </span>
            </div>

            <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginBottom: 20 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--rose)' }}>{fmt(p.sale || p.price)}</span>
              {p.sale && p.sale < p.price && (
                <>
                  <span style={{ textDecoration: 'line-through', color: 'var(--muted)', fontSize: 18 }}>{fmt(p.price)}</span>
                  <span className="badge badge-sale">-{discount}%</span>
                </>
              )}
            </div>

            <div className="divider" style={{ margin: '20px 0' }} />

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>
                Số lượng {stock > 0 && stock < 999 ? `(còn ${stock} sản phẩm)` : stock === 0 ? '(Hết hàng)' : ''}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  disabled={stock === 0}
                  style={{ padding: '8px 15px', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', borderRadius: '4px 0 0 4px' }}
                >-</button>
                <input
                  type="number"
                  min="1"
                  max={stock < 999 ? stock : undefined}
                  value={qty}
                  onChange={e => handleQtyChange(e.target.value)}
                  disabled={stock === 0}
                  style={{ width: 60, textAlign: 'center', padding: '8px 4px', border: '1px solid var(--border)', borderLeft: 'none', borderRight: 'none' }}
                />
                <button
                  onClick={() => setQty(q => Math.min(stock < 999 ? stock : q + 1, q + 1))}
                  disabled={stock === 0 || (stock < 999 && qty >= stock)}
                  style={{ padding: '8px 15px', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', borderRadius: '0 4px 4px 0' }}
                >+</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: '14px', justifyContent: 'center', fontSize: 16 }}
                onClick={handleAddToCart}
                disabled={stock === 0}
              >
                Thêm vào giỏ
              </button>
              <button
                className="btn btn-outline"
                style={{ flex: 1, padding: '14px', justifyContent: 'center', fontSize: 16 }}
                onClick={handleBuyNow}
                disabled={stock === 0}
              >
                Mua ngay
              </button>
            </div>

            <div className="divider" style={{ margin: '20px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {['Giao nhanh 2-4h', 'Hoa tươi 100%', 'Đổi trả miễn phí', 'Hỗ trợ 24/7'].map(t => (
                <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--muted)' }}>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderBottom: '2px solid var(--border)', marginBottom: 24, display: 'flex' }}>
          {[['desc', 'Mô tả'], ['review', `Đánh giá (${p.reviews?.length || 0})`]].map(([k, l]) => (
            <button key={k} onClick={() => setActiveTab(k)}
              style={{ padding: '12px 30px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, color: activeTab === k ? 'var(--rose)' : 'var(--muted)', borderBottom: `3px solid ${activeTab === k ? 'var(--rose)' : 'transparent'}`, marginBottom: -2 }}>
              {l}
            </button>
          ))}
        </div>

        {activeTab === 'desc' ? (
          <div style={{ lineHeight: 1.8, color: 'var(--text)', maxWidth: 800, marginBottom: 60 }}>
            <p style={{ whiteSpace: 'pre-line' }}>{p.desc || 'Thông tin mô tả sản phẩm đang được cập nhật.'}</p>
            <div style={{ marginTop: 24, padding: 20, background: 'var(--warm)', borderRadius: 12 }}>
              <h4 style={{ marginBottom: 10 }}>Mộng Lan Flower cam kết:</h4>
              <ul style={{ paddingLeft: 20, fontSize: 14 }}>
                <li>Hoa tươi nhập mới mỗi ngày từ Đà Lạt.</li>
                <li>Mẫu mã giống hình 90-95% tùy theo mùa hoa.</li>
                <li>Tặng kèm thiệp chúc mừng miễn phí.</li>
                <li>Chụp hình sản phẩm trước khi giao khách.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 800, marginBottom: 60 }}>
            <div style={{ background: 'var(--warm)', borderRadius: 16, padding: 24, marginBottom: 32 }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Viết nhận xét của bạn</div>
              <div style={{ display: 'flex', gap: 5, marginBottom: 15 }}>
                {[1, 2, 3, 4, 5].map(num => (
                  <span key={num} onClick={() => setMyStars(num)} style={{ fontSize: 32, cursor: 'pointer', color: num <= myStars ? 'var(--gold)' : '#ccc' }}>
                    {'★'}
                  </span>
                ))}
              </div>
              <textarea value={myReview} onChange={e => setMyReview(e.target.value)} placeholder="Hãy chia sẻ cảm nhận về bó hoa này nhé..." rows={4} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 12 }} />
              <button className="btn btn-primary" onClick={handleReview} disabled={isSubmitting}>
                {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>

            {(!p.reviews || p.reviews.length === 0) ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Chưa có đánh giá nào cho sản phẩm này.</div>
            ) : (
              p.reviews.map(rev => (
                <div key={rev.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20, marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--rose-light)', color: 'var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {rev.userName?.[0] || 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{rev.userName}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <Stars n={rev.rating} size={14} />
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)' }}>{rev.comment}</div>
                </div>
              ))
            )}
          </div>
        )}

        {related.length > 0 && (
          <div style={{ marginTop: 60 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="section-title" style={{ margin: 0 }}>Sản phẩm tương tự</h2>
              <button className="btn btn-ghost" onClick={() => navigate('category', { cat: p.cat })}>Xem thêm</button>
            </div>
            <div className="grid-4">
              {related.map(item => <ProductCard key={item.productId || item.id} product={item} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
