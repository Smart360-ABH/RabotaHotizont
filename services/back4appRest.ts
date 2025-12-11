/**
 * Back4App REST API Integration (Full CRUD)
 * Provides functions for User, Product, Order, and Vendor management
 */

// Get credentials. Prefer server runtime env for REST key (process.env.PARSE_REST_KEY).
// Keep compatibility with legacy build-time defines but avoid relying on them for server secrets.
declare const __VITE_PARSE_APP_ID__: string | undefined;
declare const __VITE_PARSE_REST_KEY__: string | undefined;
declare const __VITE_PARSE_JS_KEY__: string | undefined;

const PARSE_APP_ID = (typeof __VITE_PARSE_APP_ID__ !== 'undefined' && __VITE_PARSE_APP_ID__) ||
  ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PARSE_APP_ID) || '') || '';

// IMPORTANT: prefer a server-side env var PARSE_REST_KEY (process.env) so the REST key
// is NOT embedded into the client bundle. Fallback to legacy build-time define only
// if present (legacy setups).
const PARSE_REST_KEY = (typeof process !== 'undefined' && (process.env as any).PARSE_REST_KEY) ||
  (typeof __VITE_PARSE_REST_KEY__ !== 'undefined' ? __VITE_PARSE_REST_KEY__ : '');

const API_BASE_URL = 'https://parseapi.back4app.com';
// If running in browser and REST key is not available, fallback to Parse JS SDK
import * as parseSDK from './parseSDK';
import Parse from 'parse';
import { notifySessionExpired } from './back4app';
let USE_PARSE_SDK_IN_BROWSER = false;

// Debug logging
if (typeof window !== 'undefined') {
  console.log('🔐 Back4App Initialization:', {
    PARSE_APP_ID: PARSE_APP_ID ? '✓ SET (' + PARSE_APP_ID.substring(0, 10) + '...)' : '✗ MISSING',
    PARSE_REST_KEY: PARSE_REST_KEY ? '✓ SET (' + PARSE_REST_KEY.substring(0, 10) + '...)' : '✗ MISSING',
    initialized: !!(PARSE_APP_ID && PARSE_REST_KEY),
  });
}

export function isInitialized(): boolean {
  const result = !!(PARSE_APP_ID && PARSE_REST_KEY);
  if (!result) {
    console.warn('⚠️ Back4App not properly initialized', {
      hasAppId: !!PARSE_APP_ID,
      hasRestKey: !!PARSE_REST_KEY,
    });
  }
  // If we're in browser and no REST key but we have Parse JS SDK envs, allow SDK usage
  if (typeof window !== 'undefined' && !PARSE_REST_KEY) {
    try {
      const sdkAppId = (typeof __VITE_PARSE_APP_ID__ !== 'undefined' ? __VITE_PARSE_APP_ID__ : (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PARSE_APP_ID)) || '';
      const sdkJsKey = (typeof __VITE_PARSE_JS_KEY__ !== 'undefined' ? __VITE_PARSE_JS_KEY__ : (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PARSE_JS_KEY)) || '';
      if (sdkAppId && sdkJsKey) {
        // Initialize Parse JS SDK for browser usage
        try {
          parseSDK.initializeParse(sdkAppId, sdkJsKey);
        } catch { }
        USE_PARSE_SDK_IN_BROWSER = true;
        return true;
      }
    } catch { }
  }

  return result;
}

export function isUserAuthenticated(): boolean {
  // Check if there's an authenticated user in Parse SDK
  try {
    const currentUser = Parse.User.current();
    return !!currentUser && !!currentUser.getSessionToken();
  } catch {
    return false;
  }
}

async function parseRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, any>
) {
  if (!isInitialized()) {
    throw new Error('Back4App not initialized: missing PARSE_REST_KEY (set server env PARSE_REST_KEY) or VITE_PARSE_APP_ID.\nDo NOT expose REST key to client — prefer server-side env or Cloud Code.');
  }

  // Check for current user session token in browser SDK usage
  let sessionToken = '';
  if (typeof window !== 'undefined') {
    try {
      const u = Parse.User.current();
      if (u) sessionToken = u.getSessionToken();
    } catch { }
  }

  const headers: Record<string, string> = {
    'X-Parse-Application-Id': PARSE_APP_ID,
    'X-Parse-REST-API-Key': PARSE_REST_KEY,
    'Content-Type': 'application/json',
  };

  if (sessionToken) {
    headers['X-Parse-Session-Token'] = sessionToken;
  }

  const options: RequestInit = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const url = `${API_BASE_URL}${endpoint}`;
  // Debug: log request (mask keys)
  if (typeof window !== 'undefined') {
    try {
      const masked = { ...headers } as any;
      if (masked['X-Parse-Application-Id']) masked['X-Parse-Application-Id'] = '***';
      if (masked['X-Parse-REST-API-Key']) masked['X-Parse-REST-API-Key'] = '***';
      // eslint-disable-next-line no-console
      console.debug('⤴️ Back4App Request:', { url, method, headers: masked, hasBody: !!body });
    } catch { }
  }

  // Validate headers: browsers require header values to be ISO-8859-1 compatible
  // If a header value contains non-Latin1 characters, fetch will throw a generic error.
  // We detect this early and throw a clearer message (without printing secrets).
  try {
    for (const [k, v] of Object.entries(headers)) {
      if (typeof v === 'string') {
        for (let i = 0; i < v.length; i++) {
          const cp = v.codePointAt(i) || 0;
          if (cp > 255) {
            // Found non ISO-8859-1 codepoint in header value.
            throw new Error(`Invalid header value encoding: header "${k}" contains characters outside ISO-8859-1 (check env or header source).`);
          }
          // If character is a surrogate pair, advance extra index
          if (cp > 0xffff) i++;
        }
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Header encoding validation failed:', { message: (err as Error).message, headerProblem: true });
    throw err;
  }

  const response = await fetch(url, options);
  let data: any = null;
  const text = await response.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    data = text;
  }

  if (!response.ok) {
    // Check for 403 Unauthorized - token is invalid
    if (response.status === 403) {
      console.warn('⚠️ 403 Unauthorized: Session token is invalid or expired');
      notifySessionExpired();
    }

    // More detailed error for debugging
    const errMsg = (data && (data.error || data.message)) || response.statusText || `HTTP ${response.status}`;
    // eslint-disable-next-line no-console
    console.error('⤵️ Back4App Response Error:', { url, status: response.status, body: data });
    throw new Error(errMsg);
  }

  // eslint-disable-next-line no-console
  console.debug('⤵️ Back4App Response OK:', { url, status: response.status, body: data });
  return data;
}

// Try proxying via app backend if available at /api
async function proxyApiRequest(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) {
  if (typeof window === 'undefined') throw new Error('proxyApiRequest only available in browser');
  try {
    const url = `/api${path}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    // Inject Session Token if available
    try {
      const u = Parse.User.current();
      if (u) {
        const token = u.getSessionToken();
        if (token) headers['X-Parse-Session-Token'] = token;
      }
    } catch { }

    const opts: RequestInit = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) throw new Error((data && (data.error || data.message)) || res.statusText || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    // propagate error to caller to allow fallback
    throw err;
  }
}

// ============ USER / AUTHENTICATION ============

export async function registerUser(username: string, email: string, password: string, role = 'customer') {
  if (USE_PARSE_SDK_IN_BROWSER) return parseSDK.registerUser(username, email, password, role as 'vendor' | 'customer');
  return parseRequest('/classes/_User', 'POST', { username, email, password, role });
}

export async function loginUser(username: string, password: string) {
  if (USE_PARSE_SDK_IN_BROWSER) return parseSDK.loginUser(username, password);
  return parseRequest(`/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
}

export async function getUserById(userId: string) {
  if (USE_PARSE_SDK_IN_BROWSER) {
    const User = Parse.Object.extend('_User');
    const query = new Parse.Query(User);
    return query.get(userId);
  }
  return parseRequest(`/classes/_User/${userId}`);
}

export async function updateUser(userId: string, fields: Record<string, any>) {
  if (USE_PARSE_SDK_IN_BROWSER) return parseSDK.updateUserProfile(userId, fields);
  return parseRequest(`/parse/classes/_User/${userId}`, 'PUT', fields);
}


export async function getUsersByRole(role: string) {
  if (USE_PARSE_SDK_IN_BROWSER) {
    const User = Parse.Object.extend('_User');
    const query = new Parse.Query(User);
    query.equalTo('role', role);
    return query.find();
  }
  const where = { role };
  return parseRequest(`/classes/_User?where=${encodeURIComponent(JSON.stringify(where))}`);
}

// ============ PRODUCTS ============

export async function createProduct(data: Record<string, any>) {
  // Ensure ACL allows public read and Vendor write
  const payload = { ...data };

  if (!payload.ACL) {
    const acl: any = { '*': { read: true } };
    if (payload.vendorId) {
      acl[payload.vendorId] = { read: true, write: true };
    }
    payload.ACL = acl;
  }

  // Content Moderation: Default to pending
  if (!payload.status) {
    payload.status = 'pending';
  }

  if (USE_PARSE_SDK_IN_BROWSER) return parseSDK.createProduct(payload.vendorId || 'unknown', payload as any);
  return parseRequest('/classes/Product', 'POST', payload);
}

// Upload a file (image) to Back4App Parse Files endpoint
export async function uploadFile(file: File, sessionToken?: string) {
  if (!isInitialized()) {
    throw new Error('Back4App not initialized: missing VITE_PARSE_APP_ID or VITE_PARSE_REST_KEY');
  }

  // If no sessionToken provided, try to get from current Parse user
  if (!sessionToken) {
    try {
      const currentUser = Parse.User.current();
      if (currentUser) {
        sessionToken = currentUser.getSessionToken();
      }
    } catch { }
  }

  const url = `${API_BASE_URL}/files/${encodeURIComponent(file.name)}`;
  const headers: Record<string, string> = {
    'X-Parse-Application-Id': PARSE_APP_ID,
    'X-Parse-REST-API-Key': PARSE_REST_KEY,
    // Content-Type should be the file's mime type
    'Content-Type': file.type || 'application/octet-stream',
  };
  if (sessionToken) {
    headers['X-Parse-Session-Token'] = sessionToken;
  }

  // Debug log
  if (typeof window !== 'undefined') {
    try {
      const masked = { ...headers } as any;
      masked['X-Parse-Application-Id'] = '***';
      masked['X-Parse-REST-API-Key'] = '***';
      masked['X-Parse-Session-Token'] = masked['X-Parse-Session-Token'] ? '***' : undefined;
      // eslint-disable-next-line no-console
      console.debug('⤴️ Back4App File Upload Request:', { url, headers: masked, fileName: file.name, fileType: file.type });
    } catch { }
  }

  if (USE_PARSE_SDK_IN_BROWSER) {
    // Delegate to Parse JS SDK implementation for browser
    return parseSDK.uploadProductImage(file as File);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: file as any,
  });

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    data = text;
  }

  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error('⤵️ Back4App File Upload Error:', { url, status: response.status, body: data });
    throw new Error((data && (data.error || data.message)) || response.statusText || `HTTP ${response.status}`);
  }

  // eslint-disable-next-line no-console
  console.debug('⤵️ Back4App File Upload OK:', { url, status: response.status, body: data });
  return data; // { name, url }
}

export async function getProducts(limit = 100) {
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Product = Parse.Object.extend('Product');
    const query = new Parse.Query(Product);
    query.limit(limit);
    query.descending('createdAt');
    return query.find();
  }
  return parseRequest(`/classes/Product?limit=${limit}`);
}

export async function getProductsByVendor(vendorId: string) {
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Product = Parse.Object.extend('Product');
    const query = new Parse.Query(Product);
    query.equalTo('vendorId', vendorId);
    query.limit(1000); // Fetch enough to check for duplicates
    return query.find();
  }
  const where = { vendorId };
  return parseRequest(`/classes/Product?where=${encodeURIComponent(JSON.stringify(where))}&limit=1000`);
}

export async function getProductsByCategory(category: string) {
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Product = Parse.Object.extend('Product');
    const query = new Parse.Query(Product);
    query.equalTo('category', category);
    query.descending('createdAt');
    return query.find();
  }
  const where = { category };
  return parseRequest(`/classes/Product?where=${encodeURIComponent(JSON.stringify(where))}`);
}

export async function getProductById(productId: string) {
  if (USE_PARSE_SDK_IN_BROWSER) return parseSDK.getProductById(productId);
  return parseRequest(`/classes/Product/${productId}`);
}

export async function updateProduct(productId: string, fields: Record<string, any>) {
  if (USE_PARSE_SDK_IN_BROWSER) return parseSDK.updateProduct(productId, fields);
  return parseRequest(`/classes/Product/${productId}`, 'PUT', fields);
}

export async function deleteProduct(productId: string) {
  // ACLs are now fixed, so we can delete directly as the authenticated user
  if (USE_PARSE_SDK_IN_BROWSER) return parseSDK.deleteProduct(productId as any);
  return parseRequest(`/classes/Product/${productId}`, 'DELETE');
}

// ============ VENDORS ============

export async function createVendor(data: {
  name: string;
  email: string;
  description: string;
  rating?: number;
}) {
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Vendor = Parse.Object.extend('Vendor');
    const vendor = new Vendor();
    Object.entries(data).forEach(([k, v]) => vendor.set(k, v));
    await vendor.save();
    return vendor;
  }
  return parseRequest('/classes/Vendor', 'POST', data);
}

export async function getVendors() {
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Vendor = Parse.Object.extend('Vendor');
    const query = new Parse.Query(Vendor);
    query.descending('createdAt');
    return query.find();
  }
  return parseRequest('/classes/Vendor');
}

export async function getVendorById(vendorId: string) {
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Vendor = Parse.Object.extend('Vendor');
    const query = new Parse.Query(Vendor);
    return query.get(vendorId);
  }
  return parseRequest(`/ classes / Vendor / ${vendorId} `);
}

export async function updateVendor(vendorId: string, fields: Record<string, any>) {
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Vendor = Parse.Object.extend('Vendor');
    const vendor = await new Parse.Query(Vendor).get(vendorId);
    Object.entries(fields).forEach(([k, v]) => vendor.set(k, v));
    await vendor.save();
    return vendor;
  }
  return parseRequest(`/ classes / Vendor / ${vendorId} `, 'PUT', fields);
}

// ============ ORDERS ============

export async function createOrder(data: {
  userId: string;
  customerName?: string;
  email?: string;
  phone?: string;
  city?: string;
  address?: string;
  shippingAddress?: string;
  comment?: string;
  items: Array<{ productId: string; title: string; price: number; quantity: number }>;
  total: number;
  subtotal?: number;
  deliveryPrice?: number;
  paymentMethod?: 'cash' | 'card';
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  createdAt?: string;
}) {
  // Normalize shippingAddress
  const shippingAddress = data.shippingAddress || `${data.city}, ${data.address} ` || data.address || '';

  const orderData = {
    userId: data.userId,
    customerName: data.customerName,
    email: data.email,
    phone: data.phone,
    city: data.city,
    address: data.address,
    comment: data.comment,
    items: data.items,
    total: data.total,
    subtotal: data.subtotal,
    deliveryPrice: data.deliveryPrice,
    paymentMethod: data.paymentMethod,
    status: data.status,
    shippingAddress
  };

  if (USE_PARSE_SDK_IN_BROWSER) {
    const Order = Parse.Object.extend('Order');
    const order = new Order();
    Object.entries(orderData).forEach(([k, v]) => order.set(k, v));
    await order.save();
    return order;
  }
  return parseRequest('/classes/Order', 'POST', orderData);
}

export async function getOrdersByUser(userId: string) {
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Order = Parse.Object.extend('Order');
    const query = new Parse.Query(Order);
    query.equalTo('userId', userId);
    query.descending('createdAt');
    return query.find();
  }
  const where = { userId };
  return parseRequest(`/ classes / Order ? where = ${encodeURIComponent(JSON.stringify(where))} `);
}

export async function getOrderById(orderId: string) {
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Order = Parse.Object.extend('Order');
    return new Parse.Query(Order).get(orderId);
  }
  return parseRequest(`/ classes / Order / ${orderId} `);
}

export async function updateOrder(orderId: string, fields: Record<string, any>) {
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Order = Parse.Object.extend('Order');
    const order = await new Parse.Query(Order).get(orderId);
    Object.entries(fields).forEach(([k, v]) => order.set(k, v));
    await order.save();
    return order;
  }
  return parseRequest(`/ classes / Order / ${orderId} `, 'PUT', fields);
}

export async function deleteOrder(orderId: string) {
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Order = Parse.Object.extend('Order');
    const order = await new Parse.Query(Order).get(orderId);
    await order.destroy();
    return;
  }
  return parseRequest(`/ classes / Order / ${orderId} `, 'DELETE');
}

// ============ FAVORITES (User Wishlist) ============

export async function addToFavorites(userId: string, productId: string) {
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Favorite = Parse.Object.extend('Favorite');
    const fav = new Favorite();
    fav.set('userId', userId);
    fav.set('productId', productId);
    await fav.save();
    return fav;
  }
  return parseRequest('/classes/Favorite', 'POST', { userId, productId });
}

export async function getFavoritesByUser(userId: string) {
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Favorite = Parse.Object.extend('Favorite');
    const query = new Parse.Query(Favorite);
    query.equalTo('userId', userId);
    query.descending('createdAt');
    return query.find();
  }
  const where = { userId };
  return parseRequest(`/ classes / Favorite ? where = ${encodeURIComponent(JSON.stringify(where))} `);
}

export async function removeFavorite(favoriteId: string) {
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Favorite = Parse.Object.extend('Favorite');
    const fav = await new Parse.Query(Favorite).get(favoriteId);
    await fav.destroy();
    return;
  }
  return parseRequest(`/ classes / Favorite / ${favoriteId} `, 'DELETE');
}

// ============ REVIEWS ============

export async function createReview(data: Record<string, any>) {
  // Prefer calling server-side proxy in browser to avoid exposing REST key
  if (typeof window !== 'undefined') {
    try {
      const proxied = await proxyApiRequest('/reviews', 'POST', data);
      return proxied;
    } catch (err) {
      // fallback to existing behavior
      console.warn('[createReview] Proxy failed, falling back to direct Parse REST:', err);
    }
  }
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Review = Parse.Object.extend('Review');
    const rev = new Review();
    Object.entries(data).forEach(([k, v]) => rev.set(k, v));
    await rev.save();
    return rev;
  }
  return parseRequest('/classes/Review', 'POST', data);
}

export async function getReviews(where: Record<string, any> | null = null) {
  const q = where ? `? where = ${encodeURIComponent(JSON.stringify(where))} ` : '';
  // Try proxy first
  if (typeof window !== 'undefined') {
    try {
      const proxied = await proxyApiRequest(`/ reviews${q} `, 'GET');
      return proxied;
    } catch (err) {
      console.warn('[getReviews] Proxy failed, falling back to direct Parse REST:', err);
    }
  }
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Review = Parse.Object.extend('Review');
    const qobj = new Parse.Query(Review);
    if (where) Object.entries(where).forEach(([k, v]) => qobj.equalTo(k, v));
    qobj.descending('createdAt');
    return qobj.find();
  }
  return parseRequest(`/ classes / Review${q} `);
}

export async function updateReview(reviewId: string, fields: Record<string, any>) {
  if (typeof window !== 'undefined') {
    try {
      const proxied = await proxyApiRequest(`/ reviews / ${encodeURIComponent(reviewId)} `, 'PUT', fields);
      return proxied;
    } catch (err) {
      console.warn('[updateReview] Proxy failed, falling back to direct Parse REST:', err);
    }
  }
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Review = Parse.Object.extend('Review');
    const obj = await new Parse.Query(Review).get(reviewId);
    Object.entries(fields).forEach(([k, v]) => obj.set(k, v));
    await obj.save();
    return obj;
  }
  return parseRequest(`/ classes / Review / ${reviewId} `, 'PUT', fields);
}

export async function deleteReview(reviewId: string) {
  if (typeof window !== 'undefined') {
    try {
      const proxied = await proxyApiRequest(`/ reviews / ${encodeURIComponent(reviewId)} `, 'DELETE');
      return proxied;
    } catch (err) {
      console.warn('[deleteReview] Proxy failed, falling back to direct Parse REST:', err);
    }
  }
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Review = Parse.Object.extend('Review');
    const obj = await new Parse.Query(Review).get(reviewId);
    await obj.destroy();
    return;
  }
  return parseRequest(`/ classes / Review / ${reviewId} `, 'DELETE');
}

// ============ APPEALS (Reports / Moderation) ============

export async function createAppeal(data: Record<string, any>) {
  if (typeof window !== 'undefined') {
    try {
      const proxied = await proxyApiRequest('/appeals', 'POST', data);
      return proxied;
    } catch (err) {
      console.warn('[createAppeal] Proxy failed, falling back to direct Parse REST:', err);
    }
  }
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Appeal = Parse.Object.extend('Appeal');
    const ap = new Appeal();
    Object.entries(data).forEach(([k, v]) => ap.set(k, v));
    await ap.save();
    return ap;
  }
  return parseRequest('/classes/Appeal', 'POST', data);
}

export async function getAppeals(where: Record<string, any> | null = null) {
  const q = where ? `? where = ${encodeURIComponent(JSON.stringify(where))} ` : '';
  if (typeof window !== 'undefined') {
    try {
      const proxied = await proxyApiRequest(`/ appeals${q} `, 'GET');
      return proxied;
    } catch (err) {
      console.warn('[getAppeals] Proxy failed, falling back to direct Parse REST:', err);
    }
  }
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Appeal = Parse.Object.extend('Appeal');
    const qobj = new Parse.Query(Appeal);
    if (where) Object.entries(where).forEach(([k, v]) => qobj.equalTo(k, v));
    qobj.descending('createdAt');
    return qobj.find();
  }
  return parseRequest(`/ classes / Appeal${q} `);
}

export async function updateAppeal(appealId: string, fields: Record<string, any>) {
  if (typeof window !== 'undefined') {
    try {
      const proxied = await proxyApiRequest(`/ appeals / ${encodeURIComponent(appealId)} `, 'PUT', fields);
      return proxied;
    } catch (err) {
      console.warn('[updateAppeal] Proxy failed, falling back to direct Parse REST:', err);
    }
  }
  if (USE_PARSE_SDK_IN_BROWSER) {
    const Appeal = Parse.Object.extend('Appeal');
    const obj = await new Parse.Query(Appeal).get(appealId);
    Object.entries(fields).forEach(([k, v]) => obj.set(k, v));
    await obj.save();
    return obj;
  }
  return parseRequest(`/ classes / Appeal / ${appealId} `, 'PUT', fields);
}

// ============ CHAT (Unified Chat Service) ============

export async function createConversation(participants: string[], context?: any) {
  if (typeof window === 'undefined') return null;
  // Use proxy to our Express backend which handles logic
  try {
    // payload: { participants: ['u1', 'v1'], context: {...} }
    return await proxyApiRequest('/conversations', 'POST', { participants, context });
  } catch (err) {
    console.warn('[createConversation] Failed:', err);
    throw err;
  }
}

export default {
  isInitialized,
  isUserAuthenticated,
  registerUser,
  loginUser,
  getUserById,
  getUsersByRole,
  updateUser,
  createProduct,
  getProducts,
  getProductsByCategory,
  getProductById,
  updateProduct,
  deleteProduct,
  createVendor,
  uploadFile,
  getVendors,
  getVendorById,
  updateVendor,
  createOrder,
  getOrdersByUser,
  getOrderById,
  updateOrder,
  deleteOrder,
  addToFavorites,
  getFavoritesByUser,
  removeFavorite,
  createReview,
  getReviews,
  updateReview,
  deleteReview,
  createAppeal,
  getAppeals,
  updateAppeal,
  createConversation,
};
