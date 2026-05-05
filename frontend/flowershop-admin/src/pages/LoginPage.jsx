import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { authAPI } from '../services/api';

export default function LoginPage() {
  const { setAdmin, navigate, addToast } = useAdmin();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Vui lòng nhập đầy đủ thông tin'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.login(form);
      const { token, user } = res.data;
      if (user.role !== 'Admin') {
        setError('Tài khoản không có quyền truy cập trang quản trị');
        setLoading(false);
        return;
      }
      localStorage.setItem('admin_token', token);
      setAdmin(user);
      addToast(`Chào mừng, ${user.fullName}!`);
      navigate('dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '44px 40px', width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,.35)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: '#c84b6b' }}>FlowerShop Admin</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Đăng nhập vào hệ thống quản trị</div>
        </div>
        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 18, fontWeight: 600 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="admin@gmail.com" autoFocus />
          </div>
          <div className="form-group" style={{ marginBottom: 22 }}>
            <label>Mật khẩu</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }} disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
