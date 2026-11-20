import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  Database,
  LogOut,
  Package,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Trash2,
  Users,
} from 'lucide-react';
import {
  IMG_ACCESSORIES,
  IMG_BLAZER,
  IMG_BOOTS,
  IMG_CHINOS,
  IMG_HOODIE,
  IMG_INNERWEAR,
  IMG_JACKET,
  IMG_KURTA,
  IMG_SHIRT,
  IMG_SNEAKERS,
  IMG_SPORTS,
  SPECIAL_COLLECTIONS,
} from '../data/catalogSeed';
import { useStore } from '../context/StoreContext';
import {
  Coupon,
  OrderStatus,
  PaymentStatus,
  Product,
  PromoBanner,
  ReturnRequest,
} from '../types/ecommerce';
import { formatDateTime, formatINR, PRIMARY_ADMIN_EMAIL, sanitizeId } from '../utils/format';

type AdminTab = 'overview' | 'products' | 'orders' | 'customers' | 'offers';

const STUDIO_IMAGES = [
  { label: 'Linen Shirt & Tee', url: IMG_SHIRT },
  { label: 'Wool Overshirt Jacket', url: IMG_JACKET },
  { label: 'Chinos & Selvedge Jeans', url: IMG_CHINOS },
  { label: 'Raw-Silk Kurta & Nehru', url: IMG_KURTA },
  { label: 'Activewear & Joggers', url: IMG_SPORTS },
  { label: 'Modal Lounge Set', url: IMG_INNERWEAR },
  { label: 'Leather Sneakers & Loafers', url: IMG_SNEAKERS },
  { label: 'Chronograph & Leather Set', url: IMG_ACCESSORIES },
  { label: 'Oversized Hoodie & Cargo', url: IMG_HOODIE },
  { label: 'Midnight Wool Blazer', url: IMG_BLAZER },
  { label: 'Cognac Chelsea Boots', url: IMG_BOOTS },
];

export function AdminPortal({ onExitToStore }: { onExitToStore: () => void }) {
  const {
    user,
    authReady,
    isAdmin,
    adminChecked,
    products,
    categories,
    brands,
    allOrders,
    allUsers,
    coupons,
    banners,
    contactMessages,
    subscribers,
    isUsingSeedCatalog,
    signInWithGoogle,
    loginWithEmail,
    logout,
    seedCatalogToFirestore,
    saveProduct,
    deleteProduct,
    saveCategory,
    saveBrand,
    updateOrderStatusAdmin,
    updateReturnStatusAdmin,
    toggleUserDisabledAdmin,
    saveCouponAdmin,
    deleteCouponAdmin,
    saveBannerAdmin,
    deleteBannerAdmin,
    showToast,
  } = useStore();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [seeding, setSeeding] = useState(false);

  // Product editor state
  const [editingProd, setEditingProd] = useState<Partial<Product> | null>(null);
  const [isNewProd, setIsNewProd] = useState(true);
  const [sizesInput, setSizesInput] = useState('S, M, L, XL');
  const [colorsInput, setColorsInput] = useState('Pitch Black:#141414, Chalk White:#F4F4F0');
  const [collectionsInput, setCollectionsInput] = useState<string[]>(['New Arrivals']);

  // Brand & Category quick add
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandOrigin, setNewBrandOrigin] = useState('Mumbai, India');
  const [newCatName, setNewCatName] = useState('');
  const [newCatSubs, setNewCatSubs] = useState('');

  // Coupon form
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'flat'>('percent');
  const [couponValue, setCouponValue] = useState(15);
  const [couponMinOrder, setCouponMinOrder] = useState(2000);
  const [couponMaxDisc, setCouponMaxDisc] = useState(1000);
  const [couponExpiry, setCouponExpiry] = useState('2027-12-31');
  const [couponDesc, setCouponDesc] = useState('');

  // Banner form
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerCta, setBannerCta] = useState('Explore Edit');
  const [bannerFilter, setBannerFilter] = useState('New Arrivals');

  const analytics = useMemo(() => {
    const validOrders = allOrders.filter((o) => o.status !== 'Cancelled');
    const totalSales = validOrders.reduce((s, o) => s + o.totalAmount, 0);
    const lowStock = products.filter((p) => p.stock <= 10);

    const revByCat: Record<string, number> = {};
    for (const ord of validOrders) {
      for (const item of ord.items) {
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod?.category || 'Apparel';
        revByCat[cat] = (revByCat[cat] || 0) + item.price * item.quantity;
      }
    }
    const maxCatRev = Math.max(1, ...Object.values(revByCat));

    return { totalSales, lowStock, revByCat, maxCatRev };
  }, [allOrders, products]);

  // 1. Admin Login Screen (completely separate from Customer AuthModal)
  if (!authReady || !adminChecked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <p className="text-sm text-neutral-500">Verifying administrator credentials...</p>
      </div>
    );
  }

  if (!user) {
    const handleAdminEmailLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError('');
      try {
        await loginWithEmail(adminEmail, adminPass);
      } catch (err: any) {
        setAuthError(err?.message || 'Invalid administrator credentials.');
      }
    };

    return (
      <div className="min-h-[80vh] bg-neutral-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-neutral-800 bg-neutral-900 p-8 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-1">MENZO Operations</p>
            <h1 className="font-display text-3xl font-semibold text-white">Admin Portal Sign In</h1>
            <p className="text-xs text-neutral-400 mt-2">
              Restricted to verified MENZO administrators. Customer accounts cannot access this portal.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-xs text-red-200">{authError}</div>
          )}

          <button
            type="button"
            onClick={() => signInWithGoogle().catch((e) => setAuthError(e?.message || 'Sign-in cancelled'))}
            className="w-full py-3 bg-white text-neutral-950 text-xs font-semibold uppercase tracking-wider hover:bg-neutral-200 transition-colors"
          >
            Sign In with Admin Google Account
          </button>

          <div className="relative text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800" />
            </div>
            <span className="relative bg-neutral-900 px-3 text-[11px] uppercase tracking-wider text-neutral-500">
              or administrator credentials
            </span>
          </div>

          <form onSubmit={handleAdminEmailLogin} className="space-y-3">
            <input
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="Admin email"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 text-sm text-white"
            />
            <input
              type="password"
              required
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              placeholder="Password"
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 text-sm text-white"
            />
            <button
              type="submit"
              className="w-full py-3 border border-neutral-600 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800"
            >
              Sign In to Admin Portal
            </button>
          </form>

          <button
            type="button"
            onClick={onExitToStore}
            className="w-full text-xs text-neutral-400 hover:text-white underline underline-offset-4 pt-2"
          >
            Return to Public Storefront
          </button>
        </div>
      </div>
    );
  }

  // 2. Strict Role Isolation Gate
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-neutral-200 p-8 space-y-5 text-center">
          <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" />
          <h1 className="font-display text-3xl font-semibold text-neutral-950">Administrator Access Denied</h1>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Signed in as <strong>{user.email}</strong>. This account does not hold verified MENZO administrator
            privileges (only trusted server/database allowlisted administrators such as{' '}
            <span className="font-mono-tabular text-xs">{PRIMARY_ADMIN_EMAIL}</span> or entries in{' '}
            <span className="font-mono-tabular text-xs">adminUsers</span> are permitted).
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onExitToStore}
              className="px-6 py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider"
            >
              Return to Storefront
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="px-6 py-2.5 border border-neutral-300 text-xs font-semibold uppercase tracking-wider"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helpers for Product Editor
  const openNewProduct = () => {
    setIsNewProd(true);
    setEditingProd({
      id: `mz-prod-${Date.now().toString().slice(-6)}`,
      name: '',
      slug: '',
      brand: brands[0]?.name || 'MENZO Atelier',
      category: 'Topwear',
      subcategory: 'Casual shirts',
      description: '',
      fabric: '100% Cotton',
      fit: 'Tailored Fit',
      occasion: 'Everyday Casual',
      price: 2499,
      originalPrice: 3499,
      discountPercent: 29,
      images: [IMG_SHIRT],
      stock: 25,
      rating: 4.8,
      reviewCount: 0,
      isDemo: false,
      featured: true,
    });
    setSizesInput('S, M, L, XL');
    setColorsInput('Pitch Black:#141414, Chalk White:#F4F4F0');
    setCollectionsInput(['New Arrivals']);
  };

  const openEditProduct = (p: Product) => {
    setIsNewProd(false);
    setEditingProd({ ...p });
    setSizesInput(p.sizes.join(', '));
    setColorsInput(p.colors.map((c) => `${c.name}:${c.hex}`).join(', '));
    setCollectionsInput(p.collections || []);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProd) return;
    const price = Number(editingProd.price || 0);
    const orig = Math.max(price, Number(editingProd.originalPrice || price));
    const disc = orig > 0 ? Math.round(((orig - price) / orig) * 100) : 0;

    const sizes = sizesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 15);
    const colors = colorsInput
      .split(',')
      .map((pair) => {
        const [name, hex] = pair.split(':').map((x) => x.trim());
        return name ? { name, hex: hex || '#18181B' } : null;
      })
      .filter((x): x is { name: string; hex: string } => Boolean(x))
      .slice(0, 12);

    const payload: Omit<Product, 'createdAt' | 'updatedAt'> = {
      id: sanitizeId(editingProd.id || `mz-${Date.now()}`),
      name: (editingProd.name || 'Untitled Product').trim(),
      slug: sanitizeId(editingProd.name || 'product').toLowerCase(),
      brand: editingProd.brand || 'MENZO Atelier',
      category: editingProd.category || 'Topwear',
      subcategory: editingProd.subcategory || 'Casual shirts',
      collections: collectionsInput,
      description: (editingProd.description || 'Crafted MENZO menswear essential.').trim(),
      fabric: editingProd.fabric || '100% Cotton',
      fit: editingProd.fit || 'Regular Fit',
      occasion: editingProd.occasion || 'Everyday',
      price,
      originalPrice: orig,
      discountPercent: disc,
      sizes: sizes.length > 0 ? sizes : ['M', 'L'],
      colors: colors.length > 0 ? colors : [{ name: 'Black', hex: '#18181B' }],
      images: (editingProd.images && editingProd.images.length > 0 ? editingProd.images : [IMG_SHIRT]).slice(0, 8),
      stock: Math.max(0, Number(editingProd.stock || 0)),
      rating: Number(editingProd.rating || 4.8),
      reviewCount: Number(editingProd.reviewCount || 0),
      isDemo: Boolean(editingProd.isDemo),
      featured: Boolean(editingProd.featured),
    };

    await saveProduct(payload, isNewProd);
    setEditingProd(null);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code.length < 3) return;
    const payload: Omit<Coupon, 'createdAt' | 'updatedAt'> = {
      id: sanitizeId(`coupon-${code.toLowerCase()}`),
      code,
      discountType: couponType,
      discountValue: Number(couponValue),
      minOrderValue: Number(couponMinOrder),
      maxDiscount: Number(couponMaxDisc),
      expiresAt: couponExpiry,
      active: true,
      description: couponDesc.trim() || `${couponType === 'percent' ? `${couponValue}%` : `₹${couponValue}`} off`,
    };
    await saveCouponAdmin(payload, true);
    setCouponCode('');
    setCouponDesc('');
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim()) return;
    const payload: Omit<PromoBanner, 'updatedAt'> = {
      id: sanitizeId(`banner-${Date.now()}`),
      title: bannerTitle.trim(),
      subtitle: bannerSubtitle.trim(),
      ctaText: bannerCta.trim() || 'Shop Now',
      targetFilter: bannerFilter.trim() || 'New Arrivals',
      active: true,
      displayOrder: banners.length + 1,
    };
    await saveBannerAdmin(payload);
    setBannerTitle('');
    setBannerSubtitle('');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Admin Top Header */}
      <div className="bg-neutral-950 text-white px-4 sm:px-8 py-4 border-b border-neutral-800">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-display text-2xl font-bold tracking-[0.14em] uppercase">MENZO</span>
            <span className="text-xs text-neutral-400 border-l border-neutral-700 pl-4 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Admin Portal · {user.email}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                setSeeding(true);
                try {
                  await seedCatalogToFirestore();
                } finally {
                  setSeeding(false);
                }
              }}
              disabled={seeding}
              className="px-3.5 py-2 border border-neutral-700 text-xs font-medium hover:bg-neutral-800 inline-flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              {seeding ? 'Syncing...' : isUsingSeedCatalog ? 'Sync Sample Catalog to Firestore' : 'Resync Sample Catalog'}
            </button>
            <button
              type="button"
              onClick={onExitToStore}
              className="px-3.5 py-2 border border-neutral-700 text-xs font-medium hover:bg-neutral-800"
            >
              View Storefront
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="px-3.5 py-2 bg-white text-neutral-950 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Admin Sub-Nav */}
      <div className="bg-white border-b border-neutral-200 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto flex overflow-x-auto gap-6">
          {(
            [
              { id: 'overview', label: 'Dashboard & Analytics', icon: BarChart3 },
              { id: 'products', label: `Products (${products.length})`, icon: Package },
              { id: 'orders', label: `Orders (${allOrders.length})`, icon: ShieldCheck },
              { id: 'customers', label: `Customers (${allUsers.length})`, icon: Users },
              { id: 'offers', label: 'Offers, Banners & Inbox', icon: Tag },
            ] as { id: AdminTab; label: string; icon: any }[]
          ).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`py-4 text-xs font-semibold uppercase tracking-wider border-b-2 flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
                  tab === item.id
                    ? 'border-neutral-950 text-neutral-950'
                    : 'border-transparent text-neutral-500 hover:text-neutral-950'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8">
        {/* TAB 1: OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-neutral-200 p-5">
                <span className="text-xs uppercase tracking-wider text-neutral-500 block">Total Sales</span>
                <span className="font-display text-3xl font-semibold text-neutral-950 tabular-nums mt-2 block">
                  {formatINR(analytics.totalSales)}
                </span>
              </div>
              <div className="bg-white border border-neutral-200 p-5">
                <span className="text-xs uppercase tracking-wider text-neutral-500 block">Total Orders</span>
                <span className="font-display text-3xl font-semibold text-neutral-950 tabular-nums mt-2 block">
                  {allOrders.length}
                </span>
              </div>
              <div className="bg-white border border-neutral-200 p-5">
                <span className="text-xs uppercase tracking-wider text-neutral-500 block">Registered Customers</span>
                <span className="font-display text-3xl font-semibold text-neutral-950 tabular-nums mt-2 block">
                  {allUsers.length}
                </span>
              </div>
              <div className="bg-white border border-neutral-200 p-5">
                <span className="text-xs uppercase tracking-wider text-neutral-500 block">Active Products</span>
                <span className="font-display text-3xl font-semibold text-neutral-950 tabular-nums mt-2 block">
                  {products.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Revenue by Category */}
              <div className="lg:col-span-6 bg-white border border-neutral-200 p-6 space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950">
                  Revenue Analytics by Category
                </h2>
                {Object.keys(analytics.revByCat).length === 0 ? (
                  <p className="text-xs text-neutral-500 py-8 text-center">
                    No order revenue recorded yet. Placed orders will aggregate here in real time.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(analytics.revByCat).map(([cat, rev]) => (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs tabular-nums">
                          <span className="font-medium text-neutral-800">{cat}</span>
                          <span className="font-semibold text-neutral-950">{formatINR(rev)}</span>
                        </div>
                        <div className="h-2 bg-neutral-100">
                          <div
                            className="h-2 bg-neutral-950"
                            style={{ width: `${Math.round((rev / analytics.maxCatRev) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Low-Stock Alerts */}
              <div className="lg:col-span-6 bg-white border border-neutral-200 p-6 space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Low-Stock Products ({analytics.lowStock.length})
                </h2>
                {analytics.lowStock.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-8 text-center">All products have healthy stock (&gt;10 units).</p>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {analytics.lowStock.map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                        <div>
                          <p className="font-medium text-neutral-950">{p.name}</p>
                          <p className="text-neutral-500">{p.brand} · {p.category}</p>
                        </div>
                        <span className="font-semibold text-amber-700 tabular-nums shrink-0">
                          {p.stock} left
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white border border-neutral-200 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-950 mb-4">
                Recent Orders
              </h2>
              {allOrders.length === 0 ? (
                <p className="text-xs text-neutral-500 py-6">No customer orders yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left tabular-nums">
                    <thead>
                      <tr className="border-b border-neutral-200 text-neutral-500">
                        <th className="py-2.5 pr-4">Order #</th>
                        <th className="py-2.5 pr-4">Customer</th>
                        <th className="py-2.5 pr-4">Total</th>
                        <th className="py-2.5 pr-4">Payment</th>
                        <th className="py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {allOrders.slice(0, 8).map((o) => (
                        <tr key={o.id}>
                          <td className="py-3 pr-4 font-mono-tabular font-semibold">{o.orderNumber}</td>
                          <td className="py-3 pr-4">{o.customerName}</td>
                          <td className="py-3 pr-4 font-semibold">{formatINR(o.totalAmount)}</td>
                          <td className="py-3 pr-4">{o.paymentMethod} ({o.paymentStatus})</td>
                          <td className="py-3 font-medium">{o.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS + CATEGORIES & BRANDS */}
        {tab === 'products' && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold text-neutral-950">Product Catalogue</h2>
              <button
                type="button"
                onClick={openNewProduct}
                className="px-5 py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New Product
              </button>
            </div>

            {/* Product Editor Modal/Panel */}
            {editingProd && (
              <form onSubmit={handleSaveProduct} className="bg-white border border-neutral-950 p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider">
                    {isNewProd ? 'Create New Product' : `Edit: ${editingProd.name}`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingProd(null)}
                    className="text-xs text-neutral-500 underline"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      value={editingProd.name || ''}
                      onChange={(e) => setEditingProd({ ...editingProd, name: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Brand</label>
                    <select
                      value={editingProd.brand || ''}
                      onChange={(e) => setEditingProd({ ...editingProd, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 bg-white"
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Category</label>
                    <select
                      value={editingProd.category || 'Topwear'}
                      onChange={(e) => setEditingProd({ ...editingProd, category: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 bg-white"
                    >
                      {categories
                        .filter((c) => c.name !== 'Special Collections')
                        .map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Subcategory</label>
                    <input
                      type="text"
                      required
                      value={editingProd.subcategory || ''}
                      onChange={(e) => setEditingProd({ ...editingProd, subcategory: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editingProd.price || 0}
                      onChange={(e) => setEditingProd({ ...editingProd, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-neutral-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Original MRP (₹)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editingProd.originalPrice || 0}
                      onChange={(e) => setEditingProd({ ...editingProd, originalPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-neutral-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Stock Qty</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editingProd.stock || 0}
                      onChange={(e) => setEditingProd({ ...editingProd, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-neutral-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Fabric</label>
                    <input
                      type="text"
                      value={editingProd.fabric || ''}
                      onChange={(e) => setEditingProd({ ...editingProd, fabric: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Fit & Occasion</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editingProd.fit || ''}
                        onChange={(e) => setEditingProd({ ...editingProd, fit: e.target.value })}
                        placeholder="Fit"
                        className="px-2.5 py-2 border border-neutral-300"
                      />
                      <input
                        type="text"
                        value={editingProd.occasion || ''}
                        onChange={(e) => setEditingProd({ ...editingProd, occasion: e.target.value })}
                        placeholder="Occasion"
                        className="px-2.5 py-2 border border-neutral-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Sizes (comma separated)</label>
                    <input
                      type="text"
                      value={sizesInput}
                      onChange={(e) => setSizesInput(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">
                      Colours (Name:#HEX, comma separated)
                    </label>
                    <input
                      type="text"
                      value={colorsInput}
                      onChange={(e) => setColorsInput(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-medium text-neutral-700 mb-1">
                    Product Image URL or Studio Asset
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      required
                      value={editingProd.images?.[0] || ''}
                      onChange={(e) => setEditingProd({ ...editingProd, images: [e.target.value] })}
                      className="flex-1 min-w-[240px] px-3 py-2 border border-neutral-300"
                    />
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) setEditingProd({ ...editingProd, images: [e.target.value] });
                      }}
                      className="px-3 py-2 border border-neutral-300 bg-white"
                    >
                      <option value="">Choose Studio Image...</option>
                      {STUDIO_IMAGES.map((s) => (
                        <option key={s.label} value={s.url}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-medium text-neutral-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    minLength={10}
                    value={editingProd.description || ''}
                    onChange={(e) => setEditingProd({ ...editingProd, description: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300"
                  />
                </div>

                <div className="text-xs">
                  <label className="block font-medium text-neutral-700 mb-1.5">Special Collections</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIAL_COLLECTIONS.map((col) => {
                      const active = collectionsInput.includes(col);
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() =>
                            setCollectionsInput((prev) =>
                              active ? prev.filter((x) => x !== col) : [...prev, col]
                            )
                          }
                          className={`px-2.5 py-1 border ${
                            active ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-300'
                          }`}
                        >
                          {col}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProd.featured)}
                      onChange={(e) => setEditingProd({ ...editingProd, featured: e.target.checked })}
                    />
                    <span>Feature on Homepage</span>
                  </label>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider"
                  >
                    Save Product to Firestore
                  </button>
                </div>
              </form>
            )}

            {/* Products Table */}
            <div className="bg-white border border-neutral-200 overflow-x-auto">
              <table className="w-full text-xs text-left tabular-nums">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover bg-neutral-100 shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-neutral-950">{p.name}</p>
                            <p className="text-neutral-500">{p.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {p.category} · {p.subcategory}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {formatINR(p.price)}{' '}
                        <span className="text-neutral-400 font-normal">({p.discountPercent}% off)</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={p.stock <= 10 ? 'text-amber-700 font-semibold' : ''}>{p.stock}</span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditProduct(p)}
                          className="underline hover:text-neutral-950 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteProduct(p.id)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Brands & Categories Quick Add */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-neutral-200 p-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider">Brands ({brands.length})</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {brands.map((b) => (
                    <span key={b.id} className="px-2.5 py-1 bg-neutral-100 border border-neutral-200">
                      {b.name}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="Brand name"
                    className="flex-1 px-3 py-2 border border-neutral-300 text-xs"
                  />
                  <input
                    type="text"
                    value={newBrandOrigin}
                    onChange={(e) => setNewBrandOrigin(e.target.value)}
                    placeholder="Origin"
                    className="w-32 px-3 py-2 border border-neutral-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newBrandName.trim()) return;
                      void saveBrand({
                        id: sanitizeId(newBrandName.toLowerCase()),
                        name: newBrandName.trim(),
                        slug: sanitizeId(newBrandName.toLowerCase()),
                        origin: newBrandOrigin.trim(),
                      });
                      setNewBrandName('');
                    }}
                    className="px-4 py-2 bg-neutral-950 text-white text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="bg-white border border-neutral-200 p-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider">Add Category</h3>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category Name"
                  className="w-full px-3 py-2 border border-neutral-300 text-xs"
                />
                <input
                  type="text"
                  value={newCatSubs}
                  onChange={(e) => setNewCatSubs(e.target.value)}
                  placeholder="Subcategories (comma separated)"
                  className="w-full px-3 py-2 border border-neutral-300 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newCatName.trim()) return;
                    void saveCategory({
                      id: sanitizeId(newCatName.toLowerCase()),
                      name: newCatName.trim(),
                      slug: sanitizeId(newCatName.toLowerCase()),
                      description: `${newCatName.trim()} curated edit`,
                      image: IMG_SHIRT,
                      subcategories: newCatSubs.split(',').map((s) => s.trim()).filter(Boolean),
                      displayOrder: categories.length + 1,
                    });
                    setNewCatName('');
                    setNewCatSubs('');
                  }}
                  className="px-4 py-2 bg-neutral-950 text-white text-xs font-semibold"
                >
                  Save Category
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {tab === 'orders' && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-semibold text-neutral-950">Order & Return Management</h2>
            {allOrders.length === 0 ? (
              <div className="bg-white border border-neutral-200 p-10 text-center text-sm text-neutral-500">
                No customer orders found in Firestore yet.
              </div>
            ) : (
              allOrders.map((ord) => (
                <div key={ord.id} className="bg-white border border-neutral-200 p-5 space-y-4 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-3">
                    <div>
                      <p className="font-mono-tabular font-semibold text-sm text-neutral-950">
                        {ord.orderNumber}
                      </p>
                      <p className="text-neutral-500">
                        {ord.customerName} ({ord.customerEmail}) · {ord.customerPhone} · {formatDateTime(ord.createdAt)}
                      </p>
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="text-sm font-semibold text-neutral-950">{formatINR(ord.totalAmount)}</p>
                      <p className="text-neutral-500">{ord.paymentMethod} · {ord.paymentMode}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <label className="block text-[11px] text-neutral-500 mb-1">Fulfilment Status</label>
                      <select
                        value={ord.status}
                        onChange={(e) => void updateOrderStatusAdmin(ord.id, e.target.value as OrderStatus)}
                        className="px-3 py-1.5 border border-neutral-300 bg-white font-medium"
                      >
                        {(
                          [
                            'Order Placed',
                            'Confirmed',
                            'Packed',
                            'Shipped',
                            'Out for Delivery',
                            'Delivered',
                            'Cancelled',
                          ] as OrderStatus[]
                        ).map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-neutral-500 mb-1">Payment Status</label>
                      <select
                        value={ord.paymentStatus}
                        onChange={(e) =>
                          void updateOrderStatusAdmin(ord.id, ord.status, e.target.value as PaymentStatus)
                        }
                        className="px-3 py-1.5 border border-neutral-300 bg-white font-medium"
                      >
                        {(
                          ['Pending Verification', 'Test Mode - Confirmed', 'Paid', 'Refunded'] as PaymentStatus[]
                        ).map((ps) => (
                          <option key={ps} value={ps}>{ps}</option>
                        ))}
                      </select>
                    </div>

                    {ord.returnRequest && (
                      <div className="ml-auto flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-3 py-2">
                        <span>
                          <strong>{ord.returnRequest.type}:</strong> {ord.returnRequest.reason}
                        </span>
                        <select
                          value={ord.returnRequest.status}
                          onChange={(e) =>
                            void updateReturnStatusAdmin(ord.id, e.target.value as ReturnRequest['status'])
                          }
                          className="px-2 py-1 border border-neutral-300 bg-white"
                        >
                          <option value="Requested">Requested</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: CUSTOMERS */}
        {tab === 'customers' && (
          <div className="bg-white border border-neutral-200 overflow-x-auto">
            <table className="w-full text-xs text-left tabular-nums">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Addresses</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {allUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-500">
                      No registered customer profiles synced yet.
                    </td>
                  </tr>
                ) : (
                  allUsers.map((u) => (
                    <tr key={u.uid}>
                      <td className="py-3 px-4 font-semibold text-neutral-950">{u.displayName}</td>
                      <td className="py-3 px-4">{u.email}</td>
                      <td className="py-3 px-4">{u.phone || '—'}</td>
                      <td className="py-3 px-4">{u.addresses?.length || 0}</td>
                      <td className="py-3 px-4">
                        <span className={u.disabled ? 'text-red-600 font-semibold' : 'text-emerald-700'}>
                          {u.disabled ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => void toggleUserDisabledAdmin(u.uid, !u.disabled)}
                          className="underline hover:text-neutral-950"
                        >
                          {u.disabled ? 'Restore Access' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: OFFERS, BANNERS & INBOX */}
        {tab === 'offers' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Coupons */}
              <div className="bg-white border border-neutral-200 p-6 space-y-5">
                <h2 className="text-sm font-semibold uppercase tracking-wider">Discount Coupons</h2>
                <div className="divide-y divide-neutral-100">
                  {coupons.map((c) => (
                    <div key={c.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-mono-tabular font-semibold text-neutral-950">{c.code}</span>
                        <p className="text-neutral-500">
                          {c.description} · Min {formatINR(c.minOrderValue)} · Exp {c.expiresAt}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => void saveCouponAdmin({ ...c, active: !c.active }, false)}
                          className={`px-2 py-1 border ${c.active ? 'border-emerald-700 text-emerald-700' : 'border-neutral-300 text-neutral-500'}`}
                        >
                          {c.active ? 'Active' : 'Paused'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteCouponAdmin(c.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleCreateCoupon} className="pt-4 border-t border-neutral-200 space-y-3 text-xs">
                  <p className="font-semibold">Create Coupon</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="CODE (e.g. WINTER20)"
                      className="px-3 py-2 border border-neutral-300 uppercase"
                    />
                    <select
                      value={couponType}
                      onChange={(e) => setCouponType(e.target.value as 'percent' | 'flat')}
                      className="px-3 py-2 border border-neutral-300 bg-white"
                    >
                      <option value="percent">Percent (%)</option>
                      <option value="flat">Flat (₹)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      required
                      value={couponValue}
                      onChange={(e) => setCouponValue(Number(e.target.value))}
                      placeholder="Value"
                      className="px-3 py-2 border border-neutral-300"
                    />
                    <input
                      type="number"
                      required
                      value={couponMinOrder}
                      onChange={(e) => setCouponMinOrder(Number(e.target.value))}
                      placeholder="Min Order ₹"
                      className="px-3 py-2 border border-neutral-300"
                    />
                    <input
                      type="date"
                      required
                      value={couponExpiry}
                      onChange={(e) => setCouponExpiry(e.target.value)}
                      className="px-3 py-2 border border-neutral-300"
                    />
                  </div>
                  <input
                    type="text"
                    value={couponDesc}
                    onChange={(e) => setCouponDesc(e.target.value)}
                    placeholder="Coupon description"
                    className="w-full px-3 py-2 border border-neutral-300"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-950 text-white font-semibold uppercase tracking-wider"
                  >
                    Create Coupon
                  </button>
                </form>
              </div>

              {/* Banners */}
              <div className="bg-white border border-neutral-200 p-6 space-y-5">
                <h2 className="text-sm font-semibold uppercase tracking-wider">Promotional Banners</h2>
                <div className="divide-y divide-neutral-100">
                  {banners.map((b) => (
                    <div key={b.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-semibold text-neutral-950">{b.title}</p>
                        <p className="text-neutral-500">{b.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => void saveBannerAdmin({ ...b, active: !b.active })}
                          className={`px-2 py-1 border ${b.active ? 'border-neutral-950' : 'border-neutral-300 text-neutral-500'}`}
                        >
                          {b.active ? <Check className="w-3.5 h-3.5 inline" /> : 'Hidden'}
                        </button>
                        <button type="button" onClick={() => void deleteBannerAdmin(b.id)} className="text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleCreateBanner} className="pt-4 border-t border-neutral-200 space-y-3 text-xs">
                  <p className="font-semibold">Add Promotional Banner</p>
                  <input
                    type="text"
                    required
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="Headline (e.g. Upgrade Your Everyday Style)"
                    className="w-full px-3 py-2 border border-neutral-300"
                  />
                  <input
                    type="text"
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    placeholder="Subtitle copy"
                    className="w-full px-3 py-2 border border-neutral-300"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={bannerCta}
                      onChange={(e) => setBannerCta(e.target.value)}
                      placeholder="CTA Label"
                      className="px-3 py-2 border border-neutral-300"
                    />
                    <input
                      type="text"
                      value={bannerFilter}
                      onChange={(e) => setBannerFilter(e.target.value)}
                      placeholder="Target Collection"
                      className="px-3 py-2 border border-neutral-300"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-950 text-white font-semibold uppercase tracking-wider"
                  >
                    Save Banner
                  </button>
                </form>
              </div>
            </div>

            {/* Customer Support Inbox & Newsletter */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border border-neutral-200 p-6 space-y-3 text-xs">
                <h3 className="text-sm font-semibold uppercase tracking-wider">
                  Contact Messages ({contactMessages.length})
                </h3>
                {contactMessages.length === 0 ? (
                  <p className="text-neutral-500">No support messages yet.</p>
                ) : (
                  contactMessages.map((m) => (
                    <div key={m.id} className="p-3 bg-neutral-50 border border-neutral-200 space-y-1">
                      <p className="font-semibold">{m.subject} · {m.name} ({m.email})</p>
                      <p className="text-neutral-600">{m.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-white border border-neutral-200 p-6 space-y-3 text-xs">
                <h3 className="text-sm font-semibold uppercase tracking-wider">
                  Newsletter Subscribers ({subscribers.length})
                </h3>
                {subscribers.length === 0 ? (
                  <p className="text-neutral-500">No subscribers recorded yet.</p>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {subscribers.map((s) => (
                      <li key={s.id} className="py-2 flex justify-between">
                        <span>{s.email}</span>
                        <span className="text-neutral-400">{formatDateTime(s.subscribedAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
