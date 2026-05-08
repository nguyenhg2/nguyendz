import { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

const parseRoute = () => {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const params = new URLSearchParams(window.location.search);
  const [section, id] = path.split('/');

  if (!path) return { page: 'home', params: {} };
  if (section === 'cart') return { page: 'cart', params: {} };
  if (section === 'checkout') return { page: 'checkout', params: {} };
  if (section === 'profile') return { page: 'profile', params: {} };
  if (section === 'contact') return { page: 'contact', params: {} };
  if (section === 'search') return { page: 'search', params: { q: params.get('q') || '' } };
  if (section === 'category') {
    const cat = id || params.get('cat') || '';
    return {
      page: 'category',
      params: {
        cat: cat ? Number(cat) : '',
        sort: params.get('sort') || undefined,
        filter: params.get('filter') || undefined,
      }
    };
  }
  if (section === 'product' && id) return { page: 'product', params: { id: Number(id) } };

  return { page: 'home', params: {} };
};

const buildUrl = (page, params = {}) => {
  const query = new URLSearchParams();

  switch (page) {
    case 'cart': return '/cart';
    case 'checkout': return '/checkout';
    case 'profile': return '/profile';
    case 'contact': return '/contact';
    case 'search':
      if (params.q) query.set('q', params.q);
      return `/search${query.toString() ? `?${query}` : ''}`;
    case 'category':
      if (params.sort) query.set('sort', params.sort);
      if (params.filter) query.set('filter', params.filter);
      return `/category${params.cat ? `/${params.cat}` : ''}${query.toString() ? `?${query}` : ''}`;
    case 'product':
      return params.id ? `/product/${params.id}` : '/';
    default:
      return '/';
  }
};

export function AppProvider({ children }) {
  const initialRoute = parseRoute();
  const [page, setPage] = useState(initialRoute.page);
  const [pageParams, setPageParams] = useState(initialRoute.params);
  const [cart, setCart] = useState(() => {
    try { const s = localStorage.getItem('flowershop_cart'); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });
  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem('flowershop_user'); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });
  const [wishlist, setWishlist] = useState(() => {
    try { const s = localStorage.getItem('flowershop_wishlist'); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem('flowershop_user', JSON.stringify(user));
    else localStorage.removeItem('flowershop_user');
  }, [user]);
  useEffect(() => { localStorage.setItem('flowershop_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('flowershop_wishlist', JSON.stringify(wishlist)); }, [wishlist]);

  useEffect(() => {
    const onPopState = () => {
      const route = parseRoute();
      setPage(route.page);
      setPageParams(route.params);
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (p, params = {}) => {
    setPage(p);
    setPageParams(params);
    const url = buildUrl(p, params);
    if (`${window.location.pathname}${window.location.search}` !== url) {
      window.history.pushState({}, '', url);
    }
    window.scrollTo(0, 0);
  };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const addToCart = (product, qty = 1) => {
    const id = product.productId || product.id;
    const stock = product.stockQuantity === null || product.stockQuantity === undefined ? 999 : product.stockQuantity;

    if (stock === 0) {
      showToast('Sản phẩm đã hết hàng');
      return;
    }

    setCart(c => {
      const ex = c.find(i => i.id === id);
      if (ex) {
        const newQty = Math.min(ex.qty + qty, stock);
        if (newQty === ex.qty) return c;
        return c.map(i => i.id === id ? { ...i, qty: newQty } : i);
      }
      return [...c, {
        id,
        productId: id,
        name: product.productName || product.name,
        imageUrl: product.imageUrl || product.img || null,
        price: product.price,
        sale: product.sale || product.discountPrice || null,
        stockQuantity: stock,
        qty: Math.min(qty, stock)
      }];
    });
    showToast('Đã thêm vào giỏ hàng');
  };

  const updateCart = (id, qty) => {
    if (qty <= 0) { setCart(c => c.filter(i => i.id !== id)); return; }
    setCart(c => c.map(i => {
      if (i.id !== id) return i;
      const maxQty = i.stockQuantity || 999;
      return { ...i, qty: Math.min(qty, maxQty) };
    }));
  };
  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((s, i) => s + (i.sale || i.price) * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <AppContext.Provider value={{
      page, navigate, pageParams, cart, cartCount, cartTotal, addToCart, updateCart, clearCart,
      user, setUser, wishlist, setWishlist, orders, setOrders, showToast,
      showLogin, setShowLogin, showRegister, setShowRegister
    }}>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </AppContext.Provider>
  );
}
