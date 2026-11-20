import React, { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppView, Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { CatalogPage } from './components/CatalogPage';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPage } from './components/CheckoutPage';
import { AuthModal } from './components/AuthModal';
import { CustomerDashboard } from './components/CustomerDashboard';
import { AdminPortal } from './components/AdminPortal';
import { InfoPage } from './components/InfoPages';
import { Footer } from './components/Footer';
import { FilterState, Product } from './types/ecommerce';

const INITIAL_FILTERS: FilterState = {
  search: '',
  category: '',
  subcategory: '',
  collection: '',
  brand: '',
  minPrice: 0,
  maxPrice: 20000,
  size: '',
  color: '',
  fabric: '',
  fit: '',
  occasion: '',
  minDiscount: 0,
  minRating: 0,
  sort: 'recommended',
};

function AppContent() {
  const { products, toast } = useStore();
  const [view, setView] = useState<AppView>(() =>
    window.location.hash === '#/admin' ? 'admin' : 'home'
  );
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === '#/admin') setView('admin');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = (
    nextView: AppView,
    params?: { category?: string; subcategory?: string; collection?: string; search?: string }
  ) => {
    if (nextView === 'admin') {
      window.location.hash = '#/admin';
    } else if (window.location.hash === '#/admin') {
      window.location.hash = '';
    }

    if (nextView === 'catalog') {
      setFilters({
        ...INITIAL_FILTERS,
        category: params?.category || '',
        subcategory: params?.subcategory || '',
        collection: params?.collection || '',
        search: params?.search || '',
      });
    }
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    setView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];

  if (view === 'admin') {
    return (
      <>
        <AdminPortal onExitToStore={() => navigateTo('home')} />
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-neutral-950 text-white text-xs font-medium shadow-xl border border-neutral-800">
            {toast.message}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-950">
      <Navbar
        currentView={view}
        onNavigate={navigateTo}
        onSelectProduct={handleSelectProduct}
        onOpenCart={() => setCartOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
      />

      <div className="flex-1">
        {view === 'home' && <HomePage onNavigate={navigateTo} onSelectProduct={handleSelectProduct} />}
        {view === 'catalog' && (
          <CatalogPage
            filters={filters}
            onChangeFilters={setFilters}
            onSelectProduct={handleSelectProduct}
          />
        )}
        {view === 'product' && activeProduct && (
          <ProductDetailPage
            product={activeProduct}
            onBack={() => navigateTo('catalog', { category: activeProduct.category })}
            onSelectProduct={handleSelectProduct}
            onBuyNow={() => navigateTo('checkout')}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}
        {view === 'checkout' && (
          <CheckoutPage
            onOpenAuth={() => setAuthOpen(true)}
            onContinueShopping={() => navigateTo('catalog')}
            onViewOrders={() => navigateTo('dashboard')}
          />
        )}
        {view === 'dashboard' && (
          <CustomerDashboard
            onSelectProduct={handleSelectProduct}
            onOpenCart={() => setCartOpen(true)}
            onOpenAuth={() => setAuthOpen(true)}
            onShopNow={() => navigateTo('catalog')}
          />
        )}
        {['about', 'contact', 'privacy', 'terms', 'shipping', 'returns', 'faq', 'size-guide'].includes(view) && (
          <InfoPage view={view} />
        )}
      </div>

      <Footer onNavigate={navigateTo} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => navigateTo('checkout')}
      />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 text-xs font-medium shadow-xl border ${
            toast.tone === 'error'
              ? 'bg-red-950 text-white border-red-800'
              : toast.tone === 'success'
                ? 'bg-neutral-950 text-white border-neutral-800'
                : 'bg-white text-neutral-950 border-neutral-300'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </ErrorBoundary>
  );
}
