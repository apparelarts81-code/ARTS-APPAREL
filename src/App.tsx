import React, { useState, useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageProvider';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/layout/Header';
import { AnnouncementBar } from './components/layout/AnnouncementBar';
import { Footer } from './components/layout/Footer';
import { WhatsAppButton } from './components/layout/WhatsAppButton';
import { AIAssistantWidget } from './components/ai/AIAssistantWidget';
import { CartDrawer } from './components/store/CartDrawer';
import { AppRoutes } from './routes';
import { isConfigMissing } from './lib/supabase';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// First visit intro splash animation per Design Brief
function IntroSplash({ onFinish }: { onFinish: () => void }) {
  const [stage, setStage] = useState<'ring' | 'title' | 'fadeout'>('ring');

  useEffect(() => {
    const t1 = setTimeout(() => setStage('title'), 500);
    const t2 = setTimeout(() => setStage('fadeout'), 1200);
    const t3 = setTimeout(() => onFinish(), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <div
      onClick={onFinish}
      className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center cursor-pointer transition-opacity duration-400 ${
        stage === 'fadeout' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Skip intro animation"
    >
      <div className="relative flex flex-col items-center justify-center gap-4">
        {/* Animated Crosshair Ring */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-neutral-700 animate-spin [animation-duration:4s]" />
          <div className="absolute inset-2 rounded-full border border-dashed border-[#E31B23]" />
          <div className="w-2.5 h-2.5 bg-[#E31B23] rounded-full animate-ping" />
          <span className="font-serif font-black text-2xl text-white">A</span>
        </div>

        {/* Fading in brand text */}
        <div
          className={`flex flex-col items-center transition-all duration-500 transform ${
            stage === 'title' || stage === 'fadeout'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2'
          }`}
        >
          <span className="font-serif font-black tracking-wider text-2xl text-white">
            <span className="text-[#E31B23]">ARTS</span> APPAREL
          </span>
          <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 mt-1">
            Sharp Tailoring, Locked On Target
          </span>
        </div>
      </div>
      <span className="absolute bottom-6 text-[10px] text-neutral-600 uppercase tracking-widest">
        Click anywhere to enter
      </span>
    </div>
  );
}

function MainLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isPrintRoute = location.pathname.includes('/print');

  // Do not show storefront header/footer on printable order page
  if (isPrintRoute) {
    return <AppRoutes />;
  }

  // Admin routes have their own layout
  if (isAdminRoute) {
    return (
      <>
        {isConfigMissing && (
          <div className="bg-red-950 border-b border-red-700 px-4 py-2 text-center text-xs text-red-200">
            <strong className="font-bold">Production Configuration Missing:</strong> Supabase credentials (<code>VITE_SUPABASE_URL</code> & <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>) are not configured. Database operations fail closed.
          </div>
        )}
        <AppRoutes />
        <CartDrawer />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {isConfigMissing && (
        <div className="bg-red-950 border-b border-red-700 px-4 py-2 text-center text-xs text-red-200">
          <strong className="font-bold">Production Configuration Missing:</strong> Supabase credentials (<code>VITE_SUPABASE_URL</code> & <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>) are not configured. Real orders fail closed. Set <code>VITE_DEMO_MODE=&quot;true&quot;</code> for preview.
        </div>
      )}
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <AppRoutes />
      </main>
      <Footer />


      {/* Floating Widgets */}
      <WhatsAppButton />
      <AIAssistantWidget />
      <CartDrawer />
    </div>
  );
}

export default function App() {
  const [showIntro, setShowIntro] = useState(() => {
    // Skip if autostart=1 or already seen in session
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return false;
    const seen = sessionStorage.getItem('arts_intro_seen');
    return !seen;
  });

  const handleFinishIntro = () => {
    setShowIntro(false);
    sessionStorage.setItem('arts_intro_seen', 'true');
  };

  return (
    <LanguageProvider>
      <ToastProvider>
        <SettingsProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <BrowserRouter>
                  {showIntro && <IntroSplash onFinish={handleFinishIntro} />}
                  <ScrollToTop />
                  <MainLayout />
                </BrowserRouter>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
