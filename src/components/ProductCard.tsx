import React, { useState } from 'react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Product } from '../types/ecommerce';
import { formatINR } from '../utils/format';
import { useStore } from '../context/StoreContext';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const { wishlistIds, toggleWishlist, addToCart } = useStore();
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'M');
  const [showQuickSizes, setShowQuickSizes] = useState(false);

  const isWishlisted = wishlistIds.includes(product.id);
  const defaultColor = product.colors[0]?.name || 'Default';
  const outOfStock = product.stock <= 0;

  return (
    <article
      className="group flex flex-col bg-white border border-neutral-200/80 hover:border-neutral-400 transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="relative overflow-hidden cursor-pointer" onClick={() => onSelect(product)}>
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />

        {/* Subtle single text tag at top-left if featured/low stock */}
        {(product.discountPercent > 0 || outOfStock) && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium tracking-wide text-neutral-950 border border-neutral-200/70 tabular-nums">
            {outOfStock ? 'Sold Out' : `${product.discountPercent}% Off`}
          </div>
        )}

        {/* Wishlist button */}
        <button
          type="button"
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-3 right-3 w-9 h-9 bg-white/95 backdrop-blur-sm border border-neutral-200/70 flex items-center justify-center text-neutral-900 hover:bg-neutral-950 hover:text-white transition-colors"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} strokeWidth={1.6} />
        </button>

        {/* Quick Add hover drawer */}
        {!outOfStock && (
          <div
            className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm border-t border-neutral-200 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200 hidden md:block"
            onClick={(e) => e.stopPropagation()}
          >
            {showQuickSizes ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-600">
                  <span>Select Size</span>
                  <button
                    type="button"
                    onClick={() => setShowQuickSizes(false)}
                    className="underline hover:text-neutral-950"
                  >
                    Close
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {product.sizes.slice(0, 6).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setSelectedSize(sz);
                        addToCart(product, sz, defaultColor, 1);
                        setShowQuickSizes(false);
                      }}
                      className="px-2 py-1 text-xs font-medium border border-neutral-300 hover:bg-neutral-950 hover:text-white hover:border-neutral-950 transition-colors whitespace-nowrap"
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowQuickSizes(true)}
                className="w-full py-1.5 bg-neutral-950 text-white text-xs font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors whitespace-nowrap"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Quick Add to Bag
              </button>
            )}
          </div>
        )}
      </div>

      {/* Product Metadata */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Unboxed clean metadata */}
          <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-neutral-500 mb-1">
            <span className="truncate">{product.brand}</span>
            <span className="flex items-center gap-1 text-neutral-700 tabular-nums shrink-0">
              <Star className="w-3 h-3 fill-neutral-900 text-neutral-900" />
              {product.rating.toFixed(1)} ({product.reviewCount})
            </span>
          </div>

          <h3
            onClick={() => onSelect(product)}
            className="text-[15px] font-semibold text-neutral-950 leading-snug line-clamp-2 cursor-pointer hover:underline underline-offset-4"
          >
            {product.name}
          </h3>

          <p className="text-xs text-neutral-500 mt-1 truncate">
            {product.subcategory} · {product.fit}
          </p>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-neutral-100">
          {/* Colors & Sizes */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {product.colors.slice(0, 4).map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="w-3.5 h-3.5 rounded-full border border-neutral-300 inline-block"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[11px] text-neutral-500">+{product.colors.length - 4}</span>
              )}
            </div>
            <span className="text-[11px] text-neutral-500 truncate">
              {product.sizes.slice(0, 4).join(' / ')}
            </span>
          </div>

          {/* Pricing + Mobile Quick Add */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2 tabular-nums">
              <span className="text-[15px] font-semibold text-neutral-950">
                {formatINR(product.price)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-neutral-400 line-through">
                  {formatINR(product.originalPrice)}
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={outOfStock}
              onClick={() => addToCart(product, selectedSize, defaultColor, 1)}
              className="md:hidden px-3 py-1.5 bg-neutral-950 text-white text-xs font-medium disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              {outOfStock ? 'Sold Out' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
