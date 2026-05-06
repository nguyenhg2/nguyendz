import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'https://localhost:7242/api';
export const IMG_URL = BASE.replace('/api', '');

const api = axios.create({
  baseURL: BASE,
  timeout: 10000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  if ((config.method === 'post' || config.method === 'put') && !config.headers?.['Content-Type']) {
    config.headers = config.headers || {};
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('flowershop_user');
    }
    return Promise.reject(error);
  }
);

export default api;

export const getCategories = () => api.get('/categories');
export const getBanners = () => api.get('/banners');
export const getProducts = (params) => api.get('/product', { params });
export const getProductDetail = (id) => api.get(`/product/${id}`);

export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (data) => api.post('/auth/register', {
  fullName: data.fullName || data.FullName || data.name || data.Name,
  email: data.email || data.Email,
  phone: data.phone || data.Phone,
  password: data.password || data.Password,
});
export const getMe = () => api.get('/auth/me');

export const createOrder = (data) => api.post('/orders', data);
export const getMyOrders = () => api.get('/orders/me');
export const submitReview = (data) => api.post('/reviews', data);
export const sendContact = (data) => api.post('/contacts', {
  fullName: data.fullName || data.name || data.FullName,
  email: data.email || data.Email,
  phone: data.phone || data.Phone,
  subject: data.subject || data.Subject,
  message: data.message || data.Message,
});
