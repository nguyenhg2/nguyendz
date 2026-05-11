import React from 'react';
import { useAdmin } from '../context/AdminContext';

const PAGE_TITLES = {
  dashboard:  'Dashboard',
  categories: 'Quản lý danh mục',
  products:   'Quản lý sản phẩm',
  orders:     'Quản lý đơn hàng',
  customers:  'Quản lý khách hàng',
  reviews:    'Quản lý đánh giá',
  banners:    'Quản lý banner',
  contacts:   'Quản lý liên hệ',
  reports:    'Báo cáo thống kê',
};

export default function Topbar() {
  const { page, admin } = useAdmin();
  const now = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="admin-topbar">
      <div>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{PAGE_TITLES[page] || 'Admin'}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{now}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--muted)' }}>
          Shop hoa Mộng Lan
        </div>
        <div className="avatar">{admin?.FullName?.[0] || 'A'}</div>
      </div>
    </header>
  );
}
