/*
  Back4App Seed Script - Initialize Database Schema and Sample Data
  Usage:
    VITE_PARSE_APP_ID=xxx VITE_PARSE_REST_KEY=yyy node scripts/seed-back4app.js
*/

(async () => {
  try {
    const APP_ID = process.env.VITE_PARSE_APP_ID || '';
    const REST_KEY = process.env.VITE_PARSE_REST_KEY || '';
    const MASTER_KEY = process.env.VITE_PARSE_MASTER_KEY || '';

    if (!APP_ID || (!REST_KEY && !MASTER_KEY)) {
      console.error('\n[seed-back4app] ERROR: Missing Back4App credentials.');
      process.exit(1);
    }

    const BASE = 'https://parseapi.back4app.com';
    const headers = {
      'X-Parse-Application-Id': APP_ID,
      'Content-Type': 'application/json',
      ...(REST_KEY ? { 'X-Parse-REST-API-Key': REST_KEY } : { 'X-Parse-Master-Key': MASTER_KEY })
    };

    const create = async (endpoint, body) => {
      const res = await fetch(`${BASE}${endpoint}`, { method: 'POST', headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data));
      return data;
    };

    console.log('[seed-back4app] Creating classes and sample data...\n');

    // Sample Vendors
    console.log('📚 Creating Vendors...');
    const vendor1 = await create('/parse/classes/Vendor', {
      name: 'Smart Books',
      email: 'vendor@smartbooks.com',
      description: 'Online bookstore with rare editions',
      rating: 4.8
    });
    console.log('✓ Vendor:', vendor1.objectId, '- Smart Books');

    const vendor2 = await create('/parse/classes/Vendor', {
      name: 'Tech Supplies Co',
      email: 'sales@techsupplies.com',
      description: 'Premium office and tech supplies',
      rating: 4.5
    });
    console.log('✓ Vendor:', vendor2.objectId, '- Tech Supplies Co\n');

    // Sample Products
    console.log('📦 Creating Products...');
    const product1 = await create('/parse/classes/Product', {
      title: 'The Art of Programming',
      author: 'Donald Knuth',
      category: 'books',
      price: 89.99,
      description: 'A comprehensive guide to algorithms',
      vendorId: vendor1.objectId,
      stock: 15,
      rating: 4.9
    });
    console.log('✓ Product:', product1.objectId, '- The Art of Programming');

    const product2 = await create('/parse/classes/Product', {
      title: 'Mechanical Keyboard - RGB',
      author: 'N/A',
      category: 'stationery',
      price: 149.99,
      description: 'Professional mechanical keyboard with RGB lighting',
      vendorId: vendor2.objectId,
      stock: 25,
      rating: 4.7
    });
    console.log('✓ Product:', product2.objectId, '- Mechanical Keyboard\n');

    // Sample Users
    console.log('👥 Creating Users...');
    const user1 = await create('/parse/classes/_User', {
      username: 'john_doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'customer'
    });
    console.log('✓ User:', user1.objectId, '- john_doe');

    const user2 = await create('/parse/classes/_User', {
      username: 'vendor_user',
      email: 'vendor@example.com',
      password: 'password123',
      role: 'vendor'
    });
    console.log('✓ User:', user2.objectId, '- vendor_user\n');

    // Sample Order
    console.log('🛒 Creating Sample Order...');
    const order = await create('/parse/classes/Order', {
      userId: user1.objectId,
      productIds: [product1.objectId, product2.objectId],
      items: [
        { productId: product1.objectId, title: 'The Art of Programming', price: 89.99, quantity: 1 },
        { productId: product2.objectId, title: 'Mechanical Keyboard', price: 149.99, quantity: 1 }
      ],
      total: 239.98,
      status: 'completed',
      shippingAddress: '123 Main St, New York, NY'
    });
    console.log('✓ Order:', order.objectId, '\n');

    console.log('[seed-back4app] ✓ Database initialized successfully!');
    console.log('\nClasses created:');
    console.log('  - Vendor (vendors with ratings)');
    console.log('  - Product (items for sale)');
    console.log('  - _User (user accounts)');
    console.log('  - Order (purchase orders)');
    console.log('\nYou can now use the REST API with back4appRest.ts helpers.');
    process.exit(0);
  } catch (err) {
    console.error('[seed-back4app] Error:', err.message);
    process.exit(1);
  }
})();
