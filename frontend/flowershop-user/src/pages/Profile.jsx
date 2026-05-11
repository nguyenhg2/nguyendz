import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { getMyOrders, IMG_URL } from '../services/api';
import { fmt } from '../components/fmt';

const imageSrc = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return IMG_URL + url;
  return '';
};

const isCompletedOrder = (order) => ['Completed', 'Hoàn thành'].includes(order?.status);
const orderItems = (order) => order?.items || order?.orderDetails || [];
const itemPrice = (item) => item.price || item.unitPrice || item.Price || 0;
const itemQuantity = (item) => item.quantity || item.Quantity || 0;
const itemTotal = (item) => item.subtotal || itemPrice(item) * itemQuantity(item);

export function ProfilePage() {
  const { user, setUser, showToast, setShowLogin } = useContext(AppContext);
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({ name: user?.fullName || user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ old: '', new1: '', new2: '' });
  const [viewOrder, setViewOrder] = useState(null);
  const [realOrders, setRealOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const exportInvoice = () => {
    if (!isCompletedOrder(viewOrder)) {
      showToast('Chỉ xuất được hóa đơn khi đơn hàng đã hoàn thành');
      return;
    }

    const rows = orderItems(viewOrder).map(item => `
      <tr>
        <td>${item.productName || item.name || ''}</td>
        <td>${itemQuantity(item)}</td>
        <td>${fmt(itemPrice(item))}</td>
        <td>${fmt(itemTotal(item))}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Hoa don #${viewOrder.orderId || viewOrder.id}</title>
          <style>
            body{font-family:Arial,sans-serif;padding:24px;color:#222}
            h2{text-align:center;margin:0 0 20px}
            p{margin:4px 0}
            table{width:100%;border-collapse:collapse;margin-top:18px}
            th,td{border:1px solid #ddd;padding:8px;text-align:left}
            th{background:#f5f5f5}
            .total{text-align:right;margin-top:16px;font-size:18px;font-weight:700}
          </style>
        </head>
        <body>
          <h2>Hóa đơn bán hàng</h2>
          <p><b>Mã đơn:</b> #${viewOrder.orderId || viewOrder.id}</p>
          <p><b>Khách hàng:</b> ${viewOrder.customerName || user.fullName || user.name || '-'}</p>
          <p><b>Người nhận:</b> ${viewOrder.receiverName || '-'}</p>
          <p><b>SĐT:</b> ${viewOrder.receiverPhone || '-'}</p>
          <p><b>Địa chỉ:</b> ${viewOrder.receiverAddress || viewOrder.shippingAddress || viewOrder.address || '-'}</p>
          <p><b>Thanh toán:</b> ${String(viewOrder.paymentMethod || '').toLowerCase() === 'cod' ? 'COD' : 'Chuyển khoản'}</p>
          <table>
            <thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="total">Tổng: ${fmt(viewOrder.totalAmount || viewOrder.totalPrice || viewOrder.total || 0)}</div>
        </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  useEffect(() => {
    if (user && tab === 'orders') {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const response = await getMyOrders();
          setRealOrders(response.data || []);
        } catch (error) {
          showToast('Không thể tải lịch sử đơn hàng');
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [tab, user]);

  if (!user) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Bạn chưa đăng nhập</div>
        <button className="btn btn-primary" onClick={() => setShowLogin(true)}>Đăng nhập ngay</button>
      </div>
    </div>
  );

  const statusClass = { 'Chờ xử lý': 'status-pending', 'Đã xác nhận': 'status-processing', 'Hoàn thành': 'status-delivered', 'Đã hủy': 'status-cancelled' };

  return (
    <div className="page">
      <div style={{ background: 'var(--warm)', padding: '28px 0', marginBottom: 28 }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--rose-light)', color: 'var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24 }}>
              {(user?.fullName || user?.name)?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 24 }}>{user.fullName || user.name}</div>
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>{user.email}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, alignItems: 'start' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {[['info', 'Thông tin cá nhân'], ['password', 'Đổi mật khẩu'], ['orders', 'Lịch sử đơn hàng']].map(([k, l]) => (
            <div key={k} onClick={() => { setTab(k); setViewOrder(null); }} style={{ padding: '14px 20px', cursor: 'pointer', fontWeight: tab === k ? 700 : 400, color: tab === k ? 'var(--rose)' : 'var(--text)', background: tab === k ? 'var(--rose-light)' : '', borderLeft: `3px solid ${tab === k ? 'var(--rose)' : 'transparent'}`, transition: 'all .2s' }}>
              {l}
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: 28, minHeight: 400 }}>
          {tab === 'info' && (
            <>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 24 }}>Thông tin cá nhân</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label>Họ tên</label><input value={form.name} onChange={e => set('name', e.target.value)} /></div>
                <div className="form-group"><label>Số điện thoại</label><input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              </div>
              <div className="form-group"><label>Email</label><input value={form.email} disabled style={{ background: '#f5f5f5' }} /></div>
              <button className="btn btn-primary" onClick={() => { const nextUser = { ...user, fullName: form.name, name: form.name, phone: form.phone }; setUser(nextUser); localStorage.setItem('user', JSON.stringify(nextUser)); showToast('Cập nhật thông tin thành công!'); }}>Lưu thay đổi</button>
            </>
          )}

          {tab === 'password' && (
            <>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 24 }}>Đổi mật khẩu</div>
              <div style={{ maxWidth: 400 }}>
                <div className="form-group"><label>Mật khẩu hiện tại</label><input type="password" value={pwForm.old} onChange={e => setPwForm(f => ({ ...f, old: e.target.value }))} /></div>
                <div className="form-group"><label>Mật khẩu mới</label><input type="password" value={pwForm.new1} onChange={e => setPwForm(f => ({ ...f, new1: e.target.value }))} /></div>
                <div className="form-group"><label>Xác nhận mật khẩu mới</label><input type="password" value={pwForm.new2} onChange={e => setPwForm(f => ({ ...f, new2: e.target.value }))} /></div>
                <button className="btn btn-primary" onClick={() => { if (pwForm.new1 === pwForm.new2 && pwForm.new1) { showToast('Đổi mật khẩu thành công!'); setPwForm({ old: '', new1: '', new2: '' }); } else showToast('Mật khẩu không khớp!'); }}>Đổi mật khẩu</button>
              </div>
            </>
          )}

          {tab === 'orders' && !viewOrder && (
            <>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 24 }}>Lịch sử đơn hàng</div>
              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>
              ) : realOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60 }}>Bạn chưa có đơn hàng nào</div>
              ) : (
                <table>
                  <thead>
                    <tr><th>Mã ĐH</th><th>Ngày đặt</th><th>Tổng tiền</th><th>Trạng thái</th><th></th></tr>
                  </thead>
                  <tbody>
                    {realOrders.map(o => (
                      <tr key={o.orderId}>
                        <td style={{ fontWeight: 700, color: 'var(--rose)' }}>#{o.orderId?.toString().padStart(4, '0')}</td>
                        <td style={{ color: 'var(--muted)', fontSize: 14 }}>{o.orderDate ? new Date(o.orderDate).toLocaleDateString('vi-VN') : '---'}</td>
                        <td style={{ fontWeight: 700 }}>{fmt(o.totalAmount)}</td>
                        <td><span className={`status-badge ${statusClass[o.status] || 'status-pending'}`}>{o.status}</span></td>
                        <td><button className="btn btn-ghost" onClick={() => setViewOrder(o)}>Xem chi tiết</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {tab === 'orders' && viewOrder && (
            <>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
                <button className="btn btn-ghost" onClick={() => setViewOrder(null)}>Quay lại</button>
                <div style={{ fontWeight: 800, fontSize: 17 }}>Chi tiết đơn #{viewOrder.orderId?.toString().padStart(4, '0')}</div>
                <span className={`status-badge ${statusClass[viewOrder.status]}`}>{viewOrder.status}</span>
                {isCompletedOrder(viewOrder) && <button className="btn btn-primary" onClick={exportInvoice}>Xuất hóa đơn</button>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div style={{ padding: 16, background: 'var(--warm)', borderRadius: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, textTransform: 'uppercase', color: 'var(--muted)' }}>Thông tin giao hàng</div>
                  <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                    <span>Khách hàng: <b>{viewOrder.customerName || user.fullName || user.name}</b></span><br />
                    <b>{viewOrder.receiverName || user.name}</b><br />
                    {viewOrder.receiverPhone || user.phone}<br />
                    {viewOrder.receiverAddress}
                  </div>
                </div>
                <div style={{ padding: 16, background: 'var(--warm)', borderRadius: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, textTransform: 'uppercase', color: 'var(--muted)' }}>Thanh toán</div>
                  <div style={{ fontSize: 14 }}>{String(viewOrder.paymentMethod || '').toLowerCase() === 'cod' ? 'Tiền mặt (COD)' : 'Chuyển khoản'}</div>
                  <div style={{ marginTop: 8, fontSize: 16, fontWeight: 800, color: 'var(--rose)' }}>{fmt(viewOrder.totalAmount)}</div>
                </div>
              </div>
              <table>
                <thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
                <tbody>
                  {orderItems(viewOrder).map((i, idx) => (
                    <tr key={i.id || idx}>
                      <td>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 4, overflow: 'hidden', background: 'var(--warm)', flexShrink: 0 }}>
                            {imageSrc(i.imageUrl) ? (
                              <img src={imageSrc(i.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : null}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{i.productName || i.name}</span>
                        </div>
                      </td>
                      <td>{itemQuantity(i)}</td>
                      <td>{fmt(itemPrice(i))}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(itemTotal(i))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
