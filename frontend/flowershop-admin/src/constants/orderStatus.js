export const ORDER_STATUS = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export const ORDER_STATUS_OPTIONS = Object.values(ORDER_STATUS).map(status => ({
  value: status,
  label: status,
}));

const STATUS_ALIASES = {
  Pending: ORDER_STATUS.pending,
  Confirmed: ORDER_STATUS.confirmed,
  Shipping: ORDER_STATUS.shipping,
  Completed: ORDER_STATUS.completed,
  Cancelled: ORDER_STATUS.cancelled,
};

const NEXT_STATUS = {
  [ORDER_STATUS.pending]: ORDER_STATUS.confirmed,
  [ORDER_STATUS.confirmed]: ORDER_STATUS.shipping,
  [ORDER_STATUS.shipping]: ORDER_STATUS.completed,
};

export const ORDER_STATUS_COLOR = {
  [ORDER_STATUS.pending]: '#f39c12',
  [ORDER_STATUS.confirmed]: '#3498db',
  [ORDER_STATUS.shipping]: '#9b59b6',
  [ORDER_STATUS.completed]: '#27ae60',
  [ORDER_STATUS.cancelled]: '#e74c3c',
};

export const ORDER_STATUS_BADGE = {
  [ORDER_STATUS.pending]: 'badge-pending',
  [ORDER_STATUS.confirmed]: 'badge-confirmed',
  [ORDER_STATUS.shipping]: 'badge-shipping',
  [ORDER_STATUS.completed]: 'badge-done',
  [ORDER_STATUS.cancelled]: 'badge-cancelled',
};

export const normalizeOrderStatus = (status) => STATUS_ALIASES[status] || status || '';

export const orderStatusLabel = (status) => normalizeOrderStatus(status) || '-';

export const getNextOrderStatus = (status) => NEXT_STATUS[normalizeOrderStatus(status)] || null;

export const isCompletedOrder = (order) => normalizeOrderStatus(order?.status) === ORDER_STATUS.completed;

export const canCancelOrder = (order) => {
  const status = normalizeOrderStatus(order?.status);
  return status !== ORDER_STATUS.completed && status !== ORDER_STATUS.cancelled;
};
