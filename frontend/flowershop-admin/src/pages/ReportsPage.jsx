import React, { useState, useEffect, useCallback } from 'react';
import { IMG_URL, reportAPI } from '../services/api';
import { useAdmin } from '../context/AdminContext';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const fmt    = n => new Intl.NumberFormat('vi-VN').format(n || 0);
const fmtVND = n => fmt(n) + 'đ';

const PIE_COLORS = ['#c84b6b', '#3b82f6', '#22c55e', '#f97316', '#8b5cf6'];

const imageSrc = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return IMG_URL + url;
};

export default function ReportsPage() {
  const { addToast } = useAdmin();
  const [year,      setYear]      = useState(new Date().getFullYear());
  const [revenue,   setRevenue]   = useState([]);
  const [topProds,  setTopProds]  = useState([]);
  const [orderStats,setOrderStats]= useState(null);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, t, o] = await Promise.all([
        reportAPI.revenue({ year }),
        reportAPI.topProducts({ limit: 10 }),
        reportAPI.orderStats(),
      ]);
      setRevenue(r.data   || []);
      setTopProds(t.data  || []);
      setOrderStats(o.data|| null);
    } catch { addToast('Lỗi tải báo cáo', 'error'); }
    finally { setLoading(false); }
  }, [year, addToast]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = revenue.reduce((s, r) => s + (r.revenue || 0), 0);
  const totalOrders  = revenue.reduce((s, r) => s + (r.orders  || 0), 0);
  const bestMonth    = revenue.reduce((best, r) => r.revenue > (best?.revenue || 0) ? r : best, null);

  const orderPieData = orderStats ? [
    { name: 'Hoàn thành',  value: orderStats.done      || 0 },
    { name: 'Đang giao',   value: orderStats.shipping  || 0 },
    { name: 'Đã xác nhận', value: orderStats.confirmed || 0 },
    { name: 'Chờ xử lý',  value: orderStats.pending   || 0 },
    { name: 'Đã hủy',      value: orderStats.cancelled || 0 },
  ].filter(d => d.value > 0) : [];

  if (loading) return <div className="spinner"/>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Báo cáo thống kê</div>
          <div className="page-subtitle">Tổng quan hoạt động kinh doanh</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Năm:</label>
          <select value={year} onChange={e => setYear(+e.target.value)} style={{ width: 110 }}>
            {[2022, 2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: `Tổng doanh thu ${year}`,  value: fmtVND(totalRevenue),  icon: 'DT', bg: 'linear-gradient(135deg,#c84b6b,#8b2d47)' },
          { label: `Tổng đơn hàng ${year}`,   value: fmt(totalOrders),       icon: 'DH', bg: 'linear-gradient(135deg,#3b82f6,#1e40af)' },
          { label: 'Tháng doanh thu cao nhất', value: bestMonth ? `T${bestMonth.month}` : '-', icon: 'T', bg: 'linear-gradient(135deg,#f59e0b,#b45309)' },
          { label: 'Doanh thu tháng tốt nhất', value: bestMonth ? fmtVND(bestMonth.revenue) : '-', icon: 'DT', bg: 'linear-gradient(135deg,#22c55e,#15803d)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ background: s.bg }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 22 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Doanh thu & Đơn hàng theo tháng - {year}</span>
        </div>
        <div className="card-body">
          {revenue.length === 0 ? (
            <div className="empty-state"><p>Không có dữ liệu doanh thu năm {year}</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenue} margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month" tickFormatter={m => `T${m}`} tick={{ fontSize: 12 }}/>
                <YAxis yAxisId="left" tickFormatter={v => (v / 1000000).toFixed(0) + 'M'} tick={{ fontSize: 11 }} width={52}/>
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} width={36}/>
                <Tooltip
                  formatter={(v, name) => name === 'revenue' ? fmtVND(v) : fmt(v)}
                  labelFormatter={l => `Tháng ${l} / ${year}`}
                />
                <Legend formatter={v => v === 'revenue' ? 'Doanh thu' : 'Số đơn'}/>
                <Bar yAxisId="left"  dataKey="revenue" name="revenue" fill="#c84b6b" radius={[4,4,0,0]}/>
                <Bar yAxisId="right" dataKey="orders"  name="orders"  fill="#3b82f6" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Top 10 sản phẩm bán chạy</span></div>
          <div className="tbl-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>Sản phẩm</th><th>Danh mục</th><th>Đã bán</th><th>Doanh thu</th></tr>
              </thead>
              <tbody>
                {topProds.length === 0 && (
                  <tr><td colSpan={5}><div className="empty-state" style={{ padding: 32 }}><p>Chưa có dữ liệu</p></div></td></tr>
                )}
                {topProds.map((p, i) => (
                  <tr key={p.productId}>
                    <td>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11,
                        background: i < 3 ? ['#fef08a','#e2e8f0','#fed7aa'][i] : '#f3f4f6',
                        color: i < 3 ? ['#854d0e','#475569','#7c2d12'][i] : 'var(--muted)' }}>
                        {i + 1}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.imageUrl ? <img src={imageSrc(p.imageUrl)} alt="" className="img-preview" style={{ width: 36, height: 36 }}/> : <div className="img-preview" style={{ width: 36, height: 36 }} />}
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{p.productName}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{p.categoryName || '—'}</td>
                    <td style={{ fontWeight: 700, textAlign: 'center' }}>{fmt(p.soldQuantity)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{fmtVND(p.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Tỷ lệ trạng thái đơn hàng</span></div>
          <div className="card-body">
            {orderPieData.length === 0 ? (
              <div className="empty-state"><p>Chưa có dữ liệu đơn hàng</p></div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={orderPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {orderPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={v => fmt(v) + ' đơn'}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {orderPieData.map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }}/>
                        <span>{d.name}</span>
                      </div>
                      <span style={{ fontWeight: 700 }}>{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {revenue.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title">Xu hướng doanh thu - {year}</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month" tickFormatter={m => `T${m}`} tick={{ fontSize: 12 }}/>
                <YAxis tickFormatter={v => (v / 1000000).toFixed(0) + 'M'} tick={{ fontSize: 11 }} width={48}/>
                <Tooltip formatter={v => fmtVND(v)} labelFormatter={l => `Tháng ${l}`}/>
                <Line type="monotone" dataKey="revenue" stroke="#c84b6b" strokeWidth={2.5} dot={{ fill: '#c84b6b', r: 4 }} activeDot={{ r: 6 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
