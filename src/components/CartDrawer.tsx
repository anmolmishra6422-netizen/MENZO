import React, { useState } from 'react';
import { Minus, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { FREE_DELIVERY_THRESHOLD, formatINR } from '../utils/format';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartDrawer({ open, onClose, onCheckout }: CartDrawerProps) {
  const {
    cartItems,
    products,
    coupons,
    appliedCoupon,
    cartSubtotal,
    cartDiscount,
    deliveryCharge,
    cartTotal,
    updateCartQty,
    updateCartVariant,
    removeFromCart,
    applyCouponCode,
    removeCoupon,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  if (!open) return null;

  const remainingForFreeShipping = Math.max(0, FREE_DELIVERY_THRESHOLD - (cartSubtotal - cartDiscount));
  const activeCoupons = coupons.filter((c) => c.active).slice(0, 3);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyCouponCode(couponInput);
    setCouponFeedback({ ok: res.ok, msg: res.message });
    if (res.ok) setCouponInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="relative z-10 w-full max-w-md bg-white h-full flex flex-col border-l border-neutral-200 shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-neutral-950" />
            <h2 className="text-base font-semibold text-neutral-950">Shopping Bag</h2>
            <span className="text-xs text-neutral-500 tabular-nums">
              ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)
            </span>
          </div>
          <button
            type="button"
            aria-label="Close bag"
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-neutral-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free Delivery Progress */}
        {cartItems.length > 0 && (
          <div className="px-6 py-2.5 bg-neutral-50 border-b border-neutral-200 text-xs text-neutral-700">
            {remainingForFreeShipping > 0 ? (
              <span>
                Add <strong className="tabular-nums">{formatINR(remainingForFreeShipping)}</strong> more for complimentary pan-India shipping.
              </span>
            ) : (
              <span className="font-medium text-neutral-950">
                Complimentary pan-India shipping unlocked.
              </span>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-neutral-100">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <ShoppingBag className="w-10 h-10 text-neutral-300 mb-3" strokeWidth={1.25} />
              <p className="text-base font-medium text-neutral-950 mb-1">Your MENZO bag is empty</p>
              <p className="text-sm text-neutral-500 mb-6 max-w-xs">
                Explore our tailored topwear, denim, ethnic edits, and leather footwear.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-neutral-950 text-white text-xs font-medium uppercase tracking-wider hover:bg-neutral-800"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => {
              const prod = products.find((p) => p.id === item.productId);
              const availableSizes = prod?.sizes || [item.size];
              const availableColors = prod?.colors.map((c) => c.name) || [item.color];

              return (
                <div key={`${item.productId}-${item.size}-${item.color}`} className="py-4 flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-24 object-cover bg-neutral-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-wider text-neutral-500">{item.brand}</p>
                          <p className="text-sm font-medium text-neutral-950 truncate">{item.name}</p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => removeFromCart(item.productId, item.size, item.color)}
                          className="text-neutral-400 hover:text-neutral-950 p-1 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Inline Size & Colour Change */}
                      <div className="flex items-center gap-2 mt-2">
                        <select
                          aria-label="Size"
                          value={item.size}
                          onChange={(e) =>
                            updateCartVariant(item.productId, item.size, item.color, e.target.value, item.color)
                          }
                          className="text-xs border border-neutral-300 px-2 py-1 bg-white text-neutral-900"
                        >
                          {availableSizes.map((s) => (
                            <option key={s} value={s}>
                              Size: {s}
                            </option>
                          ))}
                        </select>

                        <select
                          aria-label="Color"
                          value={item.color}
                          onChange={(e) =>
                            updateCartVariant(item.productId, item.size, item.color, item.size, e.target.value)
                          }
                          className="text-xs border border-neutral-300 px-2 py-1 bg-white text-neutral-900 max-w-[120px]"
                        >
                          {availableColors.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="inline-flex items-center border border-neutral-300">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateCartQty(item.productId, item.size, item.color, item.quantity - 1)}
                          className="px-2 py-1 text-neutral-700 hover:bg-neutral-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-medium tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateCartQty(item.productId, item.size, item.color, item.quantity + 1)}
                          className="px-2 py-1 text-neutral-700 hover:bg-neutral-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right tabular-nums">
                        <span className="text-sm font-semibold text-neutral-950">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Totals + Coupon */}
        {cartItems.length > 0 && (
          <div className="border-t border-neutral-200 px-6 py-5 bg-neutral-50 space-y-4">
            {/* Coupon Form */}
            <div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between px-3 py-2 bg-white border border-neutral-300 text-xs">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-neutral-800" />
                    <span className="font-semibold">{appliedCoupon.code}</span>
                    <span className="text-neutral-500">applied</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removeCoupon();
                      setCouponFeedback(null);
                    }}
                    className="text-neutral-500 hover:text-neutral-950 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon code (e.g. MENZO10)"
                    className="flex-1 px-3 py-2 bg-white border border-neutral-300 text-xs uppercase focus:outline-none focus:border-neutral-950"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 whitespace-nowrap"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponFeedback && (
                <p className={`text-[11px] mt-1.5 ${couponFeedback.ok ? 'text-emerald-700' : 'text-red-600'}`}>
                  {couponFeedback.msg}
                </p>
              )}

              {!appliedCoupon && activeCoupons.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-neutral-500">
                  <span>Available:</span>
                  {activeCoupons.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        const res = applyCouponCode(c.code);
                        setCouponFeedback({ ok: res.ok, msg: res.message });
                      }}
                      className="underline hover:text-neutral-950 font-mono-tabular"
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="space-y-1.5 text-sm tabular-nums">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>{formatINR(cartSubtotal)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Discount</span>
                  <span>-{formatINR(cartDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Delivery</span>
                <span>{deliveryCharge === 0 ? 'Free' : formatINR(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-neutral-950 pt-2 border-t border-neutral-200">
                <span>Payable Total</span>
                <span>{formatINR(cartTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full py-3 bg-neutral-950 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
