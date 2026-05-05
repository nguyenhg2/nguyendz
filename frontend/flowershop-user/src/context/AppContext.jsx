import { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export function AppProvider({children}) {
  const [page, setPage] = useState('home');
  const [pageParams, setPageParams] = useState({});
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

  const navigate = (p, params={}) => { setPage(p); setPageParams(params); window.scrollTo(0,0); };
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null), 2500); };

  // ← FIX: normalize id và imageUrl khi thêm vào giỏ
  const addToCart = (product, qty=1) => {
    const id = product.productId || product.id;
    setCart(c => {
      const ex = c.find(i => i.id === id);
      if (ex) return c.map(i => i.id === id ? {...i, qty: i.qty + qty} : i);
      return [...c, {
        id,
        productId: id,
        name: product.productName || product.name,
        imageUrl: product.imageUrl || product.img || null,
        price: product.price,
        sale: product.sale || product.discountPrice || null,
        qty
      }];
    });
    showToast('Đã thêm vào giỏ hàng');
  };

  const updateCart = (id, qty) => {
    if (qty <= 0) { setCart(c => c.filter(i => i.id !== id)); return; }
    setCart(c => c.map(i => i.id === id ? {...i, qty} : i));
  };
  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((s,i) => s + (i.sale || i.price) * i.qty, 0);
  const cartCount = cart.reduce((s,i) => s + i.qty, 0);

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
