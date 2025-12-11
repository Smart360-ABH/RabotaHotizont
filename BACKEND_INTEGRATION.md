# Back4App Integration Guide

## Overview

This marketplace application uses **Back4App** (Parse Server) as the backend for storing all user, product, vendor, and order data. The frontend communicates with Back4App exclusively via REST API (no Parse SDK due to browser compatibility issues).

## Environment Setup

Add these variables to `.env.local`:

```env
VITE_PARSE_APP_ID=YOUR_APP_ID
VITE_PARSE_REST_KEY=YOUR_REST_KEY
VITE_PARSE_JS_KEY=YOUR_JS_KEY
VITE_GEMINI_API_KEY=YOUR_GEMINI_KEY (optional, for AI assistant)
```

## REST API Wrapper

**File:** `services/back4appRest.ts`

All Back4App operations go through this centralized wrapper. It:
- Handles authentication headers
- Validates environment variables
- Provides typed function signatures
- Manages error handling

### Initialization Check

```typescript
import * as back4app from '../services/back4appRest';

if (!back4app.isInitialized()) {
  console.error('Back4App credentials not configured');
}
```

## Data Models

### 1. **User** (_User class)

Parse's built-in user class.

```typescript
{
  objectId: string;          // Auto-generated
  username: string;          // Required for Parse
  email: string;
  password: string;          // Hashed by Parse
  name?: string;
  role: 'user' | 'vendor' | 'admin';
  createdAt: string;         // ISO timestamp
  updatedAt: string;
}
```

**Key Functions:**
- `registerUser(email, password, name, role)` - Create new user
- `loginUser(email, password)` - Authenticate user, returns sessionToken
- `getUser(userId)` - Fetch user details

---

### 2. **Product** class

Product catalog items.

```typescript
{
  objectId: string;
  title: string;
  description: string;
  price: number;
  category: string;          // e.g., "Electronics", "Clothing"
  vendorId: string;          // Reference to Vendor.objectId
  vendorName?: string;
  image?: string;            // URL
  tags?: string[];
  stock?: number;
  status: 'active' | 'draft' | 'blocked' | 'moderation';
  rating?: number;
  reviewsCount?: number;
  createdAt: string;
  updatedAt: string;
}
```

**Key Functions:**
- `createProduct(data)` - Create new product (requires vendorId)
- `getProducts(limit)` - Fetch all active products
- `getProductById(id)` - Fetch single product
- `updateProduct(id, fields)` - Update product details
- `deleteProduct(id)` - Remove product

**Example:**
```typescript
const products = await back4app.getProducts(100);
// Returns only products with status !== 'blocked'
```

---

### 3. **Vendor** class

Seller profiles.

```typescript
{
  objectId: string;
  userId: string;            // Reference to _User.objectId
  shopName: string;
  description?: string;
  rating?: number;
  reviews?: number;
  createdAt: string;
  updatedAt: string;
}
```

**Key Functions:**
- `registerVendor(userId, shopName)` - Create vendor profile
- `getVendorById(id)` - Fetch vendor details

---

### 4. **Order** class

Customer orders.

```typescript
{
  objectId: string;
  userId: string;            // Reference to _User.objectId
  customerName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  comment?: string;
  shippingAddress: string;   // Computed from city + address
  items: Array<{
    productId: string;
    title: string;
    quantity: number;
    price: number;
  }>;
  subtotal?: number;
  deliveryPrice?: number;
  total: number;
  paymentMethod: 'cash' | 'card';
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
```

**Key Functions:**
- `createOrder(data)` - Create new order
- `getOrdersByUser(userId)` - Fetch user's orders
- `getOrderById(id)` - Fetch order details
- `updateOrder(id, fields)` - Update order (e.g., change status)

---

### 5. **Favorites** class

User's favorited products.

```typescript
{
  objectId: string;
  userId: string;            // Reference to _User.objectId
  productId: string;         // Reference to Product.objectId
  createdAt: string;
}
```

**Key Functions:**
- `addToFavorites(userId, productId)` - Add to favorites
- `getFavoritesByUser(userId)` - Fetch user's favorite products
- `removeFromFavorites(userId, productId)` - Remove from favorites

---

## Authentication Flow

### Registration

```typescript
import * as back4app from '../services/back4appRest';

const user = await back4app.registerUser(
  'user@example.com',
  'password123',
  'John Doe',
  'user' // or 'vendor'
);

// user = {
//   objectId: 'abc123...',
//   sessionToken: 'xyz789...',
//   email: 'user@example.com',
//   name: 'John Doe',
//   role: 'user'
// }

// Store in localStorage via UserContext
```

### Login

```typescript
const user = await back4app.loginUser('user@example.com', 'password123');

// user = {
//   objectId: 'abc123...',
//   sessionToken: 'xyz789...',
//   email: 'user@example.com',
//   name: 'John Doe',
//   role: 'user'
// }

// Save sessionToken for subsequent authenticated requests
```

### Session Persistence

The `UserContext` automatically:
1. Saves user data to `localStorage` as `currentUser`
2. Restores on app refresh
3. Provides `useUser()` hook for components

```typescript
import { useUser } from '../context/UserContext';

export const MyComponent = () => {
  const { user, logout } = useUser();
  
  if (!user) return <Navigate to="/login" />;
  
  return <div>Welcome, {user.name}!</div>;
};
```

---

## Complete User Journey

### 1. New User Registration

**Flow:** `RegisterForm.tsx` → `back4appRest.registerUser()` → Back4App _User class

```typescript
// pages/Login.tsx (RegisterForm component)
const handleRegister = async (email, password, name) => {
  try {
    const user = await back4app.registerUser(email, password, name, 'user');
    // User stored in Back4App
    // Redirect to login
  } catch (err) {
    alert('Registration failed: ' + err.message);
  }
};
```

### 2. User Login

**Flow:** `Login.tsx` → `back4appRest.loginUser()` → `UserContext.login()` → localStorage

```typescript
// pages/Login.tsx
const handleLogin = async (email, password) => {
  const user = await back4app.loginUser(email, password);
  login(user);  // UserContext
  navigate('/catalog');
};
```

### 3. Browse Catalog

**Flow:** `Catalog.tsx` → `MarketContext` (useEffect) → `back4appRest.getProducts()` → Back4App Product class

```typescript
// context/MarketContext.tsx
useEffect(() => {
  const loadData = async () => {
    const data = await back4app.getProducts(1000);
    // Filter, map, and display
    setProducts(data);
  };
  loadData();
}, []);
```

### 4. Add to Cart

**Flow:** `ProductCard.tsx` → `MarketContext.addToCart()` → localStorage (no server needed yet)

```typescript
// components/ProductCard.tsx
const { addToCart } = useMarket();

const handleAddCart = () => {
  addToCart(product);
  // Cart stored in localStorage
};
```

### 5. Checkout → Create Order

**Flow:** `Checkout.tsx` → `back4appRest.createOrder()` → Back4App Order class

```typescript
// pages/Checkout.tsx
const handleSubmit = async (formData) => {
  const order = await back4app.createOrder({
    userId: authUser.objectId,
    customerName: formData.firstName + ' ' + formData.lastName,
    phone: formData.phone,
    city: formData.city,
    address: formData.address,
    items: cart.map(item => ({
      productId: item.id,
      title: item.title,
      quantity: item.quantity,
      price: item.price
    })),
    total: cartTotal,
    paymentMethod: formData.paymentMethod,
    status: 'pending'
  });
  
  // Order now in Back4App
  navigate('/success');
};
```

### 6. View Orders in Profile

**Flow:** `Profile.tsx` (useEffect) → `back4appRest.getOrdersByUser()` → Back4App Order class → Display

```typescript
// pages/Profile.tsx
useEffect(() => {
  if (user?.objectId) {
    const loadOrders = async () => {
      const orders = await back4app.getOrdersByUser(user.objectId);
      setOrders(orders);
    };
    loadOrders();
  }
}, [user]);
```

---

## Vendor Workflow

### 1. Become a Seller

**Flow:** `BecomeSeller.tsx` → `back4appRest.registerVendor()` → Back4App Vendor class

```typescript
const handleBecomeSeller = async (shopName) => {
  const vendor = await back4app.registerVendor(user.objectId, shopName);
  // Update user role to 'vendor' in _User class
  updateUserRole(user.objectId, 'vendor');
};
```

### 2. Add Products

**Flow:** `VendorDashboard.tsx` → `AddProductForm` → `back4appRest.createProduct()` → Back4App Product class

```typescript
// components/AddProductForm.tsx
const handleSubmit = async (formData) => {
  const product = await back4app.createProduct({
    title: formData.title,
    description: formData.description,
    price: formData.price,
    category: formData.category,
    vendorId: user.objectId,  // Current vendor
    vendorName: user.name,
    image: formData.image,
    tags: formData.tags,
    status: 'active'
  });
  
  // Product now visible in Catalog
};
```

### 3. Manage Products

**Flow:** `VendorDashboard.tsx` → `back4appRest.getProducts()` (filtered by vendorId)

```typescript
// pages/VendorDashboard.tsx
useEffect(() => {
  const loadVendorProducts = async () => {
    const all = await back4app.getProducts(200);
    const mine = all.filter(p => p.vendorId === user.objectId);
    setVendorProducts(mine);
  };
  loadVendorProducts();
}, [user?.objectId]);
```

**Delete Product:**
```typescript
const handleDelete = async (productId) => {
  await back4app.deleteProduct(productId);
  // Remove from local state
  setVendorProducts(prev => prev.filter(p => p.objectId !== productId));
};
```

---

## REST API Endpoints Reference

**Base URL:** `https://[app-id].b4a.app/parse`

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| Register User | POST | `/classes/_User` | Create new user |
| Login | POST | `/login` | Authenticate user |
| Get User | GET | `/classes/_User/{userId}` | Fetch user details |
| Create Product | POST | `/classes/Product` | Add product to catalog |
| Get Products | GET | `/classes/Product?where=...` | Fetch products (with filters) |
| Update Product | PUT | `/classes/Product/{id}` | Update product |
| Delete Product | DELETE | `/classes/Product/{id}` | Remove product |
| Create Order | POST | `/classes/Order` | Create new order |
| Get Orders | GET | `/classes/Order?where=...` | Fetch user's orders |
| Add Favorite | POST | `/classes/Favorites` | Add to favorites |
| Get Favorites | GET | `/classes/Favorites?where=...` | Fetch favorites |

---

## Error Handling

All `back4appRest` functions throw errors on failure. Handle in try-catch:

```typescript
try {
  const product = await back4app.getProductById(id);
} catch (error) {
  console.error('Failed to load product:', error.message);
  // error.message = "Unauthorized", "Not found", "Network error", etc.
}
```

**Common Errors:**
- `"Unauthorized"` - Missing/invalid sessionToken
- `"Not found"` - Product/user doesn't exist
- `"Network error"` - Connection issue
- `"Bad Request"` - Invalid data format

---

## Testing the Integration

### 1. Test User Registration
```bash
# Visit /register, fill form, submit
# Check: user should appear in Back4App Dashboard → _User class
```

### 2. Test Login
```bash
# Visit /login, enter credentials
# Check: localStorage should have 'currentUser' key
```

### 3. Test Product Creation
```bash
# Login as vendor
# Go to VendorDashboard → Add Product
# Check: product appears in Back4App Dashboard → Product class
# Check: product visible in Catalog for all users
```

### 4. Test Order Creation
```bash
# Add product to cart
# Go to Checkout, fill form, submit
# Check: order appears in Back4App Dashboard → Order class
# Check: order visible in Profile page
```

---

## Troubleshooting

### Products not loading in Catalog
1. Check env variables: `VITE_PARSE_APP_ID`, `VITE_PARSE_REST_KEY`
2. Verify Back4App app is running
3. Check browser console for errors
4. Ensure products exist in Back4App Dashboard → Product class

### Orders not saving
1. Verify user is logged in (`user.objectId` present)
2. Check all required fields in order data
3. Check Back4App logs for validation errors
4. Verify Order class exists in Back4App

### Authentication errors
1. Check credentials are correct
2. Verify _User class exists in Back4App
3. Ensure REST Key is correct (not Master Key)
4. Clear localStorage and re-login

---

## Seed Data

Use the provided script to populate test data:

```bash
node scripts/seed-back4app.js
```

This creates:
- 3 test vendors
- 10+ test products
- 2 test users
- 2 test orders

---

## Performance Considerations

- Products are cached in `MarketContext` with `useEffect` dependency
- Use pagination for large product lists (current limit: 1000)
- Consider caching vendor products locally if list grows
- Back4App includes built-in rate limiting

---

## Security Notes

- **Never commit** `.env.local` with real API keys
- Use **Master Key only for admin/seed scripts**, not frontend
- All user data is **encrypted in transit** (HTTPS)
- Passwords are **hashed** by Parse Server
- Session tokens expire after **24 hours** (configurable)

---

## Next Steps

1. ✅ Core integration complete
2. ⏳ Add order status tracking (pending → processing → shipped → completed)
3. ⏳ Add product reviews/ratings
4. ⏳ Add admin dashboard for order management
5. ⏳ Add payment gateway integration (Stripe/Yandex Kassa)
