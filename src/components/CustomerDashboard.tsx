import React, { useMemo, useState } from 'react';
import {
  Clock,
  Heart,
  LogOut,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Address, OrderStatus, Product } from '../types/ecommerce';
import { formatDateTime, formatINR, sanitizeId } from '../utils/format';
import { ProductCard } from './ProductCard';

interface CustomerDashboardProps {
  onSelectProduct: (product: Product) => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onShopNow: () => void;
}

type DashTab = 'orders' | 'profile' | 'wishlist' | 'addresses' | 'recent' | 'returns';

const ORDER_STEPS: OrderStatus[] = [
  'Order Placed',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

export function CustomerDashboard({
  onSelectProduct,
  onOpenCart,
  onOpenAuth,
  onShopNow,
}: CustomerDashboardProps) {
  const {
    user,
    userProfile,
    orders,
    products,
    wishlistIds,
    recentlyViewedIds,
    cartItems,
    updateCustomerProfile,
    saveAddress,
    deleteAddress,
    cancelOrder,
    requestReturnOrExchange,
    resendVerificationEmail,
    refreshUserVerification,
    logout,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<DashTab>('orders');
  const [nameInput, setNameInput] = useState(userProfile?.displayName || user?.displayName || '');
  const [phoneInput, setPhoneInput] = useState(userProfile?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Address form
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrName, setAddrName] = useState(userProfile?.displayName || '');
  const [addrPhone, setAddrPhone] = useState(userProfile?.phone || '');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('Maharashtra');
  const [addrPincode, setAddrPincode] = useState('');

  // Return modal state
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnType, setReturnType] = useState<'Return' | 'Exchange'>('Exchange');
  const [returnReason, setReturnReason] = useState('');

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id)),
    [products, wishlistIds]
  );

  const recentProducts = useMemo(
    () =>
      recentlyViewedIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [recentlyViewedIds, products]
  );

  const returnOrders = useMemo(() => orders.filter((o) => Boolean(o.returnRequest)), [orders]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <UserIcon className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
        <h1 className="font-display text-3xl font-semibold text-neutral-950 mb-2">Customer Account</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Sign in to manage your profile, track orders, save delivery addresses, and view your wishlist.
        </p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="px-7 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateCustomerProfile(nameInput || user.displayName || 'Customer', phoneInput);
    } catch (err: any) {
      showToast(err?.message || 'Unable to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(addrPincode.trim())) {
      showToast('Enter a valid 6-digit Indian pincode.', 'error');
      return;
    }
    const newAddr: Address = {
      id: sanitizeId(`addr-${Date.now()}`),
      label: addrLabel || 'Home',
      fullName: addrName || userProfile?.displayName || 'Customer',
      phone: addrPhone || '9999999999',
      line1: addrLine1.trim(),
      city: addrCity.trim(),
      state: addrState.trim(),
      pincode: addrPincode.trim(),
      isDefault: (userProfile?.addresses || []).length === 0,
    };
    await saveAddress(newAddr);
    setAddrLine1('');
    setAddrCity('');
    setAddrPincode('');
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrderId || returnReason.trim().length < 5) {
      showToast('Please provide a reason (at least 5 characters).', 'error');
      return;
    }
    await requestReturnOrExchange(returnOrderId, {
      type: returnType,
      reason: returnReason,
    });
    setReturnOrderId(null);
    setReturnReason('');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-1">Customer Dashboard</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-neutral-950">
            Welcome, {userProfile?.displayName || user.displayName || user.email}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenCart}
            className="px-4 py-2 border border-neutral-300 text-xs font-medium inline-flex items-center gap-2 hover:border-neutral-950"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Bag ({cartItems.reduce((s, i) => s + i.quantity, 0)})
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="px-4 py-2 bg-neutral-950 text-white text-xs font-medium inline-flex items-center gap-2 hover:bg-neutral-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {!user.emailVerified && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
          <span>
            Your email ({user.email}) is awaiting verification. Verify to sync profile, orders, and reviews to Cloud Firestore.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void resendVerificationEmail()}
              className="px-3 py-1.5 border border-amber-800 font-medium"
            >
              Resend Link
            </button>
            <button
              type="button"
              onClick={() => void refreshUserVerification()}
              className="px-3 py-1.5 bg-neutral-950 text-white font-medium"
            >
              Refresh Status
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3 space-y-1">
          {(
            [
              { id: 'orders', label: `My Orders & Tracking (${orders.length})`, icon: Package },
              { id: 'profile', label: 'My Profile', icon: UserIcon },
              { id: 'wishlist', label: `My Wishlist (${wishlistProducts.length})`, icon: Heart },
              { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
              { id: 'recent', label: 'Recently Viewed', icon: Clock },
              { id: 'returns', label: 'Returns & Exchanges', icon: RefreshCw },
            ] as { id: DashTab; label: string; icon: any }[]
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full px-4 py-3 text-xs font-medium flex items-center gap-3 border transition-colors text-left ${
                  activeTab === tab.id
                    ? 'border-neutral-950 bg-neutral-950 text-white'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-9">
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {orders.length === 0 ? (
                <div className="border border-neutral-200 p-12 text-center bg-neutral-50">
                  <Package className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                  <p className="text-base font-medium text-neutral-950 mb-1">No orders placed yet</p>
                  <p className="text-xs text-neutral-500 mb-5">
                    When you place an order, you can track every step from packing to doorstep delivery here.
                  </p>
                  <button
                    type="button"
                    onClick={onShopNow}
                    className="px-6 py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider"
                  >
                    Explore Menswear
                  </button>
                </div>
              ) : (
                orders.map((ord) => {
                  const stepIdx = ORDER_STEPS.indexOf(ord.status);
                  const canCancel = ord.status === 'Order Placed' || ord.status === 'Confirmed';
                  const canReturn = ord.status === 'Delivered' && !ord.returnRequest;

                  return (
                    <div key={ord.id} className="border border-neutral-200 p-6 space-y-5 bg-white">
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                        <div>
                          <p className="text-xs font-mono-tabular font-semibold text-neutral-950">
                            Order #{ord.orderNumber}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Placed {formatDateTime(ord.createdAt)} · {ord.paymentMethod} ({ord.paymentStatus})
                          </p>
                        </div>
                        <div className="text-right tabular-nums">
                          <span className="text-sm font-semibold text-neutral-950 block">
                            {formatINR(ord.totalAmount)}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              ord.status === 'Cancelled'
                                ? 'text-red-600'
                                : ord.status === 'Delivered'
                                  ? 'text-emerald-700'
                                  : 'text-neutral-800'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </div>
                      </div>

                      {/* Order Tracking Timeline */}
                      {ord.status !== 'Cancelled' ? (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 py-2">
                          {ORDER_STEPS.map((st, idx) => {
                            const done = stepIdx >= idx;
                            return (
                              <div key={st} className="space-y-1.5">
                                <div className={`h-1.5 ${done ? 'bg-neutral-950' : 'bg-neutral-200'}`} />
                                <span
                                  className={`block text-[11px] leading-tight ${
                                    done ? 'font-semibold text-neutral-950' : 'text-neutral-400'
                                  }`}
                                >
                                  {st}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-red-600 font-medium">This order was cancelled.</p>
                      )}

                      {/* Ordered Items */}
                      <div className="divide-y divide-neutral-100">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={item.image}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                className="w-11 h-12 object-cover bg-neutral-100 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-medium text-neutral-950 truncate">{item.name}</p>
                                <p className="text-neutral-500">
                                  Size {item.size} · {item.color} · Qty {item.quantity}
                                </p>
                              </div>
                            </div>
                            <span className="font-semibold tabular-nums shrink-0">
                              {formatINR(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      {(canCancel || canReturn || ord.returnRequest) && (
                        <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          {ord.returnRequest && (
                            <span className="text-neutral-700">
                              {ord.returnRequest.type} Request: <strong>{ord.returnRequest.status}</strong> —{' '}
                              {ord.returnRequest.reason}
                            </span>
                          )}
                          <div className="flex gap-2 ml-auto">
                            {canCancel && (
                              <button
                                type="button"
                                onClick={() => void cancelOrder(ord.id)}
                                className="px-3.5 py-2 border border-red-300 text-red-700 hover:bg-red-50 font-medium"
                              >
                                Cancel Order
                              </button>
                            )}
                            {canReturn && (
                              <button
                                type="button"
                                onClick={() => setReturnOrderId(ord.id)}
                                className="px-3.5 py-2 border border-neutral-950 text-neutral-950 hover:bg-neutral-100 font-medium"
                              >
                                Request Return / Exchange
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="border border-neutral-200 p-6 sm:p-8 max-w-xl space-y-5">
              <h2 className="font-display text-2xl font-semibold text-neutral-950">Personal Details</h2>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Email</label>
                <input
                  type="email"
                  disabled
                  value={user.email || ''}
                  className="w-full px-3.5 py-2.5 border border-neutral-200 bg-neutral-50 text-sm text-neutral-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile || !user.emailVerified}
                className="px-6 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}

          {activeTab === 'wishlist' && (
            <div>
              {wishlistProducts.length === 0 ? (
                <div className="border border-neutral-200 p-12 text-center bg-neutral-50">
                  <p className="text-base font-medium text-neutral-950 mb-1">Your wishlist is empty</p>
                  <p className="text-xs text-neutral-500 mb-5">Save pieces you love to compare fits and offers later.</p>
                  <button
                    type="button"
                    onClick={onShopNow}
                    className="px-6 py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider"
                  >
                    Discover Styles
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistProducts.map((p) => (
                    <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(userProfile?.addresses || []).map((addr) => (
                  <div key={addr.id} className="border border-neutral-200 p-5 flex flex-col justify-between gap-3">
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-neutral-950">
                        {addr.label} {addr.isDefault ? '· Default' : ''}
                      </p>
                      <p className="font-medium text-neutral-900">{addr.fullName}</p>
                      <p className="text-neutral-600">
                        {addr.line1}, {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-neutral-500">Phone: {addr.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteAddress(addr.id)}
                      className="text-xs text-red-600 hover:underline inline-flex items-center gap-1 self-start"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddAddress} className="border border-neutral-200 p-6 space-y-4 max-w-xl">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">Add New Address</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={addrLabel}
                    onChange={(e) => setAddrLabel(e.target.value)}
                    placeholder="Label (Home / Office)"
                    className="px-3 py-2 border border-neutral-300 text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={addrName}
                    onChange={(e) => setAddrName(e.target.value)}
                    placeholder="Recipient Full Name"
                    className="px-3 py-2 border border-neutral-300 text-xs"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  placeholder="House / Street / Locality"
                  className="w-full px-3 py-2 border border-neutral-300 text-xs"
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="City"
                    className="px-3 py-2 border border-neutral-300 text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    placeholder="State"
                    className="px-3 py-2 border border-neutral-300 text-xs"
                  />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={addrPincode}
                    onChange={(e) => setAddrPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit Pincode"
                    className="px-3 py-2 border border-neutral-300 text-xs"
                  />
                </div>
                <input
                  type="tel"
                  required
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  placeholder="Mobile Number"
                  className="w-full px-3 py-2 border border-neutral-300 text-xs"
                />
                <button
                  type="submit"
                  disabled={!user.emailVerified}
                  className="px-5 py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
                >
                  Save Address
                </button>
              </form>
            </div>
          )}

          {activeTab === 'recent' && (
            <div>
              {recentProducts.length === 0 ? (
                <div className="border border-neutral-200 p-10 text-center text-sm text-neutral-500">
                  No recently viewed items yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentProducts.map((p) => (
                    <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-4">
              {returnOrders.length === 0 ? (
                <div className="border border-neutral-200 p-10 text-center text-sm text-neutral-500">
                  You have no return or exchange requests. Delivered orders can be requested for exchange from My Orders.
                </div>
              ) : (
                returnOrders.map((ord) => (
                  <div key={ord.id} className="border border-neutral-200 p-5 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-neutral-950">
                        Order #{ord.orderNumber} · {ord.returnRequest?.type}
                      </p>
                      <p className="text-neutral-600 mt-1">{ord.returnRequest?.reason}</p>
                    </div>
                    <span className="font-semibold text-neutral-950">{ord.returnRequest?.status}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Return/Exchange Modal */}
      {returnOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form onSubmit={handleSubmitReturn} className="bg-white max-w-md w-full p-6 border border-neutral-200 space-y-4">
            <h3 className="font-display text-2xl font-semibold text-neutral-950">Return or Exchange</h3>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Request Type</label>
              <select
                value={returnType}
                onChange={(e) => setReturnType(e.target.value as 'Return' | 'Exchange')}
                className="w-full px-3 py-2 border border-neutral-300 text-xs bg-white"
              >
                <option value="Exchange">Size / Colour Exchange</option>
                <option value="Return">Full Return & Refund</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Reason</label>
              <textarea
                rows={3}
                required
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g. Need size L instead of M"
                className="w-full px-3 py-2 border border-neutral-300 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReturnOrderId(null)}
                className="px-4 py-2 border border-neutral-300 text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-neutral-950 text-white text-xs font-semibold">
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
