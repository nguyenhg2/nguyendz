import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI, adminAuth } from '../services/api';
import { DEFAULT_ADMIN_PAGE, normalizeAdminPage, pagePath } from '../constants/navigation';

const AdminContext = createContext();

const pageFromLocation = () => {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  return normalizeAdminPage(path);
};

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [page, setPage] = useState(pageFromLocation);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

  //Hàm login
  useEffect(() => {
    const token = adminAuth.getToken();
    if (!token) { setLoading(false); return; }

    authAPI.me()
      .then(res => {
        const user = res.data;
        const role = user.role || user.Role;
        if (user && role === 'Admin') {
          setAdmin(user);
        } else {
          adminAuth.clearToken();
        }
      })
      .catch(() => {
        adminAuth.clearToken();
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  //Check nút reload, backward
  useEffect(() => {
    const onPopState = () => setPage(pageFromLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  //Hàm set url trang
  const navigate = useCallback((p) => {
    const nextPage = normalizeAdminPage(p);
    setPage(nextPage);
    const nextPath = pagePath(nextPage);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  }, []);

  //Hàm thông báo
  const addToast = useCallback((msg, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  //Hàm logout
  const logout = useCallback(() => {
    adminAuth.clearToken();
    setAdmin(null);
    setPage(DEFAULT_ADMIN_PAGE);
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

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used inside AdminProvider');
  }

  return context;
};
