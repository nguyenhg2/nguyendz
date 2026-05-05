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

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !err.config.url.includes('/auth/me')) {
      localStorage.removeItem('admin_token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const dashboardAPI = {
  getStats: () => api.get('admin/dashboard/stats'),
  getRecentOrders: () => api.get('admin/dashboard/recent-orders'),
  getRevenueChart: () => api.get('admin/dashboard/revenue-chart'),
  getTopProducts: () => api.get('admin/dashboard/top-products'),
};

export const categoryAPI = {
  getAll: (params) => api.get('admin/categories', { params }),
  getById: (id) => api.get(`admin/categories/${id}`),
  create: (data) => api.post('admin/categories', data),
  update: (id, data) => api.put(`admin/categories/${id}`, data),
  remove: (id) => api.delete(`admin/categories/${id}`),
  toggle: (id) => api.patch(`admin/categories/${id}/toggle`),
  uploadImage: (id, formData) => api.post(`admin/categories/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const productAPI = {
  getAll: (params) => api.get('admin/products', { params }),
  getById: (id) => api.get(`admin/products/${id}`),
  create: (data) => api.post('admin/products', data),
  update: (id, data) => api.put(`admin/products/${id}`, data),
  remove: (id) => api.delete(`admin/products/${id}`),
  toggle: (id) => api.patch(`admin/products/${id}/toggle`),
  uploadImage: (id, formData) => api.post(`admin/products/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const orderAPI = {
  getAll: (params) => api.get('admin/orders', { params }),
  getById: (id) => api.get(`admin/orders/${id}`),
  updateStatus: (id, status) => api.patch(`admin/orders/${id}/status`, { status }),
  cancel: (id, reason) => api.patch(`admin/orders/${id}/cancel`, { reason }),
};

export const userAPI = {
  getAll: (params) => api.get('admin/users', { params }),
  getById: (id) => api.get(`admin/users/${id}`),
  toggle: (id) => api.patch(`admin/users/${id}/toggle`),
  update: (id, data) => api.put(`admin/users/${id}`, data),
};

export const reviewAPI = {
  getAll: (params) => api.get('admin/reviews', { params }),
  getById: (id) => api.get(`admin/reviews/${id}`),
  remove: (id) => api.delete(`admin/reviews/${id}`),
};

export const bannerAPI = {
  getAll: () => api.get('admin/banners'),
  getById: (id) => api.get(`admin/banners/${id}`),
  create: (data) => api.post('admin/banners', data),
  update: (id, data) => api.put(`admin/banners/${id}`, data),
  remove: (id) => api.delete(`admin/banners/${id}`),
  toggle: (id) => api.patch(`admin/banners/${id}/toggle`),
  uploadImage: (id, formData) => api.post(`admin/banners/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const contactAPI = {
  getAll: (params) => api.get('admin/contacts', { params }),
  getById: (id) => api.get(`admin/contacts/${id}`),
  markRead: (id) => api.patch(`admin/contacts/${id}/read`),
  remove: (id) => api.delete(`admin/contacts/${id}`),
};

export const reportAPI = {
  revenue: (params) => api.get('admin/reports/revenue', { params }),
  topProducts: (params) => api.get('admin/reports/top-products', { params }),
  orderStats: () => api.get('admin/reports/order-stats'),
};
