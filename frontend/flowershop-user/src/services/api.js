import axios from 'axios';

const API_URL = 'https://localhost:7242/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const register = (userData) => {
  return api.post('/auth/register', userData);
};

export const getCategories = () => {
  return api.get('/categories');
};

export const getProducts = (params) => {
  return api.get('/product', { params });
};

export const getProductDetail = (id) => {
  return api.get(`/product/${id}`);
};

export const createOrder = (orderData) => {
  return api.post('/orders', orderData);
};

export const getMyOrders = () => {
  return api.get('/orders/me');
};

export const submitReview = (reviewData) => {
  return api.post('/reviews', reviewData);
};

export const sendContact = (contactData) => {
  return api.post('/contact', contactData);
};

export const getBanners = () => {
  return api.get('/banners'); 
};

export default api;