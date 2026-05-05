import React, { useEffect } from 'react';
import { useAdmin } from './context/AdminContext';
import { authAPI } from './services/api';

import Sidebar from './components/Sidebar';
import Topbar  from './components/Topbar';

import LoginPage      from './pages/LoginPage';
import DashboardPage  from './pages/DashboardPage';
import CategoriesPage from './pages/CategoriesPage';
import ProductsPage   from './pages/ProductsPage';
import OrdersPage     from './pages/OrdersPage';
import CustomersPage  from './pages/CustomersPage';
import ReviewsPage    from './pages/ReviewsPage';
import BannersPage    from './pages/BannersPage';
import ContactsPage   from './pages/ContactsPage';
import ReportsPage    from './pages/ReportsPage';

const PAGE_MAP = {
  dashboard:  <DashboardPage/>,
  categories: <CategoriesPage/>,
  products:   <ProductsPage/>,
  orders:     <OrdersPage/>,
  customers:  <CustomersPage/>,
  reviews:    <ReviewsPage/>,
  banners:    <BannersPage/>,
  contacts:   <ContactsPage/>,
  reports:    <ReportsPage/>,
};

export default function App() {
  const { admin, setAdmin, page, navigate, addToast } = useAdmin();

  // Auto-restore session from stored token
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;
    authAPI.me()
      .then(res => {
        const user = res.data;
        if (user?.Role === 'Admin') {
          setAdmin(user);
          navigate('dashboard');
        } else {
          localStorage.removeItem('admin_token');
        }
      })
      .catch(() => localStorage.removeItem('admin_token'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Not logged in → show login
  if (!admin) return <LoginPage/>;

  console.log('Rendering page:', page);

  return (
    <div className="admin-layout">
      <Sidebar/>
      <div className="admin-main">
        <Topbar/>
        <main className="admin-content">
          {PAGE_MAP[page] || <DashboardPage/>}
        </main>
      </div>
    </div>
  );
}
