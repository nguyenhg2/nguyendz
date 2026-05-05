import React, { createContext, useContext, useState, useCallback } from 'react';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [admin, setAdmin]   = useState(null);   // logged-in admin user
  const [page, setPage]     = useState('login'); // current page
  const [toasts, setToasts] = useState([]);

  const navigate = useCallback((p) => setPage(p), []);

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
    setPage('login');
  }, []);

  return (
    <AdminContext.Provider value={{ admin, setAdmin, page, navigate, addToast, logout }}>
      {children}
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="toast">
          {toasts.map(t => (
            <div key={t.id} className={`toast-item toast-${t.type}`}>
              <span>{t.type === 'success' ? '✅' : '❌'}</span>
              {t.msg}
            </div>
          ))}
        </div>
      )}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
