import { IMG_URL } from '../services/api';

export const formatNumber = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

export const formatCurrency = (value) => `${formatNumber(value)}đ`;

export const formatDate = (value) => (
  value ? new Date(value).toLocaleDateString('vi-VN') : '-'
);

export const imageSrc = (url) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${IMG_URL}${url}`;
};

export const readPagedResponse = (data) => {
  const items = Array.isArray(data) ? data : data?.items || [];
  const total = Array.isArray(data) ? data.length : (data?.total ?? items.length);
  const totalPages = Array.isArray(data) ? 1 : data?.totalPages;

  return { items, total, totalPages };
};

export const cleanParams = (params) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
);

export const boolParam = (value) => (value === '' ? undefined : value === 'true');
