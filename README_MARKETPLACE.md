# 🛍️ Marketplace - Back4App Integration Complete

A fully functional marketplace built with React + TypeScript + Vite, powered by **Back4App** (Parse Server) for backend data persistence.

## ✨ Features

### For Customers
✅ **User Registration & Login** - Secure account creation and authentication  
✅ **Browse Catalog** - Search and filter products by category, price, popularity  
✅ **Shopping Cart** - Add/remove items, persistent storage  
✅ **Checkout** - Complete order form with address and payment method selection  
✅ **Order History** - View all past orders with details  
✅ **Favorites** - Save favorite products (ready for UI integration)  
✅ **Dark Mode** - Auto-switch based on time of day  

### For Vendors/Sellers
✅ **Vendor Registration** - Become a seller and create a shop  
✅ **Product Management** - Add, edit, delete products  
✅ **Dashboard** - View sales stats and product inventory  
✅ **Vendor Profile** - Public shop profile visible to customers  

### Technical Features
✅ **Back4App REST API Integration** - No Parse SDK, pure REST  
✅ **Centralized State Management** - React Contexts (UserContext, MarketContext)  
✅ **TypeScript** - Full type safety across the app  
✅ **Responsive Design** - Mobile-first Tailwind CSS  
✅ **Error Handling** - User-friendly error messages  
✅ **localStorage Persistence** - Cart and user data saved locally  

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- Back4App account (free tier available at [back4app.com](https://back4app.com))
- Your favorite code editor

### 2. Setup Back4App

1. Go to [back4app.com](https://back4app.com) and create a free account
2. Create a new Parse Server app
3. Go to **Settings → Keys** and copy:
   - **Application ID**
   - **REST API Key**
   - **JavaScript Key**

### 3. Configure Environment

Create `.env.local` in the project root:

```env
# Required for Back4App integration
VITE_PARSE_APP_ID=your_app_id_here
VITE_PARSE_REST_KEY=your_rest_key_here
VITE_PARSE_JS_KEY=your_js_key_here

# Optional: For AI Assistant features
VITE_GEMINI_API_KEY=your_gemini_key_here
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Seed Database (Optional)

Populate with test data:

```bash
node scripts/seed-back4app.js
```

This creates:
- 3 test vendors
- 10+ test products  
- 2 test users (credentials: `test@test.com` / `password123`)
- 2 sample orders

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📋 User Workflows

### Customer Flow

```
1. Register/Login
   └─ pages/Login.tsx
   └─ back4appRest.registerUser() / loginUser()
   └─ Save to UserContext + localStorage

2. Browse Catalog
   └─ pages/Catalog.tsx
   └─ Load from MarketContext.products
   └─ MarketContext → back4appRest.getProducts()
   └─ Filter by category, search, price range

3. Add to Cart
   └─ components/ProductCard.tsx
   └─ MarketContext.addToCart()
   └─ Cart stored in localStorage

4. Checkout
   └─ pages/Checkout.tsx
   └─ Fill order form (name, phone, address, payment method)
   └─ back4appRest.createOrder()
   └─ Order saved to Back4App

5. View Orders
   └─ pages/Profile.tsx
   └─ back4appRest.getOrdersByUser()
   └─ Display order history
```

### Vendor Flow

```
1. Register as Vendor
   └─ pages/BecomeSeller.tsx
   └─ back4appRest.registerVendor()
   └─ Update user role to 'vendor'

2. Access Vendor Dashboard
   └─ pages/VendorDashboard.tsx (Protected)
   └─ Tabs: Dashboard, Products, Orders, Settings

3. Add Products
   └─ VendorDashboard → "Добавить" button
   └─ components/AddProductForm
   └─ back4appRest.createProduct()

4. Manage Products
   └─ Edit: Not yet implemented (placeholder)
   └─ Delete: Removes from Back4App immediately
   └─ Products filtered by vendorId

5. View Orders
   └─ VendorDashboard → Orders tab
   └─ back4appRest.getOrdersByUser() (future)
```

---

## 📁 Project Structure

```
market/
├── src/
│   ├── App.tsx                 # Main app component with routing
│   ├── index.tsx               # React entry point
│   ├── vite-env.d.ts           # Vite type definitions
│   │
│   ├── pages/                  # Page components
│   │   ├── Home.tsx            # Landing page
│   │   ├── Login.tsx           # Login & Registration
│   │   ├── Catalog.tsx         # Product catalog with filters
│   │   ├── ProductDetails.tsx  # Single product page
│   │   ├── Cart.tsx            # Shopping cart
│   │   ├── Checkout.tsx        # Order form ✅ Back4App integrated
│   │   ├── Profile.tsx         # User profile & order history ✅ Back4App integrated
│   │   ├── VendorDashboard.tsx # Vendor panel ✅ Back4App integrated
│   │   ├── VendorPage.tsx      # Public vendor profile
│   │   ├── BecomeSeller.tsx    # Vendor registration
│   │   ├── Categories.tsx      # Category browser
│   │   ├── Favorites.tsx       # Saved products
│   │   └── Admin.tsx           # Admin panel (future)
│   │
│   ├── components/             # Reusable components
│   │   ├── ProductCard.tsx     # Product display card
│   │   ├── AddProductForm.tsx  # Vendor product form ✅ Back4App integrated
│   │   ├── AIAssistant.tsx     # AI chat helper
│   │   ├── IntroAnimation.tsx  # Welcome animation
│   │   └── Layout.tsx          # App wrapper
│   │
│   ├── context/                # React Context providers
│   │   ├── UserContext.tsx     # Auth state ✅ Back4App integrated
│   │   └── MarketContext.tsx   # Global market state ✅ Back4App integrated
│   │
│   ├── services/               # API and external services
│   │   ├── back4appRest.ts     # ✅ Back4App REST API wrapper (15+ functions)
│   │   ├── api.ts              # Legacy API (deprecated)
│   │   └── gemini.ts           # Google Gemini AI integration
│   │
│   ├── types.ts                # TypeScript interfaces
│   ├── constants.ts            # App constants and mock data
│   ├── config.ts               # Config files
│   └── metadata.json           # App metadata
│
├── scripts/
│   ├── seed-back4app.js        # 🌱 Populate test data
│   └── test-workflow.js        # 🧪 Test complete flow
│
├── public/                     # Static assets
├── index.html                  # HTML template
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript config
├── package.json                # Dependencies
├── .env.local                  # Environment variables (not committed)
│
└── BACKEND_INTEGRATION.md      # 📚 Full API documentation
```

---

## 🔑 Key Components

### `services/back4appRest.ts` - REST API Wrapper

**15+ functions** for all Back4App operations:

```typescript
// User authentication
registerUser(email, password, name, role)
loginUser(email, password)
getUser(userId)

// Products
createProduct(data)
getProducts(limit)
getProductById(id)
updateProduct(id, fields)
deleteProduct(id)

// Orders
createOrder(data)
getOrdersByUser(userId)
getOrderById(id)
updateOrder(id, fields)

// Vendors
registerVendor(userId, shopName)
getVendorById(id)

// Favorites
addToFavorites(userId, productId)
getFavoritesByUser(userId)
removeFromFavorites(userId, productId)
```

### `context/UserContext.tsx` - Auth State

```typescript
const { user, logout, login } = useUser();

// Automatically persists to localStorage
// Auto-restores on page refresh
// User = { objectId, email, name, role, sessionToken }
```

### `context/MarketContext.tsx` - Global Market State

```typescript
const { products, cart, addToCart, removeFromCart } = useMarket();

// Products loaded from Back4App
// Cart stored in localStorage
// Favorites, reviews, vendors also available
```

---

## 🔌 API Integration Details

### Authentication Flow

```
1. User enters credentials
   ↓
2. back4appRest.loginUser() sends to Back4App
   ↓
3. Back4App returns { objectId, sessionToken, email, name, role }
   ↓
4. Save to UserContext + localStorage
   ↓
5. All subsequent requests include sessionToken in Authorization header
```

### Product Loading Flow

```
1. MarketContext mounts
   ↓
2. useEffect triggers
   ↓
3. back4appRest.getProducts(1000) fetches from Back4App
   ↓
4. Map to local Product format
   ↓
5. Filter by status (only 'active' shown)
   ↓
6. Set to state: setProducts(data)
   ↓
7. Catalog.tsx displays filtered/sorted products
```

### Order Creation Flow

```
1. User fills Checkout form
   ↓
2. handleSubmit() → back4appRest.createOrder()
   ↓
3. REST request to Back4App Order class
   ↓
4. Back4App validates and saves
   ↓
5. Returns { objectId, ... }
   ↓
6. Create local order object
   ↓
7. Add to MarketContext.orders
   ↓
8. Clear cart, show success screen
   ↓
9. Order visible in Profile page
```

---

## 🧪 Testing

### Test Complete Workflow

```bash
node scripts/test-workflow.js
```

This tests:
1. User registration
2. User login
3. Vendor registration
4. Product creation
5. Product fetching
6. Order creation
7. Order retrieval
8. Vendor products filtering

### Manual Testing Checklist

- [ ] Register new account → Check Back4App _User class
- [ ] Login → Check localStorage has 'currentUser'
- [ ] Add product as vendor → Check Back4App Product class
- [ ] Add product to cart → Check localStorage has 'cart'
- [ ] Checkout → Check Back4App Order class
- [ ] View order in Profile → Should show order from Back4App

---

## 📊 Data Models

### _User (Built-in Parse class)
```json
{
  "objectId": "abc123...",
  "username": "john.doe",
  "email": "john@example.com",
  "name": "John Doe",
  "role": "user|vendor|admin",
  "createdAt": "2025-11-30T12:00:00.000Z"
}
```

### Product
```json
{
  "objectId": "prod123...",
  "title": "Laptop",
  "description": "Gaming laptop",
  "price": 50000,
  "category": "Electronics",
  "vendorId": "vendor123...",
  "image": "https://...",
  "status": "active",
  "tags": ["gaming", "laptop"],
  "stock": 10,
  "createdAt": "2025-11-30T12:00:00.000Z"
}
```

### Order
```json
{
  "objectId": "order123...",
  "userId": "user123...",
  "customerName": "John Doe",
  "email": "john@example.com",
  "phone": "+7-999-888-7766",
  "city": "Сухум",
  "address": "ул. Примерная, 123",
  "items": [
    {
      "productId": "prod123...",
      "title": "Laptop",
      "quantity": 1,
      "price": 50000
    }
  ],
  "total": 50200,
  "paymentMethod": "cash",
  "status": "pending",
  "createdAt": "2025-11-30T12:00:00.000Z"
}
```

---

## 🛠️ Development

### Available Scripts

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Seed test data
node scripts/seed-back4app.js

# Test workflow
node scripts/test-workflow.js
```

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_PARSE_APP_ID` | ✅ Yes | Back4App Application ID |
| `VITE_PARSE_REST_KEY` | ✅ Yes | Back4App REST API Key |
| `VITE_PARSE_JS_KEY` | ⏳ Optional | Back4App JavaScript Key |
| `VITE_GEMINI_API_KEY` | ⏳ Optional | Google Gemini API Key |

---

## 🚨 Troubleshooting

### "Module not found" errors
```bash
npm install
```

### Products not loading
- Check env variables in `.env.local`
- Verify Back4App app is running
- Check browser DevTools Console for API errors
- Ensure products exist in Back4App Dashboard

### Orders not saving
- Verify user is logged in (`user?.objectId` should exist)
- Check all required fields are filled
- Look for errors in browser console
- Verify Order class exists in Back4App

### Authentication failing
- Clear browser cache and localStorage
- Check credentials are correct
- Verify REST API Key (not Master Key)
- Re-login and try again

---

## 📚 Documentation

- **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)** - Detailed API reference and data models
- **[Back4App Official Docs](https://www.back4app.com/docs)** - Parse Server documentation
- **[React Documentation](https://react.dev)** - React 19 docs
- **[Tailwind CSS](https://tailwindcss.com)** - CSS framework

---

## 🎯 Roadmap

### ✅ Completed
- User registration & authentication
- Product catalog with filters
- Shopping cart
- Order creation
- Vendor dashboard
- Dark mode

### 🔄 In Progress
- Order status tracking (pending → processing → shipped → completed)

### ⏳ Coming Soon
- Payment gateway integration (Stripe/Yandex Kassa)
- Product reviews & ratings
- Admin dashboard
- Email notifications
- Real-time chat support
- Product recommendations

---

## 💡 Tips & Tricks

### Adding a New Product Field
1. Add field to Product class in Back4App Dashboard
2. Update `VendorProduct` interface in `pages/VendorDashboard.tsx`
3. Add form field to `components/AddProductForm.tsx`
4. Update `back4appRest.createProduct()` to include new field

### Customizing Categories
- Edit `CATEGORY_HIERARCHY` in `pages/Catalog.tsx`
- Categories sync across Catalog filtering
- No database migration needed

### Testing Locally
- Use `scripts/test-workflow.js` for quick validation
- Check Back4App Dashboard for real-time data
- Browser DevTools Network tab shows all REST calls

---

## 📧 Support

For issues or questions:
1. Check [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) troubleshooting section
2. Review browser console for error messages
3. Check Back4App Dashboard logs
4. Run `node scripts/test-workflow.js` to verify connectivity

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

Built with:
- [React 19](https://react.dev) - UI library
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [Vite](https://vitejs.dev) - Build tool
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Back4App](https://www.back4app.com) - Backend as a Service
- [lucide-react](https://lucide.dev) - Icons
- [react-router](https://reactrouter.com) - Routing

---

**Happy shopping! 🛍️**
