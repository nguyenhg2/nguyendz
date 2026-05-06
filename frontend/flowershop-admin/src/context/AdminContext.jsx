import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { authAPI } from '../services/api';

const AdminContext = createContext();
const PAGE_KEYS = ['dashboard', 'categories', 'products', 'orders', 'customers', 'reviews', 'banners', 'contacts', 'reports'];

const pageFromLocation = () => {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  return PAGE_KEYS.includes(path) ? path : 'dashboard';
};

const pathForPage = (page) => `/${PAGE_KEYS.includes(page) ? page : 'dashboard'}`;

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [page, setPage] = useState(pageFromLocation);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const token = localStorage.getItem('admin_token');
    if (!token) { setLoading(false); return; }

    authAPI.me()
      .then(res => {
        const user = res.data;
        const role = user.role || user.Role;
        if (user && role === 'Admin') {
          setAdmin(user);
        } else {
          localStorage.removeItem('admin_token');
        }
      })
      .catch(() => {
        localStorage.removeItem('admin_token');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const onPopState = () => setPage(pageFromLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((p) => {
    const nextPage = PAGE_KEYS.includes(p) ? p : 'dashboard';
    setPage(nextPage);
    const nextPath = pathForPage(nextPage);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  }, []);

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
    setPage('dashboard');
    window.history.pushState({}, '', '/login');
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Đang tải...
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ admin, setAdmin, page, navigate, addToast, logout }}>
      {children}
      {toasts.length > 0 && (
        <div className="toast">
          {toasts.map(t => (
            <div key={t.id} className={`toast-item toast-${t.type}`}>{t.msg}</div>
          ))}
        </div>
      )}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
