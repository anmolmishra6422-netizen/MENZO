import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Heart,
  RefreshCw,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types/ecommerce';
import { formatDateTime, formatINR, getDeliveryEstimate } from '../utils/format';
import { ProductCard } from './ProductCard';
import { ProductImage } from './ProductImage';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onBuyNow: () => void;
  onOpenAuth: () => void;
}

export function ProductDetailPage({
  product,
  onBack,
  onSelectProduct,
  onBuyNow,
  onOpenAuth,
}: ProductDetailPageProps) {
  const {
    user,
    products,
    reviews,
    wishlistIds,
    recentlyViewedIds,
    toggleWishlist,
    addToCart,
    trackProductView,
    submitReview,
    showToast,
  } = useStore();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || '');
  const [variantError, setVariantError] = useState('');
  const [showSizeChart, setShowSizeChart] = useState(false);

  // Review state
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState('');
  const [revComment, setRevComment] = useState('');
  const [submittingRev, setSubmittingRev] = useState(false);

  useEffect(() => {
    setActiveImageIdx(0);
    setSelectedSize(product.sizes.length === 1 ? product.sizes[0] : '');
    setSelectedColor(product.colors[0]?.name || 'Default');
    setVariantError('');
    trackProductView(product.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product.id]);

  const isWishlisted = wishlistIds.includes(product.id);
  const productReviews = useMemo(
    () => reviews.filter((r) => r.productId === product.id),
    [reviews, product.id]
  );

  const similarProducts = useMemo(
    () =>
      products
        .filter((p) => p.id !== product.id && (p.category === product.category || p.occasion === product.occasion))
        .slice(0, 3),
    [products, product]
  );

  const recentlyViewedProducts = useMemo(
    () =>
      recentlyViewedIds
        .filter((id) => id !== product.id)
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p))
        .slice(0, 4),
    [recentlyViewedIds, products, product.id]
  );

  const handleAdd = (goToCheckout = false) => {
    if (product.stock <= 0) {
      setVariantError('This item is currently out of stock.');
      return;
    }
    if (product.sizes.length > 0 && !selectedSize) {
      setVariantError('Please select a size before adding to bag.');
      return;
    }
    if (product.colors.length > 0 && !selectedColor) {
      setVariantError('Please select a colour before adding to bag.');
      return;
    }
    setVariantError('');
    addToCart(product, selectedSize || 'One Size', selectedColor || 'Default', 1);
    if (goToCheckout) {
      onBuyNow();
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (revComment.trim().length < 5) {
      showToast('Please write at least 5 characters for your review.', 'error');
      return;
    }
    setSubmittingRev(true);
    try {
      await submitReview(product.id, revRating, revTitle || 'Customer Review', revComment);
      setRevTitle('');
      setRevComment('');
      setRevRating(5);
    } catch (err: any) {
      showToast(err?.message || 'Unable to submit review.', 'error');
    } finally {
      setSubmittingRev(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
      {/* Breadcrumb Back */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-neutral-950 mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to {product.category}</span>
      </button>

      {/* Main Split: Sticky Gallery Left + Purchase Module Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left: Multi-Image Gallery */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-4">
          <ProductImage
            src={product.images[activeImageIdx] || product.images[0]}
            alt={`${product.name} view ${activeImageIdx + 1}`}
            aspectClass="aspect-[4/3]"
          />
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`border transition-colors overflow-hidden ${
                    activeImageIdx === idx ? 'border-neutral-950' : 'border-neutral-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <ProductImage src={img} alt={`${product.name} thumbnail ${idx + 1}`} aspectClass="aspect-[4/3]" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wider text-neutral-500 mb-2">
              <span>
                {product.brand} · {product.subcategory}
              </span>
              {product.isDemo && <span>Sample Catalog Item</span>}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-neutral-950 leading-tight mb-3">
              {product.name}
            </h1>

            {/* Rating + Pricing */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-neutral-200">
              <div className="flex items-baseline gap-3 tabular-nums">
                <span className="text-2xl font-semibold text-neutral-950">{formatINR(product.price)}</span>
                {product.originalPrice > product.price && (
                  <>
                    <span className="text-sm text-neutral-400 line-through">
                      {formatINR(product.originalPrice)}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">
                      Save {product.discountPercent}%
                    </span>
                  </>
                )}
              </div>

              <a
                href="#reviews-section"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-800 hover:underline tabular-nums"
              >
                <Star className="w-3.5 h-3.5 fill-neutral-950 text-neutral-950" />
                <span>{product.rating.toFixed(1)}</span>
                <span className="text-neutral-500">({product.reviewCount} reviews)</span>
              </a>
            </div>
          </div>

          {/* Colour Selector */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2.5">
              <span className="uppercase tracking-wider font-semibold text-neutral-950">
                Colour: <span className="font-normal text-neutral-600">{selectedColor}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setSelectedColor(c.name);
                    setVariantError('');
                  }}
                  className={`flex items-center gap-2 px-3 py-2 border text-xs transition-colors ${
                    selectedColor === c.name
                      ? 'border-neutral-950 bg-neutral-50 font-semibold'
                      : 'border-neutral-300 hover:border-neutral-950'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-neutral-300"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector + Size Chart */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2.5">
              <span className="uppercase tracking-wider font-semibold text-neutral-950">
                Select Size {selectedSize ? `· ${selectedSize}` : ''}
              </span>
              <button
                type="button"
                onClick={() => setShowSizeChart(true)}
                className="inline-flex items-center gap-1 text-neutral-700 hover:text-neutral-950 underline underline-offset-4"
              >
                <Ruler className="w-3.5 h-3.5" />
                Size Chart
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    setSelectedSize(sz);
                    setVariantError('');
                  }}
                  className={`min-w-[52px] px-3.5 py-2.5 border text-xs font-medium transition-colors ${
                    selectedSize === sz
                      ? 'border-neutral-950 bg-neutral-950 text-white'
                      : 'border-neutral-300 text-neutral-900 hover:border-neutral-950'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
            {variantError && <p className="text-xs text-red-600 mt-2 font-medium">{variantError}</p>}
          </div>

          {/* Stock Status */}
          <div className="text-xs">
            {product.stock > 10 ? (
              <span className="text-emerald-700 font-medium inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> In Stock ({product.stock} available) · Inclusive of all taxes
              </span>
            ) : product.stock > 0 ? (
              <span className="text-amber-700 font-medium">
                Low Stock — Only {product.stock} left
              </span>
            ) : (
              <span className="text-red-600 font-medium">Currently Out of Stock</span>
            )}
          </div>

          {/* Primary Actions */}
          <div className="space-y-3 pt-1">
            <div className="flex gap-3">
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => handleAdd(false)}
                className="flex-1 py-3.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Bag
              </button>
              <button
                type="button"
                aria-label="Toggle wishlist"
                onClick={() => toggleWishlist(product.id)}
                className={`px-4 border transition-colors flex items-center justify-center ${
                  isWishlisted
                    ? 'border-neutral-950 bg-neutral-950 text-white'
                    : 'border-neutral-300 text-neutral-950 hover:border-neutral-950'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={() => handleAdd(true)}
              className="w-full py-3 border border-neutral-950 text-neutral-950 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-100 transition-colors disabled:opacity-40"
            >
              Buy Now
            </button>
          </div>

          {/* Delivery & Policy Highlights */}
          <div className="border border-neutral-200 divide-y divide-neutral-200 text-xs">
            <div className="p-3.5 flex items-start gap-3">
              <Truck className="w-4 h-4 text-neutral-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-neutral-950">Estimated Delivery: {getDeliveryEstimate()}</p>
                <p className="text-neutral-500 mt-0.5">Free shipping above ₹1,999 across India.</p>
              </div>
            </div>
            <div className="p-3.5 flex items-start gap-3">
              <RefreshCw className="w-4 h-4 text-neutral-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-neutral-950">14-Day Returns & Size Exchange</p>
                <p className="text-neutral-500 mt-0.5">Complimentary doorstep pickup on unworn items with tags.</p>
              </div>
            </div>
            <div className="p-3.5 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-neutral-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-neutral-950">Authentic Quality Guarantee</p>
                <p className="text-neutral-500 mt-0.5">Crafted with verified mill fabrics and reinforced stitching.</p>
              </div>
            </div>
          </div>

          {/* Product Details & Fabric */}
          <div className="space-y-4 pt-2 border-t border-neutral-200">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-950 mb-2">
                Description
              </h2>
              <p className="text-sm text-neutral-700 leading-relaxed">{product.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-100 text-xs">
              <div>
                <span className="text-neutral-500 block">Fabric</span>
                <span className="font-medium text-neutral-950">{product.fabric || 'Premium Blend'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Fit</span>
                <span className="font-medium text-neutral-950">{product.fit || 'Tailored'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Occasion</span>
                <span className="font-medium text-neutral-950">{product.occasion || 'Versatile'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Collections</span>
                <span className="font-medium text-neutral-950">{product.collections.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section id="reviews-section" className="mt-16 pt-12 border-t border-neutral-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Feedback</p>
            <h2 className="font-display text-3xl font-semibold text-neutral-950">
              Customer Ratings & Reviews
            </h2>
            <div className="flex items-baseline gap-3 tabular-nums">
              <span className="text-4xl font-semibold text-neutral-950">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-neutral-500">out of 5 · {product.reviewCount} ratings</span>
            </div>

            {/* Write a Review Form */}
            <form onSubmit={handleReviewSubmit} className="border border-neutral-200 p-5 bg-neutral-50 space-y-3 mt-4">
              <h3 className="text-sm font-semibold text-neutral-950">Write a Review</h3>
              <div>
                <label className="block text-xs text-neutral-600 mb-1">Rating</label>
                <select
                  value={revRating}
                  onChange={(e) => setRevRating(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-neutral-300 bg-white text-xs"
                >
                  <option value={5}>5 Stars — Exceptional</option>
                  <option value={4}>4 Stars — Very Good</option>
                  <option value={3}>3 Stars — Good</option>
                  <option value={2}>2 Stars — Fair</option>
                  <option value={1}>1 Star — Needs Improvement</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-600 mb-1">Headline</label>
                <input
                  type="text"
                  value={revTitle}
                  onChange={(e) => setRevTitle(e.target.value)}
                  placeholder="Sum up the fit or fabric"
                  className="w-full px-3 py-2 border border-neutral-300 bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-600 mb-1">Review</label>
                <textarea
                  rows={3}
                  required
                  value={revComment}
                  onChange={(e) => setRevComment(e.target.value)}
                  placeholder="Share sizing, fabric, and styling notes..."
                  className="w-full px-3 py-2 border border-neutral-300 bg-white text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={submittingRev}
                className="w-full py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50"
              >
                {user ? (submittingRev ? 'Publishing...' : 'Submit Review') : 'Sign In to Review'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 space-y-4">
            {productReviews.length === 0 ? (
              <div className="border border-neutral-200 p-8 text-center text-sm text-neutral-500">
                No written reviews for this piece yet. Be the first customer to review it.
              </div>
            ) : (
              productReviews.map((rev) => (
                <div key={rev.id} className="border border-neutral-200 p-5 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-950">{rev.authorName}</span>
                      <span className="text-xs text-neutral-400">·</span>
                      <span className="text-xs text-neutral-500">
                        {rev.isDemo ? 'Sample Demonstration Review' : formatDateTime(rev.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 tabular-nums text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-neutral-950 text-neutral-950" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>
                  {rev.title && <h4 className="text-sm font-semibold text-neutral-950">{rev.title}</h4>}
                  <p className="text-sm text-neutral-700 leading-relaxed">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-neutral-200">
          <h2 className="font-display text-3xl font-semibold text-neutral-950 mb-6">Similar Styles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed */}
      {recentlyViewedProducts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-neutral-200">
          <h2 className="font-display text-3xl font-semibold text-neutral-950 mb-6">Recently Viewed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentlyViewedProducts.map((p) => (
              <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
            ))}
          </div>
        </section>
      )}

      {/* Size Chart Modal */}
      {showSizeChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white max-w-xl w-full border border-neutral-200 p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-neutral-950">MENZO India Size Guide</h3>
              <button type="button" onClick={() => setShowSizeChart(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-neutral-600">
              Standard garment measurements in inches. If between sizes, choose the larger size for a relaxed drape.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse tabular-nums">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500">
                    <th className="py-2 pr-4">Size</th>
                    <th className="py-2 pr-4">Chest (in)</th>
                    <th className="py-2 pr-4">Shoulder (in)</th>
                    <th className="py-2 pr-4">Waist (in)</th>
                    <th className="py-2">Blazer / Shirt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  <tr><td className="py-2 font-semibold">S</td><td>38</td><td>17.0</td><td>30</td><td>38</td></tr>
                  <tr><td className="py-2 font-semibold">M</td><td>40</td><td>17.8</td><td>32</td><td>40</td></tr>
                  <tr><td className="py-2 font-semibold">L</td><td>42</td><td>18.5</td><td>34</td><td>42</td></tr>
                  <tr><td className="py-2 font-semibold">XL</td><td>44</td><td>19.2</td><td>36</td><td>44</td></tr>
                  <tr><td className="py-2 font-semibold">XXL</td><td>46</td><td>20.0</td><td>38</td><td>46</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
