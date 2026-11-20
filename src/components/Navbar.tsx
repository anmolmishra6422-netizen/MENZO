import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatINR } from '../utils/format';
import { Product } from '../types/ecommerce';

export type AppView =
  | 'home'
  | 'catalog'
  | 'product'
  | 'checkout'
  | 'dashboard'
  | 'admin'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'shipping'
  | 'returns'
  | 'faq'
  | 'size-guide';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView, params?: { category?: string; subcategory?: string; collection?: string; search?: string }) => void;
  onSelectProduct: (product: Product) => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

export function Navbar({
  currentView,
  onNavigate,
  onSelectProduct,
  onOpenCart,
  onOpenAuth,
}: NavbarProps) {
  const { user, categories, products, cartItems, wishlistIds } = useStore();
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalBagCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q) ||
          p.occasion.toLowerCase().includes(q) ||
          p.colors.some((c) => c.name.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [searchQuery, products]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSearch(false);
    onNavigate('catalog', { search: searchQuery.trim() });
  };

  return (
    <div className="sticky top-0 z-40 bg-white">
      {/* Slim Dismissible Announcement Bar */}
      {showAnnouncement && (
        <div className="bg-neutral-950 text-white px-4 py-1.5 text-[11px] sm:text-xs flex items-center justify-between max-h-9">
          <div className="w-5" />
          <p className="text-center truncate font-medium tracking-wide">
            Complimentary Pan-India Shipping above ₹1,999 · Use code <span className="underline underline-offset-2">MENZO10</span> for 10% off
          </p>
          <button
            type="button"
            aria-label="Dismiss announcement"
            onClick={() => setShowAnnouncement(false)}
            className="text-neutral-400 hover:text-white p-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main 3-Zone Top Bar */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-6 lg:gap-8">
          {/* Zone 1: Brand Wordmark + Mobile Menu Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="lg:hidden p-1.5 -ml-1.5 text-neutral-900 hover:text-neutral-600"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMegaMenu(false);
                onNavigate('home');
              }}
              className="font-display text-2xl sm:text-[28px] font-bold tracking-[0.14em] text-neutral-950 whitespace-nowrap shrink-0 uppercase"
            >
              MENZO
            </button>
          </div>

          {/* Zone 2: Concise Single-Line Primary Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium text-neutral-700">
            <button
              type="button"
              onClick={() => {
                setShowMegaMenu((v) => !v);
              }}
              className="flex items-center gap-1 hover:text-neutral-950 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Categories</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMegaMenu ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMegaMenu(false);
                onNavigate('catalog', { category: 'Topwear' });
              }}
              className="hover:text-neutral-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Topwear
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMegaMenu(false);
                onNavigate('catalog', { category: 'Bottomwear' });
              }}
              className="hover:text-neutral-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Bottomwear
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMegaMenu(false);
                onNavigate('catalog', { category: 'Ethnic Wear' });
              }}
              className="hover:text-neutral-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Ethnic Wear
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMegaMenu(false);
                onNavigate('catalog', { collection: 'New Arrivals' });
              }}
              className="hover:text-neutral-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              New Arrivals
            </button>
          </nav>

          {/* Zone 3: Search, Wishlist, Account, Bag */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              aria-label="Search products"
              onClick={() => {
                setShowMegaMenu(false);
                setShowSearch((v) => !v);
              }}
              className="p-2 text-neutral-800 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
            >
              <Search className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              aria-label="Wishlist"
              onClick={() => {
                setShowMegaMenu(false);
                if (user) {
                  onNavigate('dashboard');
                } else {
                  onOpenAuth();
                }
              }}
              className="relative p-2 text-neutral-800 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
            >
              <Heart className="w-[18px] h-[18px]" strokeWidth={1.75} />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 bg-neutral-950 text-white text-[10px] font-medium flex items-center justify-center rounded-full tabular-nums">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            <button
              type="button"
              aria-label={user ? 'Customer Account' : 'Sign In'}
              onClick={() => {
                setShowMegaMenu(false);
                if (user) {
                  onNavigate('dashboard');
                } else {
                  onOpenAuth();
                }
              }}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'dashboard'
                  ? 'border-neutral-950 bg-neutral-950 text-white'
                  : 'border-neutral-300 text-neutral-900 hover:border-neutral-950'
              }`}
            >
              <User className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{user ? 'Account' : 'Sign In'}</span>
            </button>

            <button
              type="button"
              aria-label="Shopping Bag"
              onClick={() => {
                setShowMegaMenu(false);
                onOpenCart();
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800 transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Bag</span>
              <span className="tabular-nums">({totalBagCount})</span>
            </button>
          </div>
        </div>

        {/* Live Search Dropdown Bar */}
        {showSearch && (
          <div className="border-t border-neutral-200 bg-neutral-50 px-4 sm:px-6 lg:px-10 py-4">
            <div className="max-w-3xl mx-auto relative">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shirts, kurtas, raw denim, linen, loafers, office wear..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 text-sm text-neutral-950 focus:outline-none focus:border-neutral-950"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-neutral-950 text-white text-sm font-medium hover:bg-neutral-800 whitespace-nowrap"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setShowSearch(false)}
                  className="p-2.5 text-neutral-500 hover:text-neutral-950"
                  aria-label="Close search"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>

              {searchQuery.trim() && (
                <div className="mt-3 bg-white border border-neutral-200 divide-y divide-neutral-100">
                  {searchSuggestions.length > 0 ? (
                    searchSuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setShowSearch(false);
                          onSelectProduct(item);
                        }}
                        className="w-full px-4 py-2.5 flex items-center justify-between gap-4 hover:bg-neutral-50 text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover bg-neutral-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-950 truncate">{item.name}</p>
                            <p className="text-xs text-neutral-500 truncate">
                              {item.brand} · {item.category} · {item.subcategory}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-neutral-950 tabular-nums shrink-0">
                          {formatINR(item.price)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-sm text-neutral-500">
                      No exact match for "{searchQuery}". Press Search to view full catalog filters.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Desktop Mega Menu covering ALL 8 Categories & Subcategories */}
        {showMegaMenu && (
          <div className="hidden lg:block border-t border-neutral-200 bg-white shadow-lg">
            <div className="max-w-[1440px] mx-auto px-10 py-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-100">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 font-medium">
                  Complete Menswear Directory
                </p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMegaMenu(false);
                      onNavigate('catalog');
                    }}
                    className="text-xs font-semibold text-neutral-950 underline underline-offset-4"
                  >
                    Browse All Products
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMegaMenu(false)}
                    className="text-neutral-400 hover:text-neutral-950"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-8">
                {categories.map((cat) => (
                  <div key={cat.id} className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMegaMenu(false);
                        if (cat.name === 'Special Collections') {
                          onNavigate('catalog');
                        } else {
                          onNavigate('catalog', { category: cat.name });
                        }
                      }}
                      className="text-sm font-semibold text-neutral-950 hover:underline underline-offset-4 block text-left"
                    >
                      {cat.name}
                    </button>
                    <ul className="space-y-1 max-h-44 overflow-y-auto pr-2">
                      {cat.subcategories.map((sub) => (
                        <li key={sub}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowMegaMenu(false);
                              if (cat.name === 'Special Collections') {
                                onNavigate('catalog', { collection: sub });
                              } else {
                                onNavigate('catalog', { category: cat.name, subcategory: sub });
                              }
                            }}
                            className="text-xs text-neutral-600 hover:text-neutral-950 hover:underline underline-offset-2 text-left"
                          >
                            {sub}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-neutral-200 bg-white max-h-[75vh] overflow-y-auto px-4 py-5 space-y-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (user) onNavigate('dashboard');
                  else onOpenAuth();
                }}
                className="px-4 py-2 border border-neutral-300 text-xs font-medium text-neutral-950 flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5" />
                {user ? 'My Account & Orders' : 'Customer Sign In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('catalog');
                }}
                className="text-xs font-semibold underline underline-offset-4"
              >
                Shop All
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="border border-neutral-100 p-3 bg-neutral-50/70">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (cat.name === 'Special Collections') onNavigate('catalog');
                      else onNavigate('catalog', { category: cat.name });
                    }}
                    className="text-xs font-semibold text-neutral-950 mb-1.5 block text-left"
                  >
                    {cat.name}
                  </button>
                  <div className="flex flex-col gap-1">
                    {cat.subcategories.slice(0, 5).map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          if (cat.name === 'Special Collections') onNavigate('catalog', { collection: sub });
                          else onNavigate('catalog', { category: cat.name, subcategory: sub });
                        }}
                        className="text-[11px] text-neutral-600 text-left truncate hover:text-neutral-950"
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
