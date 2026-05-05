import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { fmt } from '../components/fmt';

export default function CartPage() {
  const { cart, updateCart, cartTotal, navigate } = useContext(AppContext);

  if (!cart || cart.length === 0) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>🛒</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Giỏ hàng trống</div>
        <div style={{ color: 'var(--muted)', marginBottom: 24 }}>Thêm sản phẩm vào giỏ để tiếp tục</div>
        <button className="btn btn-primary" onClick={() => navigate('home')}>🌸 Mua sắm ngay</button>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div style={{ background: 'var(--warm)', padding: '28px 0', marginBottom: 28 }}>
        <div className="container">
          <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28 }}>
            🛒 Giỏ hàng ({cart.length} sản phẩm)
          </div>
        </div>
      </div>

      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>
        {/* Danh sách sản phẩm trong giỏ */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Đơn giá</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('product', { id: item.id })}>
                      {/* Xử lý hình ảnh: ưu tiên URL, sau đó đến emoji */}
                      <div style={{ width: 60, height: 60, background: 'var(--warm)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {item.img?.startsWith('http') ? (
                          <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 32 }}>{item.img || '🌸'}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                        {item.sale < item.price && <span className="badge badge-sale">Giảm giá</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--rose)', fontWeight: 700 }}>{fmt(item.sale || item.price)}</td>
                  <td>
                    <div className="qty-ctrl">
                      <button className="qty-btn" style={{ borderRadius: '8px 0 0 8px' }} onClick={() => updateCart(item.id, item.qty - 1)}>−</button>
                      <input className="qty-num" value={item.qty} readOnly style={{ width: 44, textAlign: 'center' }} />
                      <button className="qty-btn" style={{ borderRadius: '0 8px 8px 0' }} onClick={() => updateCart(item.id, item.qty + 1)}>+</button>
                    </div>
                  </td>
                  <td style={{ fontWeight: 800, fontSize: 15 }}>{fmt((item.sale || item.price) * item.qty)}</td>
                  <td>
                    <button onClick={() => updateCart(item.id, 0)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--rose)', fontSize: 18 }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tóm tắt đơn hàng (Sidebar) */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: 24, position: 'sticky', top: 80 }}>
          <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 20 }}>Tóm tắt đơn hàng</div>
          {cart.map(i => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8, color: 'var(--muted)' }}>
              <span style={{ flex: 1, paddingRight: 10 }}>{i.name} ×{i.qty}</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{fmt((i.sale || i.price) * i.qty)}</span>
            </div>
          ))}
          
          <div className="divider" />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: 'var(--muted)' }}>
            <span>Tạm tính</span><span>{fmt(cartTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 14, color: 'var(--green)' }}>
            <span>🚚 Phí giao hàng</span>
            <span style={{ fontWeight: 700 }}>{cartTotal >= 500000 ? 'Miễn phí' : '30.000đ'}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: 'var(--rose)', marginBottom: 20 }}>
            <span>Tổng cộng</span><span>{fmt(cartTotal + (cartTotal < 500000 ? 30000 : 0))}</span>
          </div>

          {cartTotal < 500000 && (
            <div style={{ background: 'var(--green-light)', color: 'var(--green)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              🎁 Mua thêm {fmt(500000 - cartTotal)} để được miễn phí ship!
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px' }} onClick={() => navigate('checkout')}>
            Đặt hàng →
          </button>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => navigate('home')}>
            ← Tiếp tục mua sắm
          </button>
        </div>
      </div>
    </div>
  );
}