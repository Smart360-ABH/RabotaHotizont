
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { MarketProvider } from './context/MarketContext';
import { initBack4App } from './services/back4app';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { Categories } from './pages/Categories';
import { ProductDetails } from './pages/ProductDetails';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Admin } from './pages/Admin';
import { VendorDashboard } from './pages/VendorDashboard';
import { Login } from './pages/Login';
import { BecomeSeller } from './pages/BecomeSeller';
import { IntroAnimation } from './components/IntroAnimation';
import { Profile } from './pages/Profile';
import { VendorPage } from './pages/VendorPage';
import { Favorites } from './pages/Favorites';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Инициализировать Back4App при загрузке приложения
    initBack4App();
    
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    // if (hasSeenIntro) setShowIntro(false);
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem('hasSeenIntro', 'true');
  };

  return (
    <MarketProvider>
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      <Router>
        <Routes>
          {/* Admin & Vendor Routes */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/vendor" element={<VendorDashboard />} />
          
          {/* Main Routes */}
          <Route path="*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/vendor-page/:id" element={<VendorPage />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/become-seller" element={<BecomeSeller />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
    </MarketProvider>
  );
};

export default App;
