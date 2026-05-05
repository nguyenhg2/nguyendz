import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { authAPI } from '../services/api';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [page, setPage] = useState('dashboard');
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

  const navigate = useCallback((p) => setPage(p), []);

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
    setPage('dashboard');
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
