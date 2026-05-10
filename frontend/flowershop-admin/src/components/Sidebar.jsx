import React from 'react';
import { useAdmin } from '../context/AdminContext';

const MENU = [
  { section: 'Tổng quan' },
  { key: 'dashboard',  icon: 'DB', label: 'Dashboard' },

  { section: 'Nội dung' },
  { key: 'categories', icon: 'DM', label: 'Danh mục' },
  { key: 'products',   icon: 'SP', label: 'Sản phẩm' },
  { key: 'banners',    icon: 'BN', label: 'Banner' },

  { section: 'Kinh doanh' },
  { key: 'orders',     icon: 'DH', label: 'Đơn hàng' },
  { key: 'customers',  icon: 'KH', label: 'Khách hàng' },
  { key: 'reviews',    icon: 'DG', label: 'Đánh giá' },

  { section: 'Hỗ trợ' },
  { key: 'contacts',   icon: 'LH', label: 'Liên hệ' },
  { key: 'reports',    icon: 'BC', label: 'Báo cáo' },
];

export default function Sidebar() {
  const { page, navigate, admin, logout } = useAdmin();

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo">
        <span>Mộng Lan</span>
        <small>Admin Panel</small>
      </div>

      <nav className="sidebar-nav">
        {MENU.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section">{item.section}</div>
          ) : (
            <div
              key={item.key}
              className={`nav-item${page === item.key ? ' active' : ''}`}
              onClick={() => navigate(item.key)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </div>
          )
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="avatar" style={{ background: '#c84b6b22', color: '#c84b6b' }}>
            {admin?.FullName?.[0] || 'A'}
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{admin?.FullName || 'Admin'}</div>
            <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 11 }}>{admin?.Email || ''}</div>
          </div>
        </div>
        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }} onClick={logout}>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
