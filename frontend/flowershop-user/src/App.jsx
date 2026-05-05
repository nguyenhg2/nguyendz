import { useContext } from 'react';
import { AppContext } from './context/AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import { LoginModal, RegisterModal } from './components/AuthModals';
import Home from './pages/Home';
import Cart from './pages/Cart';
import { SearchPage } from './pages/Search';
import { CategoryPage } from './pages/Category';
import { ProductDetailPage } from './pages/ProductDetail';
import { ProfilePage } from './pages/Profile';
import { ContactPage } from './pages/Contact';
import { CheckoutPage } from './pages/Checkout';

function App() {
  const { page, showLogin, showRegister } = useContext(AppContext);

  const renderPage = () => {
    switch(page) {
      case 'home': return <Home />;
      case 'cart': return <Cart />;
      case 'search': return <SearchPage />;
      case 'category': return <CategoryPage />;
      case 'product': return <ProductDetailPage />;
      case 'profile': return <ProfilePage />;
      case 'contact': return <ContactPage />;
      case 'checkout': return <CheckoutPage />;
      default: return <Home />;
    }
  };

  return (
    <>
      {showLogin && <LoginModal />}
      {showRegister && <RegisterModal />}
      <Header />
      {renderPage()}
      <Footer />
    </>
  );
}
export default App;