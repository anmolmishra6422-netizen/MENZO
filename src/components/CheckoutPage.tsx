import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, CreditCard, Lock, MapPin, RefreshCw, ShieldAlert } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Address, Order, PaymentMethod } from '../types/ecommerce';
import { formatINR, sanitizeId } from '../utils/format';

interface CheckoutPageProps {
  onOpenAuth: () => void;
  onContinueShopping: () => void;
  onViewOrders: () => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
];

export function CheckoutPage({ onOpenAuth, onContinueShopping, onViewOrders }: CheckoutPageProps) {
  const {
    user,
    userProfile,
    cartItems,
    cartSubtotal,
    cartDiscount,
    deliveryCharge,
    cartTotal,
    appliedCoupon,
    isPlacingOrder,
    placeOrder,
    saveAddress,
    resendVerificationEmail,
    refreshUserVerification,
    showToast,
  } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [testModeAck, setTestModeAck] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      setCustomerName(userProfile?.displayName || user.displayName || '');
      setCustomerEmail(userProfile?.email || user.email || '');
      setCustomerPhone(userProfile?.phone || '');
      const savedAddrs = userProfile?.addresses || [];
      if (savedAddrs.length > 0) {
        const def = savedAddrs.find((a) => a.isDefault) || savedAddrs[0];
        setSelectedAddressId(def.id);
      }
    }
  }, [user, userProfile]);

  if (placedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
        <div className="border border-neutral-200 p-8 sm:p-10 bg-white space-y-6">
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="w-7 h-7" />
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold">
                Order #{placedOrder.orderNumber} Placed
              </p>
              <h1 className="font-display text-3xl text-neutral-950 font-semibold">
                Thank you for shopping with MENZO
              </h1>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <strong>Test Checkout Mode (MVP):</strong> Payment status recorded as{' '}
            <span className="font-semibold">{placedOrder.paymentStatus}</span> via{' '}
            <span className="font-semibold">{placedOrder.paymentMethod}</span>. No live card or bank charge was processed.
          </div>

          <div className="border-t border-b border-neutral-200 py-4 space-y-2 text-sm tabular-nums">
            <div className="flex justify-between">
              <span className="text-neutral-600">Delivering to</span>
              <span className="font-medium text-right">
                {placedOrder.shippingAddress.fullName}, {placedOrder.shippingAddress.city} - {placedOrder.shippingAddress.pincode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Items</span>
              <span className="font-medium">{placedOrder.items.reduce((s, i) => s + i.quantity, 0)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-2 border-t border-neutral-100">
              <span>Order Total</span>
              <span>{formatINR(placedOrder.totalAmount)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onViewOrders}
              className="px-6 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800"
            >
              Track Order in Dashboard
            </button>
            <button
              type="button"
              onClick={onContinueShopping}
              className="px-6 py-3 border border-neutral-300 text-neutral-950 text-xs font-semibold uppercase tracking-wider hover:border-neutral-950"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-neutral-950 mb-3">Your Bag is Empty</h1>
        <p className="text-sm text-neutral-600 mb-6">Add pieces to your bag before checking out.</p>
        <button
          type="button"
          onClick={onContinueShopping}
          className="px-7 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider"
        >
          Browse Catalogue
        </button>
      </div>
    );
  }

  const savedAddresses = userProfile?.addresses || [];

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user || !user.emailVerified) {
      setErrorMsg('Please sign in with a verified account to place your order.');
      return;
    }

    const phoneClean = customerPhone.replace(/\s+/g, '');
    if (phoneClean.length < 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    let finalAddress: Address;
    if (selectedAddressId !== 'new') {
      const found = savedAddresses.find((a) => a.id === selectedAddressId);
      if (!found) {
        setErrorMsg('Please select a valid delivery address.');
        return;
      }
      finalAddress = found;
    } else {
      if (line1.trim().length < 5 || city.trim().length < 2 || !/^\d{6}$/.test(pincode.trim())) {
        setErrorMsg('Please complete street address, city, and a valid 6-digit Indian pincode.');
        return;
      }
      finalAddress = {
        id: sanitizeId(`addr-${Date.now()}`),
        label: 'Primary Delivery',
        fullName: customerName.trim(),
        phone: phoneClean,
        line1: line1.trim(),
        line2: line2.trim(),
        city: city.trim(),
        state,
        pincode: pincode.trim(),
        isDefault: savedAddresses.length === 0,
      };
      if (saveNewAddress) {
        await saveAddress(finalAddress);
      }
    }

    if (paymentMethod !== 'COD' && !testModeAck) {
      setErrorMsg('Please acknowledge the Test Checkout Mode notice before continuing.');
      return;
    }

    try {
      const created = await placeOrder({
        customerName,
        customerEmail,
        customerPhone: phoneClean,
        shippingAddress: finalAddress,
        paymentMethod,
      });
      setPlacedOrder(created);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not place order. Please verify your details.');
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
      <div className="pb-6 border-b border-neutral-200 mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-1">MENZO Checkout</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-neutral-950">
          Delivery & Payment
        </h1>
      </div>

      {/* Authentication Gate */}
      {!user ? (
        <div className="border border-neutral-300 bg-neutral-50 p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-neutral-900 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-neutral-950">Sign in required to place order</p>
              <p className="text-xs text-neutral-600 mt-0.5">
                Every MENZO order is securely linked to your customer account for live tracking and returns.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-6 py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
          >
            Sign In / Register
          </button>
        </div>
      ) : !user.emailVerified ? (
        <div className="border border-amber-300 bg-amber-50 p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-950">Verify your email to complete checkout</p>
              <p className="text-xs text-amber-900 mt-0.5">
                Check <strong>{user.email}</strong> for your verification link, then click Refresh Status.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void resendVerificationEmail()}
              className="px-4 py-2 border border-amber-800 text-amber-950 text-xs font-medium"
            >
              Resend Email
            </button>
            <button
              type="button"
              onClick={() => void refreshUserVerification()}
              className="px-4 py-2 bg-neutral-950 text-white text-xs font-medium inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Status
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Form */}
        <form onSubmit={handleSubmitOrder} className="lg:col-span-7 space-y-8">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Customer Contact */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950 border-b border-neutral-200 pb-2">
              1. Customer Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm bg-neutral-50"
              />
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950 border-b border-neutral-200 pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              2. Delivery Address
            </h2>

            {savedAddresses.length > 0 && (
              <div className="space-y-2.5">
                {savedAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-4 border cursor-pointer ${
                      selectedAddressId === addr.id ? 'border-neutral-950 bg-neutral-50' : 'border-neutral-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="savedAddress"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 accent-neutral-950"
                    />
                    <div className="text-xs space-y-0.5">
                      <p className="font-semibold text-neutral-950">
                        {addr.fullName} · {addr.label}
                      </p>
                      <p className="text-neutral-600">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-neutral-500">Phone: {addr.phone}</p>
                    </div>
                  </label>
                ))}

                <label
                  className={`flex items-center gap-3 p-3.5 border cursor-pointer text-xs font-medium ${
                    selectedAddressId === 'new' ? 'border-neutral-950 bg-neutral-50' : 'border-neutral-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="savedAddress"
                    checked={selectedAddressId === 'new'}
                    onChange={() => setSelectedAddressId('new')}
                    className="accent-neutral-950"
                  />
                  <span>Add a new delivery address</span>
                </label>
              </div>
            )}

            {selectedAddressId === 'new' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Flat / House No., Building, Street
                  </label>
                  <input
                    type="text"
                    required
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    placeholder="402, Sea Breeze Apartments, Bandra West"
                    className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Landmark / Area (Optional)
                  </label>
                  <input
                    type="text"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                    placeholder="Near Carter Road Promenade"
                    className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Mumbai"
                      className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">State</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2.5 border border-neutral-300 text-sm bg-white"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="400050"
                      className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm tabular-nums"
                    />
                  </div>
                </div>
                {user?.emailVerified && (
                  <label className="flex items-center gap-2 text-xs text-neutral-600 pt-1">
                    <input
                      type="checkbox"
                      checked={saveNewAddress}
                      onChange={(e) => setSaveNewAddress(e.target.checked)}
                      className="accent-neutral-950"
                    />
                    <span>Save this address to my MENZO profile</span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Payment Method + Honest Test Mode Disclosure */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950 border-b border-neutral-200 pb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              3. Payment Method
            </h2>

            <div className="p-4 bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
              <div>
                <p className="font-semibold">MVP Test Checkout Mode Active</p>
                <p className="mt-0.5 text-amber-900">
                  Live Razorpay / Stripe gateway credentials are not configured in this environment. Orders placed
                  here are stored securely in Firestore as <strong>Test Mode</strong> orders without processing real money.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  { id: 'UPI', label: 'UPI (Test Mode)', desc: 'GPay, PhonePe, Paytm UPI flow' },
                  { id: 'Card', label: 'Credit / Debit Card (Test)', desc: 'Visa, Mastercard, RuPay' },
                  { id: 'NetBanking', label: 'Net Banking (Test)', desc: 'HDFC, ICICI, SBI, Axis' },
                  { id: 'COD', label: 'Cash on Delivery (COD)', desc: 'Pay in cash or UPI upon delivery' },
                ] as { id: PaymentMethod; label: string; desc: string }[]
              ).map((pm) => (
                <label
                  key={pm.id}
                  className={`p-3.5 border cursor-pointer flex items-start gap-2.5 ${
                    paymentMethod === pm.id ? 'border-neutral-950 bg-neutral-50' : 'border-neutral-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === pm.id}
                    onChange={() => setPaymentMethod(pm.id)}
                    className="mt-0.5 accent-neutral-950"
                  />
                  <div>
                    <span className="text-xs font-semibold text-neutral-950 block">{pm.label}</span>
                    <span className="text-[11px] text-neutral-500">{pm.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            {paymentMethod !== 'COD' && (
              <label className="flex items-start gap-2 text-xs text-neutral-700">
                <input
                  type="checkbox"
                  checked={testModeAck}
                  onChange={(e) => setTestModeAck(e.target.checked)}
                  className="mt-0.5 accent-neutral-950"
                />
                <span>
                  I understand this order uses Test Checkout Mode and no real online payment is charged.
                </span>
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={!user?.emailVerified || isPlacingOrder}
            onClick={() => {
              if (!user) {
                showToast('Please sign in first', 'error');
              }
            }}
            className="w-full py-4 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-40"
          >
            {isPlacingOrder
              ? 'Placing Order...'
              : `Place Order (${paymentMethod === 'COD' ? 'COD' : 'Test Mode'}) · ${formatINR(cartTotal)}`}
          </button>
        </form>

        {/* Right Summary */}
        <aside className="lg:col-span-5">
          <div className="border border-neutral-200 p-6 bg-neutral-50 space-y-5 sticky top-24">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950 pb-3 border-b border-neutral-200">
              Order Summary
            </h2>

            <div className="divide-y divide-neutral-200 max-h-80 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-14 object-cover bg-white border border-neutral-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-neutral-950 truncate">{item.name}</p>
                      <p className="text-[11px] text-neutral-500">
                        {item.size} · {item.color} · Qty {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-neutral-950 tabular-nums shrink-0">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-2 text-sm tabular-nums">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>{formatINR(cartSubtotal)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon ({appliedCoupon?.code})</span>
                  <span>-{formatINR(cartDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Pan-India Delivery</span>
                <span>{deliveryCharge === 0 ? 'Free' : formatINR(deliveryCharge)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-neutral-950 pt-3 border-t border-neutral-200">
                <span>Total Payable</span>
                <span>{formatINR(cartTotal)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
