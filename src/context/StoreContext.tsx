import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  SEED_BANNERS,
  SEED_BRANDS,
  SEED_CATEGORIES,
  SEED_COUPONS,
  SEED_DEMO_REVIEWS,
  SEED_PRODUCTS,
} from '../data/catalogSeed';
import { OperationType, auth, db, googleProvider, handleFirestoreError } from '../lib/firebase';
import {
  Address,
  Brand,
  CartItem,
  Category,
  Coupon,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  PromoBanner,
  ReturnRequest,
  Review,
  UserProfile,
} from '../types/ecommerce';
import {
  FREE_DELIVERY_THRESHOLD,
  PRIMARY_ADMIN_EMAIL,
  STANDARD_DELIVERY_FEE,
  sanitizeId,
} from '../utils/format';

interface ToastState {
  id: number;
  message: string;
  tone: 'neutral' | 'success' | 'error';
}

interface StoreContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  adminChecked: boolean;
  userProfile: UserProfile | null;
  products: Product[];
  categories: Category[];
  brands: Brand[];
  coupons: Coupon[];
  banners: PromoBanner[];
  reviews: Review[];
  orders: Order[];
  allOrders: Order[];
  allUsers: UserProfile[];
  contactMessages: any[];
  subscribers: any[];
  cartItems: CartItem[];
  wishlistIds: string[];
  recentlyViewedIds: string[];
  appliedCoupon: Coupon | null;
  catalogLoading: boolean;
  isUsingSeedCatalog: boolean;
  isPlacingOrder: boolean;
  toast: ToastState | null;
  showToast: (message: string, tone?: 'neutral' | 'success' | 'error') => void;

  // Auth actions
  signInWithGoogle: () => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshUserVerification: () => Promise<boolean>;
  logout: () => Promise<void>;

  // Cart & Wishlist
  addToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateCartQty: (productId: string, size: string, color: string, quantity: number) => void;
  updateCartVariant: (
    productId: string,
    oldSize: string,
    oldColor: string,
    newSize: string,
    newColor: string
  ) => void;
  clearCart: () => void;
  applyCouponCode: (code: string) => { ok: boolean; message: string };
  removeCoupon: () => void;
  toggleWishlist: (productId: string) => void;
  trackProductView: (productId: string) => void;

  // Pricing helpers
  cartSubtotal: number;
  cartDiscount: number;
  deliveryCharge: number;
  cartTotal: number;

  // Customer mutations
  updateCustomerProfile: (displayName: string, phone: string) => Promise<void>;
  saveAddress: (address: Address) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  placeOrder: (params: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: Address;
    paymentMethod: PaymentMethod;
  }) => Promise<Order>;
  cancelOrder: (orderId: string) => Promise<void>;
  requestReturnOrExchange: (orderId: string, req: Omit<ReturnRequest, 'status' | 'requestedAt'>) => Promise<void>;
  submitReview: (productId: string, rating: number, title: string, comment: string) => Promise<void>;
  subscribeNewsletter: (email: string) => Promise<void>;
  submitContactMessage: (name: string, email: string, subject: string, message: string) => Promise<void>;

  // Admin mutations
  seedCatalogToFirestore: () => Promise<void>;
  saveProduct: (product: Omit<Product, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  saveCategory: (category: Omit<Category, 'updatedAt'>) => Promise<void>;
  saveBrand: (brand: Omit<Brand, 'updatedAt'>) => Promise<void>;
  updateOrderStatusAdmin: (orderId: string, status: OrderStatus, paymentStatus?: PaymentStatus) => Promise<void>;
  updateReturnStatusAdmin: (orderId: string, returnStatus: ReturnRequest['status']) => Promise<void>;
  toggleUserDisabledAdmin: (uid: string, disabled: boolean) => Promise<void>;
  saveCouponAdmin: (coupon: Omit<Coupon, 'createdAt' | 'updatedAt'>, isNew: boolean) => Promise<void>;
  deleteCouponAdmin: (couponId: string) => Promise<void>;
  saveBannerAdmin: (banner: Omit<PromoBanner, 'updatedAt'>) => Promise<void>;
  deleteBannerAdmin: (bannerId: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const LOCAL_CART_KEY = 'menzo_cart_v1';
const LOCAL_WISHLIST_KEY = 'menzo_wishlist_v1';
const LOCAL_RECENT_KEY = 'menzo_recent_v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [fsProducts, setFsProducts] = useState<Product[]>([]);
  const [fsCategories, setFsCategories] = useState<Category[]>([]);
  const [fsBrands, setFsBrands] = useState<Brand[]>([]);
  const [fsCoupons, setFsCoupons] = useState<Coupon[]>([]);
  const [fsBanners, setFsBanners] = useState<PromoBanner[]>([]);
  const [fsReviews, setFsReviews] = useState<Review[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_WISHLIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_RECENT_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, tone: 'neutral' | 'success' | 'error' = 'neutral') => {
    const id = Date.now();
    setToast({ id, message, tone });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3600);
  }, []);

  // Persist local guest cart/wishlist/recent
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cartItems));
    } catch {
      // ignore storage quota errors
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(wishlistIds));
    } catch {
      // ignore
    }
  }, [wishlistIds]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_RECENT_KEY, JSON.stringify(recentlyViewedIds));
    } catch {
      // ignore
    }
  }, [recentlyViewedIds]);

  // Public catalog listeners
  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        setFsProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
        setCatalogLoading(false);
      },
      (err) => {
        setCatalogLoading(false);
        handleFirestoreError(err, OperationType.LIST, 'products');
      }
    );

    const unsubCategories = onSnapshot(
      query(collection(db, 'categories'), orderBy('displayOrder', 'asc')),
      (snap) => {
        setFsCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'categories')
    );

    const unsubBrands = onSnapshot(
      collection(db, 'brands'),
      (snap) => {
        setFsBrands(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Brand)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'brands')
    );

    const unsubBanners = onSnapshot(
      query(collection(db, 'banners'), orderBy('displayOrder', 'asc')),
      (snap) => {
        setFsBanners(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PromoBanner)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'banners')
    );

    const unsubReviews = onSnapshot(
      collection(db, 'reviews'),
      (snap) => {
        setFsReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'reviews')
    );

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBrands();
      unsubBanners();
      unsubReviews();
    };
  }, []);

  // Coupons listener (public active coupons or all for admin)
  useEffect(() => {
    const q = isAdmin
      ? collection(db, 'coupons')
      : query(collection(db, 'coupons'), where('active', '==', true));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setFsCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'coupons')
    );
    return () => unsub();
  }, [isAdmin]);

  // Auth state & Admin verification
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      setAdminChecked(false);

      if (!currentUser) {
        setIsAdmin(false);
        setAdminChecked(true);
        setUserProfile(null);
        setOrders([]);
        setAllOrders([]);
        setAllUsers([]);
        setContactMessages([]);
        setSubscribers([]);
        return;
      }

      if (!currentUser.emailVerified) {
        setIsAdmin(false);
        setAdminChecked(true);
        return;
      }

      let adminFlag = currentUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
      if (!adminFlag) {
        try {
          const adminSnap = await getDoc(doc(db, 'adminUsers', currentUser.uid));
          if (adminSnap.exists()) {
            adminFlag = true;
          }
        } catch {
          // Non-admins get permission-denied when reading adminUsers/{uid}; expected!
          adminFlag = false;
        }
      }
      setIsAdmin(adminFlag);
      setAdminChecked(true);
    });
    return () => unsub();
  }, []);

  // Sync verified user profile, cart, wishlist, and orders
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) return;

    const userRef = doc(db, 'users', user.uid);
    let cancelled = false;

    const ensureUserProfile = async () => {
      try {
        const snap = await getDoc(userRef);
        if (!snap.exists() && !cancelled) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email || `${user.uid}@menzo.in`,
            displayName: (user.displayName || user.email?.split('@')[0] || 'MENZO Customer').slice(0, 120),
            phone: '',
            addresses: [],
            recentlyViewed: recentlyViewedIds.slice(0, 20),
            disabled: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    };

    void ensureUserProfile();

    const unsubUser = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setUserProfile(data);
          if (Array.isArray(data.recentlyViewed) && data.recentlyViewed.length > 0) {
            setRecentlyViewedIds((prev) => Array.from(new Set([...data.recentlyViewed, ...prev])).slice(0, 20));
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`)
    );

    const cartRef = doc(db, 'carts', user.uid);
    const unsubCart = onSnapshot(
      cartRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.items)) {
            setCartItems(data.items as CartItem[]);
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `carts/${user.uid}`)
    );

    const wishRef = doc(db, 'wishlists', user.uid);
    const unsubWish = onSnapshot(
      wishRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.productIds)) {
            setWishlistIds(data.productIds as string[]);
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `wishlists/${user.uid}`)
    );

    const ordersQ = query(collection(db, 'orders'), where('uid', '==', user.uid));
    const unsubOrders = onSnapshot(
      ordersQ,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
        list.sort((a, b) => {
          const tA = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : 0;
          const tB = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setOrders(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    return () => {
      cancelled = true;
      unsubUser();
      unsubCart();
      unsubWish();
      unsubOrders();
    };
  }, [authReady, user]);

  // Admin-only listeners
  useEffect(() => {
    if (!authReady || !adminChecked || !isAdmin || !user?.emailVerified) return;

    const unsubAllOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
        list.sort((a, b) => {
          const tA = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : 0;
          const tB = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setAllOrders(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    const unsubAllUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setAllUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );

    const unsubContacts = onSnapshot(
      collection(db, 'contactMessages'),
      (snap) => {
        setContactMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'contactMessages')
    );

    const unsubSubs = onSnapshot(
      collection(db, 'newsletterSubscribers'),
      (snap) => {
        setSubscribers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'newsletterSubscribers')
    );

    return () => {
      unsubAllOrders();
      unsubAllUsers();
      unsubContacts();
      unsubSubs();
    };
  }, [authReady, adminChecked, isAdmin, user]);

  // Merged view: live Firestore catalog with clean demonstration fallback when empty
  const isUsingSeedCatalog = fsProducts.length === 0;
  const products = fsProducts.length > 0 ? fsProducts : SEED_PRODUCTS;
  const categories = fsCategories.length > 0 ? fsCategories : SEED_CATEGORIES;
  const brands = fsBrands.length > 0 ? fsBrands : SEED_BRANDS;
  const coupons = fsCoupons.length > 0 ? fsCoupons : SEED_COUPONS;
  const banners = fsBanners.length > 0 ? fsBanners : SEED_BANNERS;
  const reviews = fsReviews.length > 0 ? fsReviews : SEED_DEMO_REVIEWS;

  const syncCartToFirestore = useCallback(
    async (nextItems: CartItem[], couponCode?: string) => {
      if (!user || !user.emailVerified) return;
      try {
        await setDoc(
          doc(db, 'carts', user.uid),
          {
            uid: user.uid,
            items: nextItems.slice(0, 50),
            couponCode: (couponCode ?? appliedCoupon?.code ?? '').slice(0, 40),
            updatedAt: serverTimestamp(),
          },
          { merge: false }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `carts/${user.uid}`);
      }
    },
    [user, appliedCoupon]
  );

  const syncWishlistToFirestore = useCallback(
    async (nextIds: string[]) => {
      if (!user || !user.emailVerified) return;
      try {
        await setDoc(
          doc(db, 'wishlists', user.uid),
          {
            uid: user.uid,
            productIds: nextIds.slice(0, 100),
            updatedAt: serverTimestamp(),
          },
          { merge: false }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `wishlists/${user.uid}`);
      }
    },
    [user]
  );

  // Auth handlers
  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
    showToast('Signed in with Google', 'success');
  };

  const registerWithEmail = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: name.trim().slice(0, 120) });
    await sendEmailVerification(cred.user);
    showToast('Account created. Verification email sent!', 'success');
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
    showToast('Welcome back to MENZO', 'success');
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
    showToast('Password reset link sent to your email', 'success');
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
    showToast('Verification email resent', 'success');
  };

  const refreshUserVerification = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const refreshed = auth.currentUser;
    setUser({ ...refreshed } as User);
    if (refreshed.emailVerified) {
      let adminFlag = refreshed.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
      if (!adminFlag) {
        try {
          const snap = await getDoc(doc(db, 'adminUsers', refreshed.uid));
          adminFlag = snap.exists();
        } catch {
          adminFlag = false;
        }
      }
      setIsAdmin(adminFlag);
      showToast('Email verified successfully!', 'success');
      return true;
    }
    showToast('Email not verified yet. Please check your inbox.', 'error');
    return false;
  };

  const logout = async () => {
    await signOut(auth);
    setAppliedCoupon(null);
    showToast('Signed out', 'neutral');
  };

  // Cart & Wishlist actions
  const addToCart = useCallback(
    (product: Product, size: string, color: string, quantity = 1) => {
      setCartItems((prev) => {
        const idx = prev.findIndex(
          (item) => item.productId === product.id && item.size === size && item.color === color
        );
        let next: CartItem[];
        if (idx >= 0) {
          next = prev.map((item, i) =>
            i === idx ? { ...item, quantity: Math.min(10, item.quantity + quantity) } : item
          );
        } else {
          next = [
            ...prev,
            {
              productId: product.id,
              name: product.name,
              brand: product.brand,
              image: product.images[0] || '',
              price: product.price,
              originalPrice: product.originalPrice,
              size,
              color,
              quantity,
            },
          ];
        }
        void syncCartToFirestore(next);
        return next;
      });
      showToast(`Added ${product.name} (${size}) to bag`, 'success');
    },
    [syncCartToFirestore, showToast]
  );

  const removeFromCart = useCallback(
    (productId: string, size: string, color: string) => {
      setCartItems((prev) => {
        const next = prev.filter(
          (i) => !(i.productId === productId && i.size === size && i.color === color)
        );
        void syncCartToFirestore(next);
        return next;
      });
    },
    [syncCartToFirestore]
  );

  const updateCartQty = useCallback(
    (productId: string, size: string, color: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId, size, color);
        return;
      }
      setCartItems((prev) => {
        const next = prev.map((i) =>
          i.productId === productId && i.size === size && i.color === color
            ? { ...i, quantity: Math.min(10, quantity) }
            : i
        );
        void syncCartToFirestore(next);
        return next;
      });
    },
    [removeFromCart, syncCartToFirestore]
  );

  const updateCartVariant = useCallback(
    (productId: string, oldSize: string, oldColor: string, newSize: string, newColor: string) => {
      setCartItems((prev) => {
        const next = prev.map((i) =>
          i.productId === productId && i.size === oldSize && i.color === oldColor
            ? { ...i, size: newSize, color: newColor }
            : i
        );
        void syncCartToFirestore(next);
        return next;
      });
    },
    [syncCartToFirestore]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
    void syncCartToFirestore([], '');
  }, [syncCartToFirestore]);

  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const cartDiscount = useMemo(() => {
    if (!appliedCoupon || cartSubtotal < appliedCoupon.minOrderValue) return 0;
    let disc =
      appliedCoupon.discountType === 'percent'
        ? Math.round((cartSubtotal * appliedCoupon.discountValue) / 100)
        : appliedCoupon.discountValue;
    if (appliedCoupon.maxDiscount && appliedCoupon.maxDiscount > 0) {
      disc = Math.min(disc, appliedCoupon.maxDiscount);
    }
    return Math.min(disc, cartSubtotal);
  }, [appliedCoupon, cartSubtotal]);

  const deliveryCharge = useMemo(() => {
    if (cartItems.length === 0) return 0;
    return cartSubtotal - cartDiscount >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
  }, [cartItems.length, cartSubtotal, cartDiscount]);

  const cartTotal = Math.max(0, cartSubtotal - cartDiscount + deliveryCharge);

  const applyCouponCode = useCallback(
    (rawCode: string): { ok: boolean; message: string } => {
      const code = rawCode.trim().toUpperCase();
      if (!code) return { ok: false, message: 'Enter a coupon code.' };
      const found = coupons.find((c) => c.code.toUpperCase() === code && c.active);
      if (!found) {
        return { ok: false, message: `Coupon "${code}" is invalid or inactive.` };
      }
      if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
        return { ok: false, message: `Coupon "${code}" has expired.` };
      }
      if (cartSubtotal < found.minOrderValue) {
        return {
          ok: false,
          message: `Minimum order value of ₹${found.minOrderValue.toLocaleString('en-IN')} required for ${found.code}.`,
        };
      }
      setAppliedCoupon(found);
      void syncCartToFirestore(cartItems, found.code);
      return { ok: true, message: `${found.code} applied!` };
    },
    [coupons, cartSubtotal, cartItems, syncCartToFirestore]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    void syncCartToFirestore(cartItems, '');
  }, [cartItems, syncCartToFirestore]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlistIds((prev) => {
        const exists = prev.includes(productId);
        const next = exists ? prev.filter((id) => id !== productId) : [productId, ...prev].slice(0, 100);
        void syncWishlistToFirestore(next);
        showToast(exists ? 'Removed from wishlist' : 'Saved to wishlist', 'neutral');
        return next;
      });
    },
    [syncWishlistToFirestore, showToast]
  );

  const trackProductView = useCallback(
    (productId: string) => {
      setRecentlyViewedIds((prev) => {
        const next = [productId, ...prev.filter((id) => id !== productId)].slice(0, 20);
        if (user && user.emailVerified && userProfile) {
          updateDoc(doc(db, 'users', user.uid), {
            recentlyViewed: next,
            updatedAt: serverTimestamp(),
          }).catch(() => {
            // non-critical
          });
        }
        return next;
      });
    },
    [user, userProfile]
  );

  // Customer mutations
  const updateCustomerProfile = async (displayName: string, phone: string) => {
    if (!user || !user.emailVerified) throw new Error('Verified account required.');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim().slice(0, 120),
        phone: phone.trim().slice(0, 24),
        updatedAt: serverTimestamp(),
      });
      showToast('Profile updated', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const saveAddress = async (address: Address) => {
    if (!user || !user.emailVerified) throw new Error('Verified account required.');
    const existing = userProfile?.addresses || [];
    const idx = existing.findIndex((a) => a.id === address.id);
    let next = idx >= 0 ? existing.map((a, i) => (i === idx ? address : a)) : [...existing, address];
    if (address.isDefault) {
      next = next.map((a) => ({ ...a, isDefault: a.id === address.id }));
    }
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        addresses: next.slice(0, 10),
        updatedAt: serverTimestamp(),
      });
      showToast('Address saved', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!user || !user.emailVerified) throw new Error('Verified account required.');
    const next = (userProfile?.addresses || []).filter((a) => a.id !== addressId);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        addresses: next,
        updatedAt: serverTimestamp(),
      });
      showToast('Address removed', 'neutral');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const placeOrder = async ({
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    paymentMethod,
  }: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: Address;
    paymentMethod: PaymentMethod;
  }): Promise<Order> => {
    if (!user || !user.emailVerified) {
      throw new Error('Please sign in with a verified account to place an order.');
    }
    if (userProfile?.disabled) {
      throw new Error('Your account is currently restricted. Contact customer support.');
    }
    if (cartItems.length === 0) {
      throw new Error('Your shopping bag is empty.');
    }
    if (isPlacingOrder) {
      throw new Error('Order submission already in progress.');
    }

    setIsPlacingOrder(true);
    try {
      const orderId = sanitizeId(`ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
      const orderNumber = `MZ-${new Date().getFullYear().toString().slice(-2)}${Math.floor(100000 + Math.random() * 900000)}`;
      const paymentStatus: PaymentStatus =
        paymentMethod === 'COD' ? 'Pending Verification' : 'Test Mode - Confirmed';

      const payload: Order = {
        id: orderId,
        orderNumber,
        uid: user.uid,
        customerName: customerName.trim().slice(0, 120),
        customerEmail: customerEmail.trim().slice(0, 200),
        customerPhone: customerPhone.trim().slice(0, 20),
        shippingAddress: {
          id: sanitizeId(shippingAddress.id || 'addr-1'),
          label: (shippingAddress.label || 'Delivery').slice(0, 40),
          fullName: shippingAddress.fullName.trim().slice(0, 120),
          phone: shippingAddress.phone.trim().slice(0, 20),
          line1: shippingAddress.line1.trim().slice(0, 240),
          line2: (shippingAddress.line2 || '').trim().slice(0, 160),
          city: shippingAddress.city.trim().slice(0, 80),
          state: shippingAddress.state.trim().slice(0, 80),
          pincode: shippingAddress.pincode.trim().slice(0, 12),
        },
        items: cartItems.slice(0, 50),
        subtotal: cartSubtotal,
        discountAmount: cartDiscount,
        deliveryCharge,
        totalAmount: cartTotal,
        couponCode: appliedCoupon?.code || '',
        paymentMethod,
        paymentMode: 'test_mvp',
        paymentStatus,
        status: 'Order Placed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'orders', orderId), payload);
      clearCart();
      showToast(`Order ${orderNumber} placed (Test Mode)`, 'success');
      return payload;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Cancelled',
        updatedAt: serverTimestamp(),
      });
      showToast('Order cancelled', 'neutral');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const requestReturnOrExchange = async (
    orderId: string,
    req: Omit<ReturnRequest, 'status' | 'requestedAt'>
  ) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        returnRequest: {
          type: req.type,
          reason: req.reason.trim().slice(0, 500),
          status: 'Requested',
          requestedAt: new Date().toISOString().slice(0, 24),
        },
        updatedAt: serverTimestamp(),
      });
      showToast(`${req.type} request submitted`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const submitReview = async (productId: string, rating: number, title: string, comment: string) => {
    if (!user || !user.emailVerified) {
      throw new Error('Please sign in with a verified account to submit a review.');
    }
    const prodSnap = await getDoc(doc(db, 'products', productId));
    if (!prodSnap.exists()) {
      throw new Error('This sample product must be synced to Firestore by an admin before saving live reviews.');
    }
    const reviewId = sanitizeId(`rev-${user.uid.slice(0, 8)}-${Date.now()}`);
    try {
      await setDoc(doc(db, 'reviews', reviewId), {
        id: reviewId,
        productId,
        uid: user.uid,
        authorName: (userProfile?.displayName || user.displayName || 'MENZO Customer').slice(0, 80),
        rating: Math.max(1, Math.min(5, Math.round(rating))),
        title: title.trim().slice(0, 120),
        comment: comment.trim().slice(0, 1200),
        isDemo: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Review published', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reviews/${reviewId}`);
    }
  };

  const subscribeNewsletter = async (email: string) => {
    const id = sanitizeId(`sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    try {
      await setDoc(doc(db, 'newsletterSubscribers', id), {
        id,
        email: email.trim().slice(0, 200),
        subscribedAt: serverTimestamp(),
      });
      showToast('Subscribed to MENZO updates', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `newsletterSubscribers/${id}`);
    }
  };

  const submitContactMessage = async (name: string, email: string, subject: string, message: string) => {
    const id = sanitizeId(`msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    try {
      await setDoc(doc(db, 'contactMessages', id), {
        id,
        name: name.trim().slice(0, 100),
        email: email.trim().slice(0, 200),
        subject: subject.trim().slice(0, 160),
        message: message.trim().slice(0, 2000),
        createdAt: serverTimestamp(),
      });
      showToast('Inquiry sent to MENZO Support', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `contactMessages/${id}`);
    }
  };

  // Admin catalog seeding & CRUD
  const seedCatalogToFirestore = useCallback(async () => {
    if (!isAdmin || !user?.emailVerified) {
      throw new Error('Admin verification required.');
    }
    try {
      const batch = writeBatch(db);
      for (const cat of SEED_CATEGORIES) {
        batch.set(doc(db, 'categories', cat.id), { ...cat, updatedAt: serverTimestamp() });
      }
      for (const br of SEED_BRANDS) {
        batch.set(doc(db, 'brands', br.id), { ...br, updatedAt: serverTimestamp() });
      }
      for (const prod of SEED_PRODUCTS) {
        batch.set(doc(db, 'products', prod.id), {
          ...prod,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const cpn of SEED_COUPONS) {
        batch.set(doc(db, 'coupons', cpn.id), {
          ...cpn,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      for (const ban of SEED_BANNERS) {
        batch.set(doc(db, 'banners', ban.id), { ...ban, updatedAt: serverTimestamp() });
      }
      for (const rev of SEED_DEMO_REVIEWS) {
        batch.set(doc(db, 'reviews', rev.id), {
          ...rev,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
      showToast('Sample catalog synced to Cloud Firestore', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'batch-seed');
    }
  }, [isAdmin, user, showToast]);

  // Auto-seed once if an admin signs in and Firestore products collection is empty
  useEffect(() => {
    if (isAdmin && adminChecked && !catalogLoading && fsProducts.length === 0) {
      getDocs(collection(db, 'products'))
        .then((snap) => {
          if (snap.empty) {
            void seedCatalogToFirestore();
          }
        })
        .catch(() => {
          // ignore
        });
    }
  }, [isAdmin, adminChecked, catalogLoading, fsProducts.length, seedCatalogToFirestore]);

  const saveProduct = async (product: Omit<Product, 'createdAt' | 'updatedAt'>, isNew: boolean) => {
    if (!isAdmin) throw new Error('Admin access required.');
    const id = sanitizeId(product.id);
    try {
      if (isNew) {
        await setDoc(doc(db, 'products', id), {
          ...product,
          id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'products', id), {
          ...product,
          id,
          updatedAt: serverTimestamp(),
        });
      }
      showToast(isNew ? 'Product created' : 'Product updated', 'success');
    } catch (err) {
      handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!isAdmin) throw new Error('Admin access required.');
    try {
      await deleteDoc(doc(db, 'products', productId));
      showToast('Product deleted', 'neutral');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
    }
  };

  const saveCategory = async (category: Omit<Category, 'updatedAt'>) => {
    if (!isAdmin) throw new Error('Admin access required.');
    const id = sanitizeId(category.id);
    try {
      await setDoc(doc(db, 'categories', id), {
        ...category,
        id,
        updatedAt: serverTimestamp(),
      });
      showToast('Category saved', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `categories/${id}`);
    }
  };

  const saveBrand = async (brand: Omit<Brand, 'updatedAt'>) => {
    if (!isAdmin) throw new Error('Admin access required.');
    const id = sanitizeId(brand.id);
    try {
      await setDoc(doc(db, 'brands', id), {
        ...brand,
        id,
        updatedAt: serverTimestamp(),
      });
      showToast('Brand saved', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `brands/${id}`);
    }
  };

  const updateOrderStatusAdmin = async (
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus
  ) => {
    if (!isAdmin) throw new Error('Admin access required.');
    try {
      const updatePayload: Record<string, any> = {
        status,
        updatedAt: serverTimestamp(),
      };
      if (paymentStatus) {
        updatePayload.paymentStatus = paymentStatus;
      }
      await updateDoc(doc(db, 'orders', orderId), updatePayload);
      showToast(`Order status updated to ${status}`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const updateReturnStatusAdmin = async (orderId: string, returnStatus: ReturnRequest['status']) => {
    if (!isAdmin) throw new Error('Admin access required.');
    const existingOrder = allOrders.find((o) => o.id === orderId);
    if (!existingOrder?.returnRequest) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        returnRequest: {
          ...existingOrder.returnRequest,
          status: returnStatus,
        },
        updatedAt: serverTimestamp(),
      });
      showToast(`Return request marked ${returnStatus}`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const toggleUserDisabledAdmin = async (uid: string, disabled: boolean) => {
    if (!isAdmin) throw new Error('Admin access required.');
    try {
      await updateDoc(doc(db, 'users', uid), {
        disabled,
        updatedAt: serverTimestamp(),
      });
      showToast(disabled ? 'Customer account suspended' : 'Customer account restored', 'neutral');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const saveCouponAdmin = async (coupon: Omit<Coupon, 'createdAt' | 'updatedAt'>, isNew: boolean) => {
    if (!isAdmin) throw new Error('Admin access required.');
    const id = sanitizeId(coupon.id);
    try {
      if (isNew) {
        await setDoc(doc(db, 'coupons', id), {
          ...coupon,
          id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'coupons', id), {
          ...coupon,
          id,
          updatedAt: serverTimestamp(),
        });
      }
      showToast('Coupon saved', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `coupons/${id}`);
    }
  };

  const deleteCouponAdmin = async (couponId: string) => {
    if (!isAdmin) throw new Error('Admin access required.');
    try {
      await deleteDoc(doc(db, 'coupons', couponId));
      showToast('Coupon deleted', 'neutral');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `coupons/${couponId}`);
    }
  };

  const saveBannerAdmin = async (banner: Omit<PromoBanner, 'updatedAt'>) => {
    if (!isAdmin) throw new Error('Admin access required.');
    const id = sanitizeId(banner.id);
    try {
      await setDoc(doc(db, 'banners', id), {
        ...banner,
        id,
        updatedAt: serverTimestamp(),
      });
      showToast('Banner saved', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `banners/${id}`);
    }
  };

  const deleteBannerAdmin = async (bannerId: string) => {
    if (!isAdmin) throw new Error('Admin access required.');
    try {
      await deleteDoc(doc(db, 'banners', bannerId));
      showToast('Banner removed', 'neutral');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `banners/${bannerId}`);
    }
  };

  const value: StoreContextValue = {
    user,
    authReady,
    isAdmin,
    adminChecked,
    userProfile,
    products,
    categories,
    brands,
    coupons,
    banners,
    reviews,
    orders,
    allOrders,
    allUsers,
    contactMessages,
    subscribers,
    cartItems,
    wishlistIds,
    recentlyViewedIds,
    appliedCoupon,
    catalogLoading,
    isUsingSeedCatalog,
    isPlacingOrder,
    toast,
    showToast,
    signInWithGoogle,
    registerWithEmail,
    loginWithEmail,
    resetPassword,
    resendVerificationEmail,
    refreshUserVerification,
    logout,
    addToCart,
    removeFromCart,
    updateCartQty,
    updateCartVariant,
    clearCart,
    applyCouponCode,
    removeCoupon,
    toggleWishlist,
    trackProductView,
    cartSubtotal,
    cartDiscount,
    deliveryCharge,
    cartTotal,
    updateCustomerProfile,
    saveAddress,
    deleteAddress,
    placeOrder,
    cancelOrder,
    requestReturnOrExchange,
    submitReview,
    subscribeNewsletter,
    submitContactMessage,
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
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
