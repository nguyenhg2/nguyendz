import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { getProducts, getCategories } from '../services/api'; 
import ProductCard from '../components/ProductCard';

export function CategoryPage() {
  const { pageParams, navigate } = useContext(AppContext);
  
  // State quản lý dữ liệu từ API
  const [categories, setCategories] = useState([]); 
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // State quản lý phân trang và lọc (Đồng bộ với Backend)
  const [sort, setSort] = useState(pageParams.sort || 'newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const PER_PAGE = 12; // Số lượng sản phẩm trên mỗi trang
  const cat = pageParams.cat; // ID danh mục lấy từ URL thông qua Context

  // 1. Lấy danh sách danh mục hoa khi component khởi tạo
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        // Backend trả về dạng { items: [...], totalItems: x }
        const data = response.data.items || response.data || [];
        setCategories(data);
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // 2. Lấy danh sách sản phẩm theo Category, Sort và Page
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Gửi tham số lên Server để thực hiện Skip/Take trong SQL
        const response = await getProducts({ 
          cat, 
          sort, 
          page: currentPage, 
          pageSize: PER_PAGE 
        });

        // Backend trả về object: { items: [], totalPages: x, totalItems: y }
        const { items, totalPages: tPages, totalItems: tItems } = response.data;
        
        setProducts(items || []);
        setTotalPages(tPages || 1);
        setTotalItems(tItems || 0);
      } catch (error) {
        console.error("Lỗi khi lấy sản phẩm:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [cat, sort, currentPage]); 

  // Tìm thông tin danh mục hiện tại để hiển thị tiêu đề (Sử dụng Optional Chaining để an toàn)
  const catInfo = Array.isArray(categories) 
    ? categories.find(c => (c.id || c.categoryId) === cat) 
    : null;

  return (
    <div className="page">
      {/* Banner Tiêu đề Trang */}
      <div style={{ background: 'var(--warm)', padding: '28px 0', marginBottom: 28 }}>
        <div className="container">
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('home')}>Trang chủ</span> › {catInfo ? (catInfo.name || catInfo.categoryName) : 'Tất cả sản phẩm'}
          </div>
          <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28 }}>
            {catInfo ? `🌸 ${catInfo.name || catInfo.categoryName}` : '🌸 Tất cả sản phẩm'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
            {loading ? 'Đang tải...' : `${totalItems} sản phẩm`}
          </div>
        </div>
      </div>

      <div className="container" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 28, alignItems: 'start' }}>
        
        {/* Sidebar: Danh mục hoa */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: 20, position: 'sticky', top: 80 }}>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>🔽 Danh mục</div>
          <div>
            {Array.isArray(categories) && categories.map(c => {
              const cId = c.id || c.categoryId;
              const cName = c.name || c.categoryName;
              return (
                <div key={cId} 
                  onClick={() => { 
                    navigate('category', { cat: cId }); 
                    setCurrentPage(1); // Reset về trang 1 khi đổi loại hoa
                  }} 
                  style={{ 
                    padding: '8px 12px', 
                    borderRadius: 8, 
                    cursor: 'pointer', 
                    fontSize: 14, 
                    background: cat === cId ? 'var(--rose-light)' : '', 
                    color: cat === cId ? 'var(--rose)' : 'var(--text)', 
                    fontWeight: cat === cId ? 700 : 400, 
                    marginBottom: 2 
                  }}>
                  {cat === cId ? '●' : '○'} {cName}
                </div>
              );
            })}
          </div>
        </div>

        {/* Khu vực hiển thị sản phẩm */}
        <div>
          {/* Thanh Sắp xếp (Sorting) */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Sắp xếp:</span>
            {[
              ['newest', 'Mới nhất'], 
              ['price_asc', 'Giá ↑'], 
              ['price_desc', 'Giá ↓'], 
              ['sold', 'Bán chạy']
            ].map(([v, l]) => (
              <button key={v} className="tag" 
                onClick={() => { setSort(v); setCurrentPage(1); }}
                style={{ 
                  background: sort === v ? 'var(--rose)' : 'var(--warm)', 
                  color: sort === v ? '#fff' : 'var(--muted)', 
                  padding: '6px 14px', 
                  border: 'none', 
                  borderRadius: 20, 
                  cursor: 'pointer', 
                  fontSize: 13, 
                  fontWeight: 600,
                  transition: 'all .2s'
                }}>
                {l}
              </button>
            ))}
          </div>

          {/* Danh sách Product Cards */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>Đang tải hoa tươi...</div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
              Không tìm thấy sản phẩm phù hợp.
            </div>
          ) : (
            <>
              <div className="grid-4">
                {products.map(p => (
                  <ProductCard key={p.productId || p.id} p={p} />
                ))}
              </div>
              
              {/* Thanh Điều hướng Phân trang */}
              {totalPages > 1 && (
                <div className="pagination" style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 8 }}>
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo(0,0); }}
                    className="page-btn"
                  >
                    Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} 
                      className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`} 
                      onClick={() => { 
                        setCurrentPage(i + 1); 
                        window.scrollTo(0, 0); 
                      }}>
                      {i + 1}
                    </button>
                  ))}

                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo(0,0); }}
                    className="page-btn"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}