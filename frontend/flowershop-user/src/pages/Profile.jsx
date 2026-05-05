import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { getMyOrders } from '../services/api'; 
import { fmt } from '../components/fmt';

export function ProfilePage() {
  const { user, setUser, navigate, showToast, setShowLogin } = useContext(AppContext);
  // eslint-disable-next-line no-unused-vars
  const navigateUnused = navigate;
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ old: '', new1: '', new2: '' });
  const [viewOrder, setViewOrder] = useState(null);
  const [realOrders, setRealOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (user && tab === 'orders') {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const response = await getMyOrders(); 
          setRealOrders(response.data || []);
        } catch (error) {
          console.error("Lỗi lấy đơn hàng:", error);
          showToast('Không thể tải lịch sử đơn hàng');
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, user]);

  if (!user) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Bạn chưa đăng nhập</div>
        <button className="btn btn-primary" onClick={() => setShowLogin(true)}>Đăng nhập ngay</button>
      </div>
    </div>
  );

  // Label trạng thái khớp với dữ liệu Tiếng Việt từ Database
  const statusClass = { 'Chờ xử lý': 'status-pending', 'Đã xác nhận': 'status-processing', 'Hoàn thành': 'status-delivered', 'Đã hủy': 'status-cancelled' };

  return (
    <div className="page">
      <div style={{ background: 'var(--warm)', padding: '28px 0', marginBottom: 28 }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--rose-light)', color: 'var(--rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24 }}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 24 }}>{user.name}</div>
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>{user.email}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, alignItems: 'start' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {[['info', 'Thông tin cá nhân'], ['password', 'Đổi mật khẩu'], ['orders', 'Lịch sử đơn hàng']].map(([k, l]) => (
            <div key={k} onClick={() => { setTab(k); setViewOrder(null) }} style={{ padding: '14px 20px', cursor: 'pointer', fontWeight: tab === k ? 700 : 400, color: tab === k ? 'var(--rose)' : 'var(--text)', background: tab === k ? 'var(--rose-light)' : '', borderLeft: `3px solid ${tab === k ? 'var(--rose)' : 'transparent'}`, transition: 'all .2s' }}>
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
              <div className="form-group"><label>Email</label><input value={form.email} disabled style={{background: '#f5f5f5'}} /></div>
              <button className="btn btn-primary" onClick={() => { setUser(u => ({ ...u, ...form })); showToast('Cập nhật thông tin thành công!') }}>Lưu thay đổi</button>
            </>
          )}

          {tab === 'password' && (
            <>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 24 }}>Đổi mật khẩu</div>
              <div style={{ maxWidth: 400 }}>
                <div className="form-group"><label>Mật khẩu hiện tại</label><input type="password" value={pwForm.old} onChange={e => setPwForm(f => ({ ...f, old: e.target.value }))} /></div>
                <div className="form-group"><label>Mật khẩu mới</label><input type="password" value={pwForm.new1} onChange={e => setPwForm(f => ({ ...f, new1: e.target.value }))} /></div>
                <div className="form-group"><label>Xác nhận mật khẩu mới</label><input type="password" value={pwForm.new2} onChange={e => setPwForm(f => ({ ...f, new2: e.target.value }))} /></div>
                <button className="btn btn-primary" onClick={() => { if (pwForm.new1 === pwForm.new2 && pwForm.new1) { showToast('Đổi mật khẩu thành công!'); setPwForm({ old: '', new1: '', new2: '' }) } else showToast('Mật khẩu không khớp!') }}>Đổi mật khẩu</button>
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
                <button className="btn btn-ghost" onClick={() => setViewOrder(null)}>← Quay lại</button>
                <div style={{ fontWeight: 800, fontSize: 17 }}>Chi tiết đơn #{viewOrder.orderId?.toString().padStart(4, '0')}</div>
                <span className={`status-badge ${statusClass[viewOrder.status]}`}>{viewOrder.status}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                <div style={{ padding: 16, background: 'var(--warm)', borderRadius: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, textTransform: 'uppercase', color: 'var(--muted)' }}>Thông tin giao hàng</div>
                  <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                    <b>{viewOrder.receiverName || user.name}</b><br />
                    {viewOrder.receiverPhone || user.phone}<br />
                    {viewOrder.receiverAddress}
                  </div>
                </div>
                <div style={{ padding: 16, background: 'var(--warm)', borderRadius: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, textTransform: 'uppercase', color: 'var(--muted)' }}>Thanh toán</div>
                  <div style={{ fontSize: 14 }}>{viewOrder.paymentMethod === 'cod' ? 'Tiền mặt (COD)' : 'Chuyển khoản'}</div>
                  <div style={{ marginTop: 8, fontSize: 16, fontWeight: 800, color: 'var(--rose)' }}>{fmt(viewOrder.totalAmount)}</div>
                </div>
              </div>
              <table>
                <thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
                <tbody>
                  {(viewOrder.items || viewOrder.orderDetails || []).map((i, idx) => (
                    <tr key={i.id || idx}>
                      <td>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontSize: 24 }}>{i.imageUrl || '🌼'}</span>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{i.productName || i.name}</span>
                        </div>
                      </td>
                      <td>{i.quantity || i.Quantity || 0}</td>
                      <td>{fmt(i.price || i.Price || 0)}</td>
                      <td style={{ fontWeight: 700 }}>{fmt((i.price || i.Price || 0) * (i.quantity || i.Quantity || 0))}</td>
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