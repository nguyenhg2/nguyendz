import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5120/api';
export const IMG_URL = BASE.replace('/api', '');
const ADMIN_TOKEN_KEY = 'admin_token';

export const adminAuth = {
  getToken: () => localStorage.getItem(ADMIN_TOKEN_KEY),
  setToken: (token) => localStorage.setItem(ADMIN_TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(ADMIN_TOKEN_KEY),
};

const api = axios.create({
  baseURL: BASE,
  timeout: 10000,
});

api.interceptors.request.use(cfg => {
  const token = adminAuth.getToken();
  if (token) {
    cfg.headers = cfg.headers || {};
    cfg.headers['Authorization'] = 'Bearer ' + token;
  }
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url || '';
    const isLoginRequest = url.includes('/auth/login');

    if (err.response?.status === 401 && !isLoginRequest) {
      adminAuth.clearToken();
      window.location.href = '/login';
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
  getStats: () => api.get('/admin/dashboard/stats'),
  getRecentOrders: () => api.get('/admin/dashboard/recent-orders'),
  getRevenueChart: () => api.get('/admin/dashboard/revenue-chart'),
  getTopProducts: () => api.get('/admin/dashboard/top-products'),
};

const crud = (url) => ({
  getAll: (params) => api.get(url, { params }),
  create: (data) => api.post(url, data),
  update: (id, data) => api.put(`${url}/${id}`, data),
  remove: (id) => api.delete(`${url}/${id}`),
  toggle: (id) => api.patch(`${url}/${id}/toggle`),
});

export const categoryAPI = {
  ...crud('/admin/categories'),
  uploadImage: (id, formData) => api.post(`/admin/categories/${id}/image`, formData),
};

export const productAPI = {
  ...crud('/admin/products'),
  getById: (id) => api.get(`/admin/products/${id}`),
  uploadImages: (id, formData) => api.post(`/admin/products/${id}/images`, formData),
  deleteImage: (id, imageId) => api.delete(`/admin/products/${id}/images/${imageId}`),
  setMainImage: (id, imageId) => api.patch(`/admin/products/${id}/images/${imageId}/set-main`),
};

export const orderAPI = {
  getAll: (params) => api.get('/admin/orders', { params }),
  getById: (id) => api.get(`/admin/orders/${id}`),
  updateStatus: (id, data) => api.patch(`/admin/orders/${id}/status`, data),
  cancel: (id, data) => api.patch(`/admin/orders/${id}/cancel`, data),
};

export const userAPI = {
  getAll: (params) => api.get('/admin/users', { params }),
  toggle: (id) => api.patch(`/admin/users/${id}/toggle`),
};

export const reviewAPI = {
  getAll: (params) => api.get('/admin/reviews', { params }),
  remove: (id) => api.delete(`/admin/reviews/${id}`),
};

export const bannerAPI = {
  ...crud('/admin/banners'),
  uploadImage: (id, formData) => api.post(`/admin/banners/${id}/image`, formData),
};

export const contactAPI = {
  getAll: (params) => api.get('/admin/contacts', { params }),
  getById: (id) => api.get(`/admin/contacts/${id}`),
  remove: (id) => api.delete(`/admin/contacts/${id}`),
};

export const reportAPI = {
  revenue: (params) => api.get('/admin/reports/revenue', { params }),
  topProducts: (params) => api.get('/admin/reports/top-products', { params }),
  orderStats: () => api.get('/admin/reports/order-stats'),
};
