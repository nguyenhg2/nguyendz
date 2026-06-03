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

export const readPagedResponse = (data, limit = 10) => {
  const items = Array.isArray(data) ? data : data?.items || [];
  const total = Array.isArray(data) ? data.length : (data?.total ?? items.length);
  const totalPages = data?.totalPages || Math.max(1, Math.ceil(total / limit));

  return { items, total, totalPages };
};
