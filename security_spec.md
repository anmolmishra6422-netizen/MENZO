# MENZO Security Specification (Phase 0: Payload-First Security TDD)

## 1. Core Data Invariants
1. **Admin Privilege Isolation**: A customer can NEVER elevate themselves to admin by writing to `users/{uid}` or `adminUsers/{uid}`. Admin verification uses `request.auth.token.email_verified == true` AND either the bootstrapped owner email or an existing `adminUsers/{uid}` document.
2. **PII Isolation**: Customer profiles (`users/{uid}`), shopping carts (`carts/{uid}`), wishlists (`wishlists/{uid}`), newsletter emails (`newsletterSubscribers/{id}`), and support inquiries (`contactMessages/{id}`) can NEVER be read or listed by other customers.
3. **Order Ownership & State Integrity**: An order can ONLY be created with `uid == request.auth.uid`, `status == 'Order Placed'`, `createdAt == request.time`, and `updatedAt == request.time`. Customers can NEVER mark an order as `Confirmed`, `Delivered`, or `Paid`; customers may only cancel while `Order Placed` / `Confirmed`, or submit a `returnRequest` after `Delivered`.
4. **Catalog Integrity**: Products, categories, brands, coupons, and banners can ONLY be created, updated, or deleted by verified admins.
5. **Review Authenticity**: Customer-submitted reviews must bind `uid == request.auth.uid`, `isDemo == false`, `rating` between 1 and 5, and reference an existing product.
6. **Path & Size Hardening**: Every document ID must match `^[a-zA-Z0-9_-]+$` (`<= 128` chars), and every string and array field enforces strict length/count bounds.

## 2. The "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **Self-Privilege Escalation (`users/cust1`)**: Customer creates `users/cust1` with shadow field `{ ..., "role": "admin", "isAdmin": true }`.
2. **Admin Registry Poisoning (`adminUsers/cust1`)**: Non-admin customer attempts to write `adminUsers/cust1` `{ uid: "cust1", role: "super_admin" }`.
3. **Email Spoofing (`adminUsers/spoof`)**: User with `email: "anmolmishra6422@gmail.com"` and `email_verified: false` tries to update a product.
4. **Cross-Customer PII Read (`users/otherUid`)**: Signed-in customer `cust1` attempts `get` or `list` on `users/otherUid`.
5. **Cross-Customer Cart Tampering (`carts/otherUid`)**: Signed-in customer `cust1` attempts to read or write `carts/otherUid`.
6. **Order Identity Spoofing (`orders/ord1`)**: Customer `cust1` tries to create an order with `uid: "cust2"`.
7. **Order State Shortcutting (`orders/ord1`)**: Customer `cust1` creates or updates their order directly to `status: "Delivered"` and `paymentStatus: "Paid"`.
8. **Terminal State Bypass (`orders/ord_delivered`)**: Customer `cust1` attempts to cancel an already `Delivered` order (`status: "Cancelled"`).
9. **Catalog Price Tampering (`products/prod1`)**: Customer `cust1` attempts to update `products/prod1` `{ price: 1 }`.
10. **Fake Verified/Demo Review Spoofing (`reviews/rev1`)**: Customer `cust1` attempts to create a review with `isDemo: true` or `rating: 99` or non-existent `productId`.
11. **ID Poisoning / DoW (`orders/<200-char-junk>`)**: Attacker submits a 200-character document ID or `1000`-element `items` array.
12. **Blanket Query Scraping (`orders` list)**: Customer `cust1` runs an unfiltered `getDocs(collection(db, 'orders'))` without matching `uid == request.auth.uid`.
