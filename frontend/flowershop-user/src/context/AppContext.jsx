import { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

const parseRoute = () => {
  const path = window.location.pathname.replace(/^\//, '');
  const search = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(search.entries());

  if (!path || path === '/') return { page: 'home', params: {} };

  const parts = path.split('/');
  const page = parts[0];

  if (parts[1]) params.id = parts[1];

  return { page, params };
};

const buildUrl = (page, params = {}) => {
  let url = '/' + page;
  if (params.id) url += '/' + params.id;

  const query = { ...params };
  delete query.id;
  const qs = new URLSearchParams(query).toString();
  if (qs) url += '?' + qs;

  return url;
};

export function AppProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState({});
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const { page, params } = parseRoute();
    setCurrentPage(page);
    setPageParams(params);

    try {
      const saved = localStorage.getItem('cart');
      if (saved) setCart(JSON.parse(saved));
    } catch {
      localStorage.removeItem('cart');
    }

    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch {
      localStorage.removeItem('user');
    }

    const handlePop = () => {
      const { page, params } = parseRoute();
      setCurrentPage(page);
      setPageParams(params);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const navigate = (page, params = {}) => {
    const url = buildUrl(page, params);
    window.history.pushState({}, '', url);
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo(0, 0);
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addToCart = (product, qty = 1) => {
    const id = product.productId || product.id;
    const stock = (product.stockQuantity === null || product.stockQuantity === undefined) ? 999 : product.stockQuantity;

    if (stock === 0) {
      showToast('Sản phẩm đã hết hàng', 'error');
      return;
    }

    const existing = cart.find(i => i.id === id);
    if (existing) {
      const newQty = Math.min(existing.qty + qty, stock);
      if (newQty === existing.qty) {
        showToast('Đã đạt số lượng tối đa trong kho', 'error');
        return;
      }
      setCart(c => c.map(i => i.id === id ? { ...i, qty: newQty } : i));
    } else {
      setCart(c => [...c, {
        id,
        productId: id,
        name: product.productName || product.name,
        imageUrl: product.imageUrl || null,
        price: product.price,
        sale: product.sale || product.discountPrice || null,
        stockQuantity: stock,
        qty: Math.min(qty, stock)
      }]);
    }
    showToast('Đã thêm vào giỏ hàng');
  };

  const updateCart = (id, qty) => {
    if (qty <= 0) {
      setCart(c => c.filter(i => i.id !== id));
    } else {
      setCart(c => c.map(i => {
        if (i.id === id) {
          const maxQty = i.stockQuantity || 999;
          return { ...i, qty: Math.min(qty, maxQty) };
        }
        return i;
      }));
    }
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, i) => {
    const itemPrice = i.sale || i.price;
    return sum + itemPrice * i.qty;
  }, 0);

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const value = {
    currentPage, pageParams, navigate, buildUrl,
    cart, addToCart, updateCart, clearCart, cartTotal, cartCount,
    user, setUser,
    wishlist, setWishlist,
    orders, setOrders,
    toast, showToast,
    showLogin, setShowLogin,
    showRegister, setShowRegister
  };

  return (
    <AppContext.Provider value={value}>
      {children}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
          padding: '12px 24px', borderRadius: 8,
          background: toast.type === 'error' ? '#e74c3c' : '#27ae60',
          color: '#fff', fontSize: 14, fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          animation: 'fadeIn 0.3s'
        }}>
          {toast.msg}
        </div>
      )}
    </AppContext.Provider>
  );
}
