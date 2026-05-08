import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { getCategories } from '../services/api';

export default function Footer() {
  const { navigate } = useContext(AppContext);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const response = await getCategories();
        const data = response.data.items || response.data || [];
        setCategories(data);
      } catch (error) {
        setCategories([]);
      }
    };
    fetchCats();
  }, []);

  return (
    <footer style={{ background: '#2d2017', color: '#d4b8a8', padding: '48px 0 24px', marginTop: 60 }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 32, marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 22, color: '#f7d6df', marginBottom: 12 }}>Mộng Lan Flower</div>
            <p style={{ fontSize: 13, lineHeight: 1.8 }}>Shop hoa tươi cao cấp – Nâng niu từng bông hoa, trân trọng từng cảm xúc.</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              {['fb', 'ig', 'yt'].map(s => (
                <div key={s} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14 }}>
                  {s === 'fb' ? 'f' : s === 'ig' ? 'ig' : 'yt'}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#f7d6df', marginBottom: 14, textTransform: 'uppercase', letterSpacing: .5 }}>Danh mục</div>
            {categories.map(c => {
              const cId = c.categoryId || c.id;
              const cName = c.categoryName || c.name;
              return (
                <div
                  key={cId}
                  onClick={() => navigate('category', { id: cId })}
                  style={{ cursor: 'pointer', padding: '4px 0', fontSize: 13, transition: 'color .2s' }}
                  onMouseEnter={e => e.target.style.color = '#f7d6df'}
                  onMouseLeave={e => e.target.style.color = ''}
                >
                  {cName}
                </div>
              );
            })}
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#f7d6df', marginBottom: 14, textTransform: 'uppercase', letterSpacing: .5 }}>Thông tin</div>
            {['Về chúng tôi', 'Chính sách giao hàng', 'Chính sách đổi trả', 'Hướng dẫn đặt hàng'].map(t => (
              <div key={t} style={{ cursor: 'pointer', padding: '4px 0', fontSize: 13 }}>{t}</div>
            ))}
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#f7d6df', marginBottom: 14, textTransform: 'uppercase', letterSpacing: .5 }}>Liên hệ</div>
            <div style={{ fontSize: 13, lineHeight: 2 }}>
              <div>123 Đường Hoa Mai, Q.1, TP.HCM</div>
              <div>0901 234 567</div>
              <div>hello@monglan.vn</div>
              <div>7:00 – 21:00 mỗi ngày</div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 20, textAlign: 'center', fontSize: 12, color: '#9a7a68' }}>
          2026 Mộng Lan Flower. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
}
