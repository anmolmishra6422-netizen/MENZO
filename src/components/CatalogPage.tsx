import React, { useMemo, useState } from 'react';
import { Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { SPECIAL_COLLECTIONS } from '../data/catalogSeed';
import { useStore } from '../context/StoreContext';
import { FilterState, Product, SortOption } from '../types/ecommerce';
import { formatINR } from '../utils/format';
import { ProductCard } from './ProductCard';

interface CatalogPageProps {
  filters: FilterState;
  onChangeFilters: (next: FilterState) => void;
  onSelectProduct: (product: Product) => void;
}

export function CatalogPage({ filters, onChangeFilters, onSelectProduct }: CatalogPageProps) {
  const { products, categories, brands, catalogLoading, isUsingSeedCatalog } = useStore();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const uniqueFabrics = useMemo(
    () => Array.from(new Set(products.map((p) => p.fabric).filter(Boolean))).sort(),
    [products]
  );
  const uniqueFits = useMemo(
    () => Array.from(new Set(products.map((p) => p.fit).filter(Boolean))).sort(),
    [products]
  );
  const uniqueOccasions = useMemo(
    () => Array.from(new Set(products.map((p) => p.occasion).filter(Boolean))).sort(),
    [products]
  );
  const uniqueSizes = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.sizes))),
    [products]
  );
  const uniqueColors = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.colors.map((c) => c.name)))).sort(),
    [products]
  );

  const activeCategoryObj = categories.find((c) => c.name === filters.category);

  const filteredProducts = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (q) {
        const hay = [
          p.name,
          p.brand,
          p.category,
          p.subcategory,
          p.description,
          p.fabric,
          p.fit,
          p.occasion,
          ...p.collections,
          ...p.colors.map((c) => c.name),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.category && p.category !== filters.category) return false;
      if (filters.subcategory && p.subcategory !== filters.subcategory) return false;
      if (filters.collection && !p.collections.includes(filters.collection)) return false;
      if (filters.brand && p.brand !== filters.brand) return false;
      if (p.price < filters.minPrice || p.price > filters.maxPrice) return false;
      if (filters.size && !p.sizes.includes(filters.size)) return false;
      if (filters.color && !p.colors.some((c) => c.name === filters.color)) return false;
      if (filters.fabric && p.fabric !== filters.fabric) return false;
      if (filters.fit && p.fit !== filters.fit) return false;
      if (filters.occasion && p.occasion !== filters.occasion) return false;
      if (filters.minDiscount > 0 && p.discountPercent < filters.minDiscount) return false;
      if (filters.minRating > 0 && p.rating < filters.minRating) return false;
      return true;
    });

    const sorted = [...list];
    switch (filters.sort) {
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'top_rated':
        sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        break;
      case 'best_selling':
        sorted.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'newest':
        sorted.sort((a, b) => {
          const aNew = a.collections.includes('New Arrivals') ? 1 : 0;
          const bNew = b.collections.includes('New Arrivals') ? 1 : 0;
          return bNew - aNew;
        });
        break;
      default:
        sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
    }
    return sorted;
  }, [products, filters]);

  const resetAllFilters = () => {
    onChangeFilters({
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
    });
  };

  const hasActiveFilter =
    Boolean(filters.search) ||
    Boolean(filters.category) ||
    Boolean(filters.subcategory) ||
    Boolean(filters.collection) ||
    Boolean(filters.brand) ||
    filters.maxPrice < 20000 ||
    Boolean(filters.size) ||
    Boolean(filters.color) ||
    Boolean(filters.fabric) ||
    Boolean(filters.fit) ||
    Boolean(filters.occasion) ||
    filters.minDiscount > 0 ||
    filters.minRating > 0;

  const FilterPanel = (
    <div className="space-y-6 text-sm">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-950 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" />
          Refine Catalogue
        </span>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-xs text-neutral-600 hover:text-neutral-950 underline flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Search inside filters */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          Keyword
        </label>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChangeFilters({ ...filters, search: e.target.value })}
            placeholder="Name, colour, brand..."
            className="w-full pl-8 pr-3 py-2 border border-neutral-300 text-xs bg-white focus:outline-none focus:border-neutral-950"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          Category
        </label>
        <select
          value={filters.category}
          onChange={(e) =>
            onChangeFilters({ ...filters, category: e.target.value, subcategory: '' })
          }
          className="w-full px-3 py-2 border border-neutral-300 text-xs bg-white"
        >
          <option value="">All Categories</option>
          {categories
            .filter((c) => c.name !== 'Special Collections')
            .map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
        </select>
      </div>

      {/* Subcategory */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          Subcategory
        </label>
        <select
          value={filters.subcategory}
          onChange={(e) => onChangeFilters({ ...filters, subcategory: e.target.value })}
          className="w-full px-3 py-2 border border-neutral-300 text-xs bg-white"
        >
          <option value="">All Subcategories</option>
          {(activeCategoryObj
            ? activeCategoryObj.subcategories
            : categories
                .filter((c) => c.name !== 'Special Collections')
                .flatMap((c) => c.subcategories)
          ).map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </div>

      {/* Special Collection */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          Special Collection
        </label>
        <select
          value={filters.collection}
          onChange={(e) => onChangeFilters({ ...filters, collection: e.target.value })}
          className="w-full px-3 py-2 border border-neutral-300 text-xs bg-white"
        >
          <option value="">All Collections</option>
          {SPECIAL_COLLECTIONS.map((col) => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
      </div>

      {/* Brand */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          Brand
        </label>
        <select
          value={filters.brand}
          onChange={(e) => onChangeFilters({ ...filters, brand: e.target.value })}
          className="w-full px-3 py-2 border border-neutral-300 text-xs bg-white"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Max Price Range */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold uppercase tracking-wider text-neutral-500">Max Price</span>
          <span className="font-medium text-neutral-950 tabular-nums">{formatINR(filters.maxPrice)}</span>
        </div>
        <input
          type="range"
          min={500}
          max={20000}
          step={500}
          value={filters.maxPrice}
          onChange={(e) => onChangeFilters({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-neutral-950"
        />
        <div className="flex justify-between text-[11px] text-neutral-400 tabular-nums">
          <span>₹500</span>
          <span>₹20,000</span>
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          Size
        </label>
        <div className="flex flex-wrap gap-1.5">
          {uniqueSizes.map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => onChangeFilters({ ...filters, size: filters.size === sz ? '' : sz })}
              className={`px-2.5 py-1 text-xs border transition-colors ${
                filters.size === sz
                  ? 'border-neutral-950 bg-neutral-950 text-white'
                  : 'border-neutral-300 text-neutral-700 hover:border-neutral-950'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Colour */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          Colour
        </label>
        <select
          value={filters.color}
          onChange={(e) => onChangeFilters({ ...filters, color: e.target.value })}
          className="w-full px-3 py-2 border border-neutral-300 text-xs bg-white"
        >
          <option value="">All Colours</option>
          {uniqueColors.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Fabric & Fit & Occasion */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
            Fabric
          </label>
          <select
            value={filters.fabric}
            onChange={(e) => onChangeFilters({ ...filters, fabric: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 text-xs bg-white"
          >
            <option value="">Any Fabric</option>
            {uniqueFabrics.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
            Fit
          </label>
          <select
            value={filters.fit}
            onChange={(e) => onChangeFilters({ ...filters, fit: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 text-xs bg-white"
          >
            <option value="">Any Fit</option>
            {uniqueFits.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
            Occasion
          </label>
          <select
            value={filters.occasion}
            onChange={(e) => onChangeFilters({ ...filters, occasion: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 text-xs bg-white"
          >
            <option value="">Any Occasion</option>
            {uniqueOccasions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Discount & Rating */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
            Discount
          </label>
          <select
            value={filters.minDiscount}
            onChange={(e) => onChangeFilters({ ...filters, minDiscount: Number(e.target.value) })}
            className="w-full px-2.5 py-2 border border-neutral-300 text-xs bg-white"
          >
            <option value={0}>Any</option>
            <option value={10}>10%+</option>
            <option value={20}>20%+</option>
            <option value={30}>30%+</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
            Rating
          </label>
          <select
            value={filters.minRating}
            onChange={(e) => onChangeFilters({ ...filters, minRating: Number(e.target.value) })}
            className="w-full px-2.5 py-2 border border-neutral-300 text-xs bg-white"
          >
            <option value={0}>Any</option>
            <option value={4}>4.0★ & up</option>
            <option value={4.5}>4.5★ & up</option>
            <option value={4.8}>4.8★ & up</option>
          </select>
        </div>
      </div>
    </div>
  );

  const headingTitle =
    filters.subcategory || filters.category || filters.collection || (filters.search ? `Search: "${filters.search}"` : 'All Menswear');

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-200 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 mb-1">
            MENZO Catalogue {isUsingSeedCatalog ? '· Sample Demonstration Inventory' : ''}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-neutral-950">
            {headingTitle}
          </h1>
          <p className="text-xs text-neutral-500 mt-1 tabular-nums">
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden px-4 py-2 border border-neutral-300 text-xs font-medium flex items-center gap-2"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-xs text-neutral-500 whitespace-nowrap">
              Sort by
            </label>
            <select
              id="sort-select"
              value={filters.sort}
              onChange={(e) => onChangeFilters({ ...filters, sort: e.target.value as SortOption })}
              className="px-3 py-2 border border-neutral-300 text-xs font-medium bg-white text-neutral-950"
            >
              <option value="recommended">Recommended</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="best_selling">Best Selling</option>
              <option value="top_rated">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex gap-10">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">{FilterPanel}</aside>

        {/* Product Results */}
        <div className="flex-1 min-w-0">
          {catalogLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="border border-neutral-200 p-4 animate-pulse space-y-3">
                  <div className="aspect-[4/3] bg-neutral-100" />
                  <div className="h-3 bg-neutral-100 w-1/3" />
                  <div className="h-4 bg-neutral-100 w-3/4" />
                  <div className="h-4 bg-neutral-100 w-1/4" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="border border-neutral-200 bg-neutral-50 p-12 text-center">
              <p className="font-display text-2xl text-neutral-950 mb-2">No matching pieces found</p>
              <p className="text-sm text-neutral-600 max-w-md mx-auto mb-6">
                {filters.subcategory
                  ? `We do not currently have sample stock under "${filters.subcategory}" matching all active filters. Explore the broader ${filters.category || 'MENZO'} department or reset filters.`
                  : 'Try adjusting your search keywords, price ceiling, or active attribute filters.'}
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-6 py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onSelect={onSelectProduct} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative z-10 w-80 max-w-full bg-white h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-semibold">Filters</span>
              <button type="button" onClick={() => setMobileFiltersOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {FilterPanel}
          </div>
        </div>
      )}
    </div>
  );
}
