export type OrderStatus =
  | 'Order Placed'
  | 'Confirmed'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'UPI' | 'Card' | 'NetBanking' | 'COD';
export type PaymentMode = 'test_mvp' | 'live';
export type PaymentStatus = 'Pending Verification' | 'Test Mode - Confirmed' | 'Paid' | 'Refunded';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  subcategory: string;
  collections: string[];
  description: string;
  fabric: string;
  fit: string;
  occasion: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  sizes: string[];
  colors: ProductColor[];
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  isDemo: boolean;
  featured: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  subcategories: string[];
  displayOrder: number;
  updatedAt?: any;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  origin: string;
  updatedAt?: any;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  addresses: Address[];
  recentlyViewed: string[];
  disabled: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'super_admin';
  createdAt?: any;
}

export interface CartItem {
  productId: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  originalPrice: number;
  size: string;
  color: string;
  quantity: number;
}

export interface ReturnRequest {
  type: 'Return' | 'Exchange';
  reason: string;
  status: 'Requested' | 'Approved' | 'Rejected' | 'Completed';
  requestedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  uid: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Address;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  deliveryCharge: number;
  totalAmount: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  returnRequest?: ReturnRequest;
  createdAt?: any;
  updatedAt?: any;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiresAt: string;
  active: boolean;
  description: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  targetFilter: string;
  active: boolean;
  displayOrder: number;
  updatedAt?: any;
}

export interface Review {
  id: string;
  productId: string;
  uid: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  isDemo: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export type SortOption =
  | 'recommended'
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'best_selling'
  | 'top_rated';

export interface FilterState {
  search: string;
  category: string;
  subcategory: string;
  collection: string;
  brand: string;
  minPrice: number;
  maxPrice: number;
  size: string;
  color: string;
  fabric: string;
  fit: string;
  occasion: string;
  minDiscount: number;
  minRating: number;
  sort: SortOption;
}
