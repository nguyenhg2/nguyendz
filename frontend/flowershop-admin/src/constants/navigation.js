export const DEFAULT_ADMIN_PAGE = 'dashboard';

export const MENU_ITEMS = [
  { section: 'Tổng quan' },
  { key: 'dashboard', label: 'Dashboard', title: 'Dashboard' },

  { section: 'Nội dung' },
  { key: 'categories', label: 'Danh mục', title: 'Quản lý danh mục' },
  { key: 'products', label: 'Sản phẩm', title: 'Quản lý sản phẩm' },
  { key: 'banners', label: 'Banner', title: 'Quản lý banner' },

  { section: 'Kinh doanh' },
  { key: 'orders', label: 'Đơn hàng', title: 'Quản lý đơn hàng' },
  { key: 'customers', label: 'Khách hàng', title: 'Quản lý khách hàng' },
  { key: 'reviews', label: 'Đánh giá', title: 'Quản lý đánh giá' },

  { section: 'Hỗ trợ' },
  { key: 'contacts', label: 'Liên hệ', title: 'Quản lý liên hệ' },
  { key: 'reports', label: 'Báo cáo', title: 'Báo cáo thống kê' },
];

export const ADMIN_PAGES = MENU_ITEMS.filter(item => item.key).map(item => item.key);

export const PAGE_TITLES = Object.fromEntries(
  MENU_ITEMS.filter(item => item.key).map(item => [item.key, item.title || item.label])
);

//Kiểm tra page
export const normalizeAdminPage = (page) => (
  ADMIN_PAGES.includes(page) ? page : DEFAULT_ADMIN_PAGE
);

//Trả về URL Page
export const pagePath = (page) => `/${normalizeAdminPage(page)}`;
