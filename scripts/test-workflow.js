#!/usr/bin/env node
/**
 * Marketplace Workflow Test
 * 
 * Tests the complete marketplace flow:
 * 1. User registration
 * 2. User login
 * 3. Product creation by vendor
 * 4. Product listing
 * 5. Order creation
 * 6. Order retrieval
 * 
 * Usage: node scripts/test-workflow.js
 * Requires: VITE_PARSE_APP_ID, VITE_PARSE_REST_KEY in .env.local
 */

require('dotenv').config({ path: '.env.local' });

const API_BASE = 'https://parseapi.back4app.com';
const APP_ID = process.env.VITE_PARSE_APP_ID;
const REST_KEY = process.env.VITE_PARSE_REST_KEY;

if (!APP_ID || !REST_KEY) {
  console.error('❌ Error: Missing VITE_PARSE_APP_ID or VITE_PARSE_REST_KEY in .env.local');
  process.exit(1);
}

const headers = {
  'X-Parse-Application-Id': APP_ID,
  'X-Parse-REST-API-Key': REST_KEY,
  'Content-Type': 'application/json'
};

// Utility function for API calls
async function parseRequest(url, method = 'GET', body = null) {
  const options = {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) })
  };

  try {
    const response = await fetch(`${API_BASE}${url}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${data.error || JSON.stringify(data)}`);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

// Test Suite
async function runTests() {
  console.log('🚀 Starting Marketplace Workflow Tests\n');
  console.log(`App ID: ${APP_ID}\n`);

  let testUser = null;
  let testVendor = null;
  let testProduct = null;
  let testOrder = null;

  try {
    // ============ Test 1: Register User ============
    console.log('📝 Test 1: Register User');
    const testEmail = `user-${Date.now()}@test.com`;
    const registerResult = await parseRequest('/parse/classes/_User', 'POST', {
      username: testEmail.split('@')[0],
      email: testEmail,
      password: 'test123456',
      name: 'Test User',
      role: 'user'
    });

    testUser = {
      objectId: registerResult.objectId,
      email: testEmail,
      password: 'test123456'
    };

    console.log(`✅ User created: ${testUser.objectId}\n`);

    // ============ Test 2: Login User ============
    console.log('🔐 Test 2: Login User');
    const loginResult = await parseRequest('/parse/login', 'POST', {
      username: testEmail.split('@')[0],
      password: 'test123456'
    });

    testUser.sessionToken = loginResult.sessionToken;
    console.log(`✅ Login successful, sessionToken: ${loginResult.sessionToken.substring(0, 20)}...\n`);

    // ============ Test 3: Register as Vendor ============
    console.log('🏪 Test 3: Register as Vendor');
    const vendorEmail = `vendor-${Date.now()}@test.com`;
    const vendorResult = await parseRequest('/parse/classes/_User', 'POST', {
      username: vendorEmail.split('@')[0],
      email: vendorEmail,
      password: 'test123456',
      name: 'Test Vendor',
      role: 'vendor'
    });

    testVendor = {
      objectId: vendorResult.objectId,
      email: vendorEmail
    };

    console.log(`✅ Vendor user created: ${testVendor.objectId}\n`);

    // ============ Test 4: Create Product ============
    console.log('📦 Test 4: Create Product');
    const productResult = await parseRequest('/parse/classes/Product', 'POST', {
      title: 'Test Product',
      description: 'This is a test product for workflow validation',
      price: 9999,
      category: 'Electronics',
      vendorId: testVendor.objectId,
      vendorName: 'Test Vendor',
      image: 'https://via.placeholder.com/300',
      tags: ['test', 'electronics'],
      stock: 100,
      status: 'active'
    });

    testProduct = {
      objectId: productResult.objectId,
      title: productResult.title,
      price: productResult.price
    };

    console.log(`✅ Product created: ${testProduct.objectId}`);
    console.log(`   Title: ${testProduct.title}, Price: ${testProduct.price}₽\n`);

    // ============ Test 5: Get Products ============
    console.log('🔍 Test 5: Fetch All Products');
    const productsResult = await parseRequest(
      `/parse/classes/Product?limit=10&order=-createdAt`
    );

    console.log(`✅ Fetched ${productsResult.results.length} products`);
    console.log(`   Latest product: ${productsResult.results[0]?.title}\n`);

    // ============ Test 6: Get Product by ID ============
    console.log('🎯 Test 6: Get Product by ID');
    const productDetailResult = await parseRequest(
      `/parse/classes/Product/${testProduct.objectId}`
    );

    console.log(`✅ Product details retrieved`);
    console.log(`   Title: ${productDetailResult.title}`);
    console.log(`   Category: ${productDetailResult.category}`);
    console.log(`   Vendor: ${productDetailResult.vendorName}\n`);

    // ============ Test 7: Create Order ============
    console.log('🛒 Test 7: Create Order');
    const orderResult = await parseRequest('/parse/classes/Order', 'POST', {
      userId: testUser.objectId,
      customerName: 'Test Buyer',
      email: testUser.email,
      phone: '+7-999-888-7766',
      city: 'Сухум',
      address: 'ул. Тестовая, 123',
      comment: 'Please deliver quickly',
      items: [
        {
          productId: testProduct.objectId,
          title: testProduct.title,
          quantity: 2,
          price: testProduct.price
        }
      ],
      subtotal: testProduct.price * 2,
      deliveryPrice: 200,
      total: testProduct.price * 2 + 200,
      paymentMethod: 'cash',
      status: 'pending'
    });

    testOrder = {
      objectId: orderResult.objectId,
      total: orderResult.total,
      status: orderResult.status
    };

    console.log(`✅ Order created: ${testOrder.objectId}`);
    console.log(`   Total: ${testOrder.total}₽`);
    console.log(`   Status: ${testOrder.status}\n`);

    // ============ Test 8: Get Orders by User ============
    console.log('📋 Test 8: Get Orders by User');
    const userOrdersResult = await parseRequest(
      `/parse/classes/Order?where=${encodeURIComponent(JSON.stringify({ userId: testUser.objectId }))}`
    );

    console.log(`✅ Found ${userOrdersResult.results.length} order(s) for user`);
    if (userOrdersResult.results.length > 0) {
      const latestOrder = userOrdersResult.results[0];
      console.log(`   Latest order: ${latestOrder.objectId}`);
      console.log(`   Total: ${latestOrder.total}₽`);
      console.log(`   Items: ${latestOrder.items?.length || 0}\n`);
    }

    // ============ Test 9: Update Order Status ============
    console.log('📤 Test 9: Update Order Status');
    const updatedOrderResult = await parseRequest(
      `/parse/classes/Order/${testOrder.objectId}`,
      'PUT',
      { status: 'processing' }
    );

    console.log(`✅ Order status updated to: processing\n`);

    // ============ Test 10: Get Vendor Products ============
    console.log('👨‍💼 Test 10: Get Vendor Products');
    const vendorProductsResult = await parseRequest(
      `/parse/classes/Product?where=${encodeURIComponent(JSON.stringify({ vendorId: testVendor.objectId }))}`
    );

    console.log(`✅ Vendor has ${vendorProductsResult.results.length} product(s)\n`);

    // ============ Summary ============
    console.log('━'.repeat(50));
    console.log('✅ ALL TESTS PASSED!\n');
    console.log('📊 Summary:');
    console.log(`  • User registered: ${testUser.objectId}`);
    console.log(`  • Vendor registered: ${testVendor.objectId}`);
    console.log(`  • Product created: ${testProduct.objectId}`);
    console.log(`  • Order created: ${testOrder.objectId}`);
    console.log(`  • Order total: ${testOrder.total}₽`);
    console.log('\n✨ Marketplace workflow is fully operational!\n');

  } catch (error) {
    console.error('\n❌ Test Failed!');
    console.error(`Error: ${error.message}\n`);
    process.exit(1);
  }
}

runTests();
