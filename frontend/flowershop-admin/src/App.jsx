import React from 'react';
import { useAdmin } from './context/AdminContext';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CategoriesPage from './pages/CategoriesPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import CustomersPage from './pages/CustomersPage';
import ReviewsPage from './pages/ReviewsPage';
import BannersPage from './pages/BannersPage';
import ContactsPage from './pages/ContactsPage';
import ReportsPage from './pages/ReportsPage';

const PAGE_MAP = {
  dashboard: DashboardPage,
  categories: CategoriesPage,
  products: ProductsPage,
  orders: OrdersPage,
  customers: CustomersPage,
  reviews: ReviewsPage,
  banners: BannersPage,
  contacts: ContactsPage,
  reports: ReportsPage,
};

export default function App() {
  const { admin, page } = useAdmin();

  if (!admin) return <LoginPage />;

  const PageComponent = PAGE_MAP[page] || DashboardPage;

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <Topbar />
        <main className="admin-content">
          <PageComponent />
        </main>
      </div>
    </div>
  );
}
