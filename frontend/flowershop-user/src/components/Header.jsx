import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';

export default function Header() {
  const { navigate, cartCount, user, setShowLogin, setUser, showToast } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const navItems = [
    { label: 'Trang chủ', page: 'home' },
    { label: 'Liên hệ', page: 'contact' },
  ];

  const doSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate('search', { q: search });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    showToast('Đã đăng xuất! Hẹn gặp lại bạn');
    navigate('home');
  };

  const displayName = user?.fullName || user?.name || 'User';

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0' }}>
          <div onClick={() => navigate('home')} style={{ cursor: 'pointer', fontFamily: 'Playfair Display,serif', fontSize: 22, fontWeight: 600, color: 'var(--rose)', whiteSpace: 'nowrap' }}>
            Mộng Lan
          </div>
          <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
            {navItems.map(item => (
              <button key={item.page} className="btn btn-ghost" style={{ fontSize: 13 }}
                onClick={() => navigate(item.page)}>
                {item.label}
              </button>
            ))}
          </nav>
          <form onSubmit={doSearch} style={{ display: 'flex', gap: 0, maxWidth: 240 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm hoa..."
              style={{ borderRadius: '20px 0 0 20px', paddingRight: 8 }} />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: '0 20px 20px 0', padding: '8px 14px' }}>Tìm</button>
          </form>
          <button className="btn btn-ghost" onClick={() => navigate('cart')} style={{ position: 'relative', padding: '8px 12px' }}>
            Giỏ hàng
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: 0, right: 0, background: 'var(--rose)', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cartCount}
              </span>
            )}
          </button>
          {user ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn btn-ghost" onClick={() => navigate('profile')} style={{ fontSize: 13 }}>
                {displayName.split(' ').pop()}
              </button>
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={handleLogout}>Đăng xuất</button>
            </div>
          ) : (
            <button className="btn btn-outline" onClick={() => setShowLogin(true)} style={{ whiteSpace: 'nowrap' }}>Đăng nhập</button>
          )}
        </div>
      </div>
    </header>
  );
}
