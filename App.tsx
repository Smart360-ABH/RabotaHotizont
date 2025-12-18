
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { MarketProvider } from './context/MarketContext';
import { UserProvider } from './context/UserContext';
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
import { initializeParse, restoreSession } from './services/back4app';
import { TestBack4App } from './components/TestBack4App';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro');
    // if (hasSeenIntro) setShowIntro(false);

    // Debug: Check environment variables
    console.log('🔍 DEBUG: Checking environment variables in App.tsx');
    console.log('typeof __VITE_PARSE_APP_ID__:', typeof (globalThis as any).__VITE_PARSE_APP_ID__);
    console.log('typeof __VITE_PARSE_REST_KEY__:', typeof (globalThis as any).__VITE_PARSE_REST_KEY__);

    // Initialize Parse/Back4App if environment variables are set
    initializeParse();

    // Restore user session from localStorage if available
    // On initial load we don't want to clear localStorage or emit sessionExpired event
    // because that would immediately navigate to /login and remove the saved user.
    restoreSession({ clearLocalOnFail: false, emitEventOnFail: false })
      .then((restored) => {
        if (restored) {
          console.log('✅ User session restored successfully');
        } else {
          console.log('ℹ️ No valid session to restore (preserving local copy for offline use)');
        }
      })
      .catch((e) => {
        console.error('Error during session restoration:', e);
      })
      .finally(() => {
        // Mark that initial load is complete (don't show alert on session expiry during first load)
        setIsFirstLoad(false);
      });

    // Listen for session expiration events (when server returns 403)
    const handleSessionExpired = (event: any) => {
      // Only react to sessionExpired after initial load. If the event happens during
      // initial restore we suppressed emission; but guard here as extra safety.
      if (!isFirstLoad) {
        const message = event.detail?.message || 'Ваша сессия истекла. Пожалуйста, войдите снова.';
        alert(message);
        // Note: localStorage is already cleaned up by notifySessionExpired().
        // Navigate user to login page so they can re-authenticate.
        try {
          // We use HashRouter; set hash to navigate to /login
          if (typeof window !== 'undefined') window.location.hash = '#/login';
        } catch (e) { }
      } else {
        console.info('[App] sessionExpired occurred during initial load — ignoring navigation');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('sessionExpired', handleSessionExpired);
      return () => {
        window.removeEventListener('sessionExpired', handleSessionExpired);
      };
    }
  }, [isFirstLoad]);

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem('hasSeenIntro', 'true');
  };

  return (
    <UserProvider>
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
                  <Route path="/test-back4app" element={<TestBack4App />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </Router>
      </MarketProvider>
    </UserProvider>
  );
};

export default App;
