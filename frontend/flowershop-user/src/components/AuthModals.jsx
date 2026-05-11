import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { login as loginApi, register as registerApi } from '../services/api';

export function LoginModal() {
  const {setShowLogin, setShowRegister, setUser, showToast} = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  const login = async () => {
    try {
      const response = await loginApi(email, pass);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      setShowLogin(false);
      showToast('Chào mừng bạn quay lại!');
    
      } catch (error) {
        setErr(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
    }
  };

  return (
    <div className="modal-backdrop" onClick={()=>setShowLogin(false)}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:24,marginBottom:4}}>Đăng nhập</div>
          <div style={{color:'var(--muted)',fontSize:14}}>Chào mừng trở lại Mộng Lan Flower</div>
        </div>
        {err&&<div className="alert alert-error" style={{marginBottom:16}}>{err}</div>}
        <div className="form-group"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@example.com"/></div>
        <div className="form-group"><label>Mật khẩu</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"/></div>
        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'12px',fontSize:16,marginTop:8}} onClick={login}>Đăng nhập</button>
        <div style={{textAlign:'center',marginTop:16,fontSize:14,color:'var(--muted)'}}>
          Chưa có tài khoản? <span style={{color:'var(--rose)',cursor:'pointer',fontWeight:700}} onClick={()=>{setShowLogin(false);setShowRegister(true)}}>Đăng ký ngay</span>
        </div>
      </div>
    </div>
  );
}

export function RegisterModal() {
  const {setShowRegister, setShowLogin, setUser, showToast} = useContext(AppContext);
  const [form, setForm] = useState({name:'',email:'',phone:'',pass:'',confirm:''});
  const [err, setErr] = useState('');
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const register = async () => {
    if (!form.name || !form.email || !form.phone || !form.pass) {
      setErr('Vui lòng điền đầy đủ thông tin'); 
      return;
    }
    if (form.pass !== form.confirm) {
      setErr('Mật khẩu xác nhận không khớp'); 
      return;
    }
    try {
      const userData = {
        FullName: form.name,
        Email: form.email,
        Phone: form.phone,
        Password: form.pass 
      };

      const response = await registerApi(userData);
      setUser(response.data.user); 
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setShowRegister(false);
      showToast('Đăng ký thành công! Chào mừng bạn đến với Mộng Lan');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại sau';
      setErr(errorMsg);
    }
  };

  return (
    <div className="modal-backdrop" onClick={()=>setShowRegister(false)}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:24,marginBottom:4}}>Tạo tài khoản</div>
        </div>
        {err&&<div className="alert alert-error" style={{marginBottom:16}}>{err}</div>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div className="form-group"><label>Họ tên *</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Nguyễn Văn A"/></div>
          <div className="form-group"><label>Số điện thoại *</label><input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="0901234567"/></div>
        </div>
        <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="email@example.com"/></div>
        <div className="form-group"><label>Mật khẩu *</label><input type="password" value={form.pass} onChange={e=>set('pass',e.target.value)} placeholder="Tối thiểu 6 ký tự"/></div>
        <div className="form-group"><label>Xác nhận mật khẩu *</label><input type="password" value={form.confirm} onChange={e=>set('confirm',e.target.value)} placeholder="Nhập lại mật khẩu"/></div>
        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:'12px',fontSize:16,marginTop:4}} onClick={register}>Đăng ký</button>
        <div style={{textAlign:'center',marginTop:16,fontSize:14,color:'var(--muted)'}}>
          Đã có tài khoản? <span style={{color:'var(--rose)',cursor:'pointer',fontWeight:700}} onClick={()=>{setShowRegister(false);setShowLogin(true)}}>Đăng nhập</span>
        </div>
      </div>
    </div>
  );
}
