import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { createOrder, IMG_URL } from '../services/api';
import { fmt } from '../components/fmt';

const imageSrc = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return IMG_URL + url;
  return '';
};

export function CheckoutPage() {
  const { cart, cartTotal, navigate, showToast, user, clearCart } = useContext(AppContext);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    note: '',
    payment: 'cod'
  });
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Vui lòng nhập tên người nhận';
    if (!/^(0|\+84)\d{9}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Số điện thoại không hợp lệ';
    if (!form.address.trim()) e.address = 'Vui lòng nhập địa chỉ giao hàng';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const orderData = {
        receiverName: form.name,
        receiverPhone: form.phone,
        receiverAddress: form.address,
        note: form.note,
        shippingDetails: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          note: form.note
        },
        items: cart.map(i => ({
          productId: i.productId || i.id,
          quantity: i.qty,
          price: i.sale || i.price
        })),
        paymentMethod: form.payment,
        totalPrice: cartTotal + (cartTotal < 500000 ? 30000 : 0)
      };

      await createOrder(orderData);
      clearCart();
      setStep(3);
      showToast('Đặt hàng thành công!');
    } catch (error) {
      showToast(error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 3) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>&#10003;</div>
        <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28, marginBottom: 8 }}>Đặt hàng thành công!</div>
        <div style={{ color: 'var(--muted)', marginBottom: 8 }}>Cảm ơn bạn đã tin tưởng Mộng Lan Flower</div>
        <div style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 14 }}>Chúng tôi sẽ liên hệ xác nhận và giao hàng trong 2-4 giờ</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('home')}>Về trang chủ</button>
          <button className="btn btn-outline" onClick={() => navigate('profile')}>Xem đơn hàng</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div style={{ background: 'var(--warm)', padding: '28px 0', marginBottom: 28 }}>
        <div className="container"><div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28 }}>Đặt hàng</div></div>
      </div>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
            {['Thông tin giao hàng', 'Thanh toán'].map((s, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: step >= i + 1 ? 'var(--rose)' : 'var(--border)', color: step >= i + 1 ? '#fff' : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{i + 1}</div>
                <span style={{ fontSize: 14, fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? 'var(--text)' : 'var(--muted)' }}>{s}</span>
                {i < 1 && <div style={{ flex: 1, height: 2, background: 'var(--border)', marginLeft: 8 }} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: 28 }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Thông tin người nhận</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label>Tên người nhận *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nguyễn Văn A" />
                  {errors.name && <div style={{ color: 'var(--rose)', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}
                </div>
                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0901 234 567" />
                  {errors.phone && <div style={{ color: 'var(--rose)', fontSize: 12, marginTop: 4 }}>{errors.phone}</div>}
                </div>
              </div>
              <div className="form-group">
                <label>Địa chỉ giao hàng *</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố" />
                {errors.address && <div style={{ color: 'var(--rose)', fontSize: 12, marginTop: 4 }}>{errors.address}</div>}
              </div>
              <div className="form-group">
                <label>Ghi chú đơn hàng</label>
                <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={3} placeholder="Ví dụ: Lời chúc trên thiệp, thời gian giao hoa..." />
              </div>
              <button className="btn btn-primary" style={{ padding: '12px 32px' }} onClick={() => { if (validate()) setStep(2); }}>
                Tiếp tục thanh toán
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: 28 }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Phương thức thanh toán</div>
              {[
                ['cod', 'Thanh toán khi nhận hàng (COD)', 'Trả tiền mặt cho shipper khi nhận hoa'],
                ['transfer', 'Chuyển khoản ngân hàng', 'Thanh toán trước qua STK ngân hàng']
              ].map(([v, l, sub]) => (
                <div key={v} onClick={() => set('payment', v)} style={{ border: `2px solid ${form.payment === v ? 'var(--rose)' : 'var(--border)'}`, borderRadius: 12, padding: 16, marginBottom: 12, cursor: 'pointer', background: form.payment === v ? 'var(--rose-light)' : '#fff', transition: 'all .2s' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{sub}</div>
                  {v === 'transfer' && form.payment === 'transfer' && (
                    <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 8, fontSize: 13, border: '1px dashed var(--border)' }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>Thông tin tài khoản:</div>
                      <div>Ngân hàng: Vietcombank</div>
                      <div>Số TK: 1234 5678 9012</div>
                      <div>Chủ TK: CONG TY MONG LAN FLOWER</div>
                      <div>Nội dung: {form.phone} - Dat hoa</div>
                    </div>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)}>Quay lại</button>
                <button
                  className="btn btn-primary"
                  style={{ padding: '12px 32px' }}
                  onClick={placeOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: 24, position: 'sticky', top: 80 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Đơn hàng của bạn</div>
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: 16 }}>
            {cart.map(i => (
              <div key={i.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: 'var(--warm)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {imageSrc(i.imageUrl) ? (
                    <img src={imageSrc(i.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : null}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{i.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>x{i.qty}</div>
                </div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{fmt((i.sale || i.price) * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="divider" style={{ margin: '15px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8, color: 'var(--muted)' }}>
            <span>Tạm tính</span><span>{fmt(cartTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 12, color: 'var(--green)' }}>
            <span>Phí giao hàng</span><span>{cartTotal >= 500000 ? 'Miễn phí' : fmt(30000)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: 'var(--rose)' }}>
            <span>Tổng cộng</span><span>{fmt(cartTotal + (cartTotal < 500000 ? 30000 : 0))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
