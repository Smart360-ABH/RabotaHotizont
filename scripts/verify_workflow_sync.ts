
import Parse from 'parse/node.js';
import dotenv from 'dotenv';
import axios from 'axios';

const result = dotenv.config({ path: './server/.env' });
console.log('Dotenv Load Error:', result.error);

const APP_ID = (process.env.PARSE_APP_ID || '').trim();
const MASTER_KEY = (process.env.PARSE_MASTER_KEY || '').trim();
console.log('APP_ID:', APP_ID);
console.log('MASTER_KEY:', MASTER_KEY ? MASTER_KEY.substring(0, 5) + '...' : 'UNDEFINED');

const API_URL = 'http://localhost:4000/api';

if (!APP_ID || !MASTER_KEY) {
    console.error('Missing keys in server/.env');
    process.exit(1);
}

Parse.initialize(APP_ID, undefined, MASTER_KEY);
(Parse as any).serverURL = 'https://parseapi.back4app.com';

async function main() {
    console.log('🧪 Starting Workflow Sync Verification...');

    // 1. Create Test User (Buyer)
    const user = new Parse.User();
    const username = `test_buyer_${Date.now()}`;
    user.set('username', username);
    user.set('password', 'password');
    user.set('email', `${username}@example.com`);
    await user.signUp(null, { useMasterKey: true });
    const sessionToken = user.getSessionToken();
    console.log(`✅ Created Buyer: ${username}`);

    // 2. Create Test Vendor
    const vendorUser = new Parse.User();
    const vendorName = `test_vendor_${Date.now()}`;
    vendorUser.set('username', vendorName);
    vendorUser.set('password', 'password');
    vendorUser.set('email', `${vendorName}@example.com`);
    await vendorUser.signUp(null, { useMasterKey: true });
    const vendorSession = vendorUser.getSessionToken();
    console.log(`✅ Created Vendor: ${vendorName}`);

    // 3. Create Product
    const Product = Parse.Object.extend('Product');
    const product = new Product();
    product.set('title', 'Test Product');
    product.set('price', 100);
    product.set('vendorId', vendorUser.id);
    await product.save(null, { useMasterKey: true });
    console.log('✅ Created Product');

    // 4. Create Order
    const Order = Parse.Object.extend('Order');
    const order = new Order();
    order.set('userId', user.id);
    order.set('vendorId', vendorUser.id);
    order.set('items', [{ productId: product.id, quantity: 1 }]);
    order.set('total', 100);
    order.set('status', 'new');
    await order.save(null, { useMasterKey: true });
    console.log(`✅ Created Order: ${order.id}`);

    // 5. Test Status Update (Should Succeed)
    try {
        await axios.put(`${API_URL}/orders/${order.id}/status`, {
            status: 'processing',
            note: 'Vendor started processing'
        }, { headers: { 'X-Parse-Session-Token': vendorSession } }); // Vendor updates
        console.log('✅ Status Update 1 (New -> Processing): Success');
    } catch (e: any) {
        console.error('❌ Status Update 1 Failed:', e.response?.data || e.message);
    }

    // 6. Create Dispute (Buyer)
    try {
        await axios.post(`${API_URL}/disputes`, {
            orderId: order.id,
            reason: 'not_received',
            description: 'Where is my stuff?',
            amountRequested: 100
        }, { headers: { 'X-Parse-Session-Token': sessionToken } });
        console.log('✅ Created Dispute: Success');
    } catch (e: any) {
        console.error('❌ Create Dispute Failed:', e.response?.data || e.message);
    }

    // 7. Test Status Update (Should FAIL - Locked)
    try {
        await axios.put(`${API_URL}/orders/${order.id}/status`, {
            status: 'shipped',
            note: 'Trying to ship despite dispute'
        }, { headers: { 'X-Parse-Session-Token': vendorSession } });
        console.error('❌ Status Update 2 (Locked) PASSED unexpectedly!');
    } catch (e: any) {
        if (e.response?.status === 409) {
            console.log('✅ Status Update 2 (Locked): Blocked correctly (409 Conflict)');
        } else {
            console.error('❌ Status Update 2 unexpected error:', e.response?.data || e.message);
        }
    }

    // Cleanup
    await order.destroy({ useMasterKey: true });
    await product.destroy({ useMasterKey: true });
    await user.destroy({ useMasterKey: true });
    await vendorUser.destroy({ useMasterKey: true });
    console.log('🧹 Cleanup complete.');
}

main();
