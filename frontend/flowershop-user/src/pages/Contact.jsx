import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { sendContact } from '../services/api';

export function ContactPage() {
  const { showToast } = useContext(AppContext);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      showToast('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    setLoading(true);
    try {
      await sendContact(form);
      setSent(true);
      showToast('Tin nhắn của bạn đã được gửi đi!');
    } catch {
      showToast('Gửi tin nhắn thất bại. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div style={{ background: 'var(--warm)', padding: '28px 0', marginBottom: 40 }}>
        <div className="container"><div style={{ fontFamily: 'Playfair Display,serif', fontSize: 28 }}>Liên hệ với chúng tôi</div></div>
      </div>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        <div>
          <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 22, marginBottom: 20 }}>Thông tin shop</div>
          {[
            ['ĐC', 'Địa chỉ', '123 Đường Hoa Mai, Phường Bến Nghé, Quận 1, TP.HCM'],
            ['ĐT', 'Điện thoại', '0901 234 567 (Hỗ trợ 7:00 - 21:00)'],
            ['@', 'Email', 'hello@monglan.vn'],
            ['Giờ', 'Giờ làm việc', 'Thứ 2 - Chủ nhật: 7:00 - 21:00'],
            ['Ship', 'Giao hàng', 'Nội thành TP.HCM, giao trong 2-4 giờ']
          ].map(([i, l, v]) => (
            <div key={l} style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--rose-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{i}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .4, marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 15 }}>{v}</div>
              </div>
            </div>
          ))}
          <div style={{ background: 'var(--warm)', borderRadius: 16, padding: 20, marginTop: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Bản đồ</div>
            <div style={{ background: '#d4e8da', borderRadius: 12, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)', fontWeight: 700, fontSize: 14 }}>
              Hoa Mộng Lan - Q.1, TP.HCM
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--border)', padding: 32 }}>
          <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 22, marginBottom: 6 }}>Gửi tin nhắn</div>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>Chúng tôi sẽ phản hồi trong vòng 2 giờ</div>
          
          {sent ? (
            <div className="alert alert-success" style={{ textAlign: 'center', padding: 30 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Gửi thành công!</div>
              <div style={{ marginTop: 8, fontSize: 14 }}>Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.</div>
              <button 
                className="btn btn-outline" 
                style={{ marginTop: 20 }} 
                onClick={() => setSent(false)}
              >
                Gửi tin nhắn mới
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group">
                  <label>Họ tên *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nguyễn Văn A" />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0901 234 567" />
                </div>
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
              </div>
              <div className="form-group">
                <label>Chủ đề</label>
                <select value={form.subject} onChange={e => set('subject', e.target.value)}>
                  <option value="">Chọn chủ đề...</option>
                  <option value="Tư vấn sản phẩm">Tư vấn sản phẩm</option>
                  <option value="Đặt hàng số lượng lớn">Đặt hàng số lượng lớn</option>
                  <option value="Khiếu nại / Phản hồi">Khiếu nại / Phản hồi</option>
                  <option value="Hợp tác kinh doanh">Hợp tác kinh doanh</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nội dung *</label>
                <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={4} placeholder="Nhập nội dung tin nhắn..." />
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 16 }} 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi tin nhắn'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
