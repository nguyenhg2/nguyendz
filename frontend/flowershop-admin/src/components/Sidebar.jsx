import { useAdmin } from '../context/AdminContext';
import { MENU_ITEMS } from '../constants/navigation';
import { adminEmail, adminInitial, adminName } from '../utils/adminUser';

export default function Sidebar() {
  const { page, navigate, admin, logout } = useAdmin();

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo">
        <span>Mộng Lan</span>
        <small>Admin Panel</small>
      </div>

      <nav className="sidebar-nav">
        {MENU_ITEMS.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section">{item.section}</div>
          ) : (
            <div
              key={item.key}
              className={`nav-item${page === item.key ? ' active' : ''}`}
              onClick={() => navigate(item.key)}
            >
              {item.label}
            </div>
          )
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="avatar" style={{ background: '#c84b6b22', color: '#c84b6b' }}>
            {adminInitial(admin)}
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{adminName(admin)}</div>
            <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 11 }}>{adminEmail(admin)}</div>
          </div>
        </div>
        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }} onClick={logout}>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
