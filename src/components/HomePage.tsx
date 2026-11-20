import React, { useMemo, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { HERO_IMAGE, IMG_KURTA } from '../data/catalogSeed';
import { useStore } from '../context/StoreContext';
import { Product } from '../types/ecommerce';
import { ProductCard } from './ProductCard';
import { ProductImage } from './ProductImage';
import { AppView } from './Navbar';

interface HomePageProps {
  onNavigate: (
    view: AppView,
    params?: { category?: string; subcategory?: string; collection?: string; search?: string }
  ) => void;
  onSelectProduct: (product: Product) => void;
}

type ShowcaseTab = 'Trending Now' | 'Best Sellers' | 'New Arrivals' | 'Occasion' | 'Seasonal';

export function HomePage({ onNavigate, onSelectProduct }: HomePageProps) {
  const { products, categories, coupons, banners, subscribeNewsletter, applyCouponCode, showToast } =
    useStore();

  const [activeTab, setActiveTab] = useState<ShowcaseTab>('Trending Now');
  const [occasionFilter, setOccasionFilter] = useState('Office Wear');
  const [seasonFilter, setSeasonFilter] = useState('Summer Collection');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submittingNews, setSubmittingNews] = useState(false);
  const [subscribedDone, setSubscribedDone] = useState(false);

  const activeBanners = useMemo(() => banners.filter((b) => b.active), [banners]);
  const primaryBanner = activeBanners[0];

  const showcasedProducts = useMemo(() => {
    if (activeTab === 'Trending Now') {
      return products.filter((p) => p.collections.includes('Trending Now')).slice(0, 6);
    }
    if (activeTab === 'Best Sellers') {
      return products.filter((p) => p.collections.includes('Best Sellers')).slice(0, 6);
    }
    if (activeTab === 'New Arrivals') {
      return products.filter((p) => p.collections.includes('New Arrivals')).slice(0, 6);
    }
    if (activeTab === 'Occasion') {
      return products.filter((p) => p.collections.includes(occasionFilter)).slice(0, 6);
    }
    return products.filter((p) => p.collections.includes(seasonFilter)).slice(0, 6);
  }, [products, activeTab, occasionFilter, seasonFilter]);

  const activeCoupons = useMemo(() => coupons.filter((c) => c.active).slice(0, 3), [coupons]);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setSubmittingNews(true);
    try {
      await subscribeNewsletter(newsletterEmail);
      setSubscribedDone(true);
      setNewsletterEmail('');
    } finally {
      setSubmittingNews(false);
    }
  };

  return (
    <main className="bg-white">
      {/* 1. Hero Campaign Banner */}
      <section className="relative w-full bg-neutral-950 overflow-hidden">
        <div className="relative h-[520px] sm:h-[600px] lg:h-[660px] w-full max-w-[1440px] mx-auto">
          <img
            src={HERO_IMAGE}
            alt="MENZO Menswear Editorial Campaign"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-16 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-300 mb-3">
              MENZO · Style That Defines You
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.06] tracking-tight text-balance mb-4">
              {primaryBanner?.title || 'New Season. New Wardrobe.'}
            </h1>
            <p className="text-sm sm:text-base text-neutral-200 max-w-xl leading-relaxed mb-7">
              {primaryBanner?.subtitle ||
                'Upgrade Your Everyday Style with architectural Indian linen, selvedge denim, and precision-tailored essentials.'}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('catalog', { collection: 'New Arrivals' })}
                className="px-7 py-3.5 bg-white text-neutral-950 text-xs sm:text-sm font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors inline-flex items-center gap-2 whitespace-nowrap"
              >
                <span>{primaryBanner?.ctaText || 'Explore Collection'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('catalog')}
                className="px-6 py-3.5 border border-white/60 text-white text-xs sm:text-sm font-medium uppercase tracking-wider hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                View Full Catalogue
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Highlights Strip */}
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-neutral-700">
          <div>
            <span className="font-semibold text-neutral-950 block">Free Pan-India Shipping</span>
            <span>On orders above ₹1,999</span>
          </div>
          <div>
            <span className="font-semibold text-neutral-950 block">14-Day Easy Exchanges</span>
            <span>Doorstep pickup across India</span>
          </div>
          <div>
            <span className="font-semibold text-neutral-950 block">Indian Sizing Tailored</span>
            <span>Discover Your Perfect Fit</span>
          </div>
          <div>
            <span className="font-semibold text-neutral-950 block">Sample Catalogue Preview</span>
            <span>Demonstration inventory & pricing in ₹</span>
          </div>
        </div>
      </section>

      {/* 2. Shop by Category */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-14 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-1.5">Departments</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-neutral-950">
              Shop by Category
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className="text-xs font-semibold uppercase tracking-wider text-neutral-950 underline underline-offset-4 hover:text-neutral-600 self-start sm:self-auto whitespace-nowrap"
          >
            Browse All 8 Departments
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                if (cat.name === 'Special Collections') {
                  onNavigate('catalog', { collection: 'Premium Collection' });
                } else {
                  onNavigate('catalog', { category: cat.name });
                }
              }}
              className="group text-left border border-neutral-200 hover:border-neutral-950 transition-colors bg-white flex flex-col"
            >
              <div className="overflow-hidden">
                <ProductImage
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-950 truncate">{cat.name}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">
                    {cat.subcategories.slice(0, 2).join(' · ')}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-950 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Curated Collection Showcase (Trending, Best Sellers, New Arrivals, Occasion, Seasonal) */}
      <section className="border-t border-neutral-200 bg-[#FAFAF9]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-14 lg:py-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-1.5">Curated Edits</p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-neutral-950">
                Fashion That Fits Your Personality
              </h2>
            </div>

            {/* Interactive Segmented Tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-neutral-200/70 self-start">
              {(['Trending Now', 'Best Sellers', 'New Arrivals', 'Occasion', 'Seasonal'] as ShowcaseTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      activeTab === tab
                        ? 'bg-neutral-950 text-white'
                        : 'text-neutral-700 hover:text-neutral-950'
                    }`}
                  >
                    {tab === 'Occasion' ? 'Shop by Occasion' : tab === 'Seasonal' ? 'Seasonal Edit' : tab}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Sub-selector for Occasion or Seasonal */}
          {activeTab === 'Occasion' && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {['Office Wear', 'Casual Collection', 'Party Wear', 'Wedding Collection', 'Festive Collection'].map(
                (occ) => (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => setOccasionFilter(occ)}
                    className={`px-3.5 py-1.5 text-xs border transition-colors whitespace-nowrap ${
                      occasionFilter === occ
                        ? 'border-neutral-950 bg-neutral-950 text-white'
                        : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-950'
                    }`}
                  >
                    {occ}
                  </button>
                )
              )}
            </div>
          )}

          {activeTab === 'Seasonal' && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {['Summer Collection', 'Winter Collection', 'Budget Collection', 'Premium Collection'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeasonFilter(s)}
                  className={`px-3.5 py-1.5 text-xs border transition-colors whitespace-nowrap ${
                    seasonFilter === s
                      ? 'border-neutral-950 bg-neutral-950 text-white'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-950'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {showcasedProducts.map((product) => (
              <ProductCard key={product.id} product={product} onSelect={onSelectProduct} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() =>
                onNavigate('catalog', {
                  collection:
                    activeTab === 'Occasion'
                      ? occasionFilter
                      : activeTab === 'Seasonal'
                        ? seasonFilter
                        : activeTab,
                })
              }
              className="px-7 py-3 border border-neutral-950 text-neutral-950 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-950 hover:text-white transition-colors"
            >
              View Entire Edit
            </button>
          </div>
        </div>
      </section>

      {/* 4. Editorial Tailoring Split & Active Offers */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 border border-neutral-200 items-stretch">
          <div className="min-h-[360px] lg:min-h-[460px] overflow-hidden bg-neutral-100">
            <img
              src={IMG_KURTA}
              alt="MENZO Ethnic and Tailored Heritage Edit"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-between bg-white">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-3">
                Craftsmanship & Offers
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-neutral-950 mb-4 text-balance">
                Discover Your Perfect Fit
              </h2>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-8">
                From crisp Giza cotton formals and breathable European flax linen to handloom festive
                silks, every MENZO silhouette is proportioned for Indian builds aged 16 to 45.
              </p>

              {/* Active Coupons */}
              <div className="space-y-3 mb-8">
                <p className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
                  Active Storefront Offers
                </p>
                <div className="divide-y divide-neutral-200 border border-neutral-200">
                  {activeCoupons.map((c) => (
                    <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-mono-tabular text-sm font-semibold text-neutral-950">
                          {c.code}
                        </span>
                        <p className="text-xs text-neutral-500 mt-0.5">{c.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const res = applyCouponCode(c.code);
                          showToast(res.message, res.ok ? 'success' : 'neutral');
                        }}
                        className="text-xs font-medium underline underline-offset-4 text-neutral-950 hover:text-neutral-600 whitespace-nowrap shrink-0"
                      >
                        Apply Code
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('catalog', { category: 'Ethnic Wear' })}
                className="px-6 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
              >
                Shop Festive & Wedding
              </button>
              <button
                type="button"
                onClick={() => onNavigate('size-guide')}
                className="px-6 py-3 border border-neutral-300 text-neutral-950 text-xs font-medium uppercase tracking-wider hover:border-neutral-950 transition-colors"
              >
                View Size Guide
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Newsletter Section */}
      <section className="border-t border-neutral-200 bg-neutral-950 text-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-2">Private Dispatch</p>
            <h2 className="font-display text-3xl font-semibold text-white mb-2">
              Early access to seasonal drops
            </h2>
            <p className="text-sm text-neutral-300">
              Join the MENZO list for new collection launches, restock alerts, and member-only offers.
            </p>
          </div>

          {subscribedDone ? (
            <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
              <Check className="w-4 h-4" />
              <span>You are on the MENZO dispatch list.</span>
            </div>
          ) : (
            <form onSubmit={handleNewsletter} className="flex w-full max-w-md gap-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 bg-neutral-900 border border-neutral-700 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white"
              />
              <button
                type="submit"
                disabled={submittingNews}
                className="px-6 py-3 bg-white text-neutral-950 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {submittingNews ? 'Joining...' : 'Subscribe'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
