import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://localhost:7242/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('admin_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Global error handler
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  login:  (data) => api.post('/auth/login', data),          
  me:     ()     => api.get('/auth/me'),                    
  logout: ()     => api.post('/auth/logout'),
};

export const dashboardAPI = {
  // GET /dashboard/stats → { totalOrders, todayOrders, monthRevenue, todayRevenue, totalProducts, totalCustomers }
  getStats:       () => api.get('admin/dashboard/stats'),
  // GET /dashboard/recent-orders → Orders[] (top 10)
  getRecentOrders:() => api.get('admin/dashboard/recent-orders'),
  // GET /dashboard/revenue-chart → [{ month, revenue }]
  getRevenueChart:() => api.get('admin/dashboard/revenue-chart'),
  // GET /dashboard/top-products → Products[] (top 10 bán chạy)
  getTopProducts: () => api.get('admin/dashboard/top-products'),
};

// ── Categories ────────────────────────────────────────
// Table: CATEGORIES (CategoryId, CategoryName, Description, ImageUrl, IsActive, SortOrder, CreatedDate)
export const categoryAPI = {
  getAll:   (params) => api.get('admin/categories', { params }),             // ?includeInactive=true
  getById:  (id)     => api.get(`admin/categories/${id}`),
  create:   (data)   => api.post('admin/categories', data),
  update:   (id, data) => api.put(`admin/categories/${id}`, data),
  remove:   (id)     => api.delete(`admin/categories/${id}`),               // soft delete: IsActive=0
  toggle:   (id)     => api.patch(`admin/categories/${id}/toggle`),         // flip IsActive
  uploadImage: (id, formData) => api.post(`admin/categories/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ── Products ──────────────────────────────────────────
// Table: PRODUCTS (ProductId, ProductName, Description, Price, DiscountPrice, ImageUrl,
//                  CategoryId(FK), StockQuantity, SoldQuantity, IsActive, IsFeatured, CreatedDate, UpdatedDate)
export const productAPI = {
  getAll:   (params) => api.get('admin/products', { params }),
  // params: { page, limit, search, categoryId, isActive, isFeatured, sortBy }
  getById:  (id)     => api.get(`admin/products/${id}`),
  create:   (data)   => api.post('admin/products', data),
  update:   (id, data) => api.put(`admin/products/${id}`, data),
  remove:   (id)     => api.delete(`admin/products/${id}`),
  toggle:   (id)     => api.patch(`admin/products/${id}/toggle`),
  uploadImage: (id, formData) => api.post(`admin/products/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ── Orders ────────────────────────────────────────────
// Table: ORDERS (OrderId, UserId(FK), OrderDate, TotalAmount, Status, ReceiverName,
//                ReceiverPhone, ReceiverAddress, Note, PaymentMethod)
// Table: ORDERDETAILS (OrderDetailId, OrderId(FK), ProductId(FK), Quantity, UnitPrice, Subtotal)
export const orderAPI = {
  getAll:   (params) => api.get('admin/orders', { params }),
  // params: { page, limit, status, search, fromDate, toDate }
  getById:  (id)     => api.get(`admin/orders/${id}`),           // includes OrderDetails + Product info
  updateStatus: (id, status) => api.patch(`admin/orders/${id}/status`, { status }),
  // status values: 'Chờ xử lý' | 'Đã xác nhận' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy'
  cancel:   (id, reason) => api.patch(`admin/orders/${id}/cancel`, { reason }),
};

// ── Users / Customers ─────────────────────────────────
// Table: USERS (UserId, FullName, Email, Phone, PasswordHash, Address, Avatar, Role, IsActive, CreatedDate)
export const userAPI = {
  getAll:   (params) => api.get('admin/users', { params }),
  // params: { page, limit, search, role, isActive }
  getById:  (id)     => api.get(`admin/users/${id}`),            // includes order history
  toggle:   (id)     => api.patch(`admin/users/${id}/toggle`),   // lock/unlock IsActive
  update:   (id, data) => api.put(`admin/users/${id}`, data),
};

// ── Reviews ───────────────────────────────────────────
// Table: REVIEWS (ReviewId, ProductId(FK), UserId(FK), Rating, Comment, CreatedDate)
export const reviewAPI = {
  getAll:   (params) => api.get('admin/reviews', { params }),
  // params: { page, limit, productId, userId, minRating, maxRating }
  getById:  (id)     => api.get(`admin/reviews/${id}`),
  remove:   (id)     => api.delete(`admin/reviews/${id}`),
};

// ── Banners ───────────────────────────────────────────
// Table: BANNERS (BannerId, Title, ImageUrl, LinkUrl, IsActive, SortOrder)
export const bannerAPI = {
  getAll:   ()       => api.get('admin/banners'),
  getById:  (id)     => api.get(`admin/banners/${id}`),
  create:   (data)   => api.post('admin/banners', data),
  update:   (id, data) => api.put(`admin/banners/${id}`, data),
  remove:   (id)     => api.delete(`admin/banners/${id}`),
  toggle:   (id)     => api.patch(`admin/banners/${id}/toggle`),  // flip IsActive
  uploadImage: (id, formData) => api.post(`admin/banners/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ── Contacts ──────────────────────────────────────────
// Table: CONTACTS (ContactId, FullName, Email, Phone, Subject, Message, IsRead, CreatedDate)
export const contactAPI = {
  getAll:   (params) => api.get('admin/contacts', { params }),  // params: { isRead }
  getById:  (id)     => api.get(`admin/contacts/${id}`),
  markRead: (id)     => api.patch(`admin/contacts/${id}/read`),
  remove:   (id)     => api.delete(`admin/contacts/${id}`),
};

// ── Reports ───────────────────────────────────────────
export const reportAPI = {
  revenue:     (params) => api.get('admin/reports/revenue', { params }),  // { year, month }
  topProducts: (params) => api.get('admin/reports/top-products', { params }),
  orderStats:  ()       => api.get('admin/reports/order-stats'),
};
