import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = n => new Intl.NumberFormat('vi-VN').format(n || 0);
const fmtVND = n => fmt(n) + 'đ';

const STATUS_BADGE = {
  'Chờ xử lý':  'badge-pending',
  'Đã xác nhận':'badge-confirmed',
  'Đang giao':  'badge-shipping',
  'Hoàn thành': 'badge-done',
  'Đã hủy':     'badge-cancelled',
};

const paymentLabel = (method) => {
  return String(method || '').toLowerCase() === 'cod' ? 'COD' : 'Thanh toán';
};

export default function DashboardPage() {
  const { addToast } = useAdmin();
  const [stats,   setStats]   = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [chart,   setChart]   = useState([]);
  const [topProd, setTopProd] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, o, c, t] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecentOrders(),
          dashboardAPI.getRevenueChart(),
          dashboardAPI.getTopProducts(),
        ]);
        setStats(s.data);
        setOrders(o.data || []);
        setChart(c.data  || []);
        setTopProd(t.data|| []);
      } catch {
        addToast('Không thể tải dữ liệu dashboard', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [addToast]);

  if (loading) return <div className="spinner"/>;

  const STAT_CARDS = [
    { label:'Doanh thu hôm nay',  value: fmtVND(stats?.todayRevenue),   bg:'linear-gradient(135deg,#c84b6b,#8b2d47)',  sub:`Tháng này: ${fmtVND(stats?.monthRevenue)}` },
    { label:'Đơn hàng hôm nay',   value: fmt(stats?.todayOrders),        bg:'linear-gradient(135deg,#3b82f6,#1e40af)',  sub:`Tổng: ${fmt(stats?.totalOrders)} đơn` },
    { label:'Tổng sản phẩm',      value: fmt(stats?.totalProducts),      bg:'linear-gradient(135deg,#22c55e,#15803d)',  sub:'Sản phẩm đang bán' },
    { label:'Khách hàng',         value: fmt(stats?.totalCustomers),      bg:'linear-gradient(135deg,#f97316,#c2410c)',  sub:'Đã đăng ký' },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 24 }}>
        {STAT_CARDS.map(s => (
          <div key={s.label} className="stat-card" style={{ background: s.bg }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Doanh thu theo tháng</span></div>
          <div className="card-body">
            {chart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chart} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }}/>
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v/1000000).toFixed(0)+'M'}/>
                  <Tooltip formatter={v => fmtVND(v)} labelFormatter={l => `Tháng ${l}`}/>
                  <Bar dataKey="revenue" fill="#c84b6b" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state"><p>Chưa có dữ liệu doanh thu</p></div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Sản phẩm bán chạy</span></div>
          <div className="card-body" style={{ padding: '12px 16px' }}>
            {topProd.slice(0, 7).map((p, i) => (
              <div key={p.productId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 6 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: i < 3 ? '#c84b6b' : '#f3f4f6', color: i < 3 ? '#fff' : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.productName}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Đã bán: {fmt(p.soldQuantity)}</div>
                </div>
              </div>
            ))}
            {topProd.length === 0 && <div className="empty-state"><p>Chưa có dữ liệu</p></div>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Đơn hàng gần nhất</span>
        </div>
        <div className="tbl-wrapper">
          <table>
            <thead>
              <tr>
                <th>#ID</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>Địa chỉ</th>
                <th>Thanh toán</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày đặt</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">📭</div><p>Chưa có đơn hàng nào</p></div></td></tr>
              )}
              {orders.map(o => (
                <tr key={o.orderId}>
                  <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>#{o.orderId}</span></td>
                  <td><span style={{ fontWeight: 600 }}>{o.receiverName}</span></td>
                  <td style={{ color: 'var(--muted)' }}>{o.receiverPhone}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: 12 }}>{o.receiverAddress}</td>
                  <td><span style={{ fontSize: 12 }}>{paymentLabel(o.paymentMethod)}</span></td>
                  <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{fmtVND(o.totalAmount)}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[o.status] || 'badge-pending'}`}>{o.status}</span></td>
                  <td style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(o.orderDate).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
