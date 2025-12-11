
import Parse from 'parse/node.js';
import dotenv from 'dotenv';
import axios from 'axios';

const result = dotenv.config({ path: './server/.env' });

const APP_ID = (process.env.PARSE_APP_ID || '').trim();
const MASTER_KEY = (process.env.PARSE_MASTER_KEY || '').trim();
const API_URL = 'http://localhost:4005/api';

if (!APP_ID || !MASTER_KEY) {
    console.error('Missing keys in server/.env');
    process.exit(1);
}

Parse.initialize(APP_ID, undefined, MASTER_KEY);
(Parse as any).serverURL = 'https://parseapi.back4app.com';

async function main() {
    console.log('💬 Starting Chat System Verification...');

    // 1. Create Test Users
    const buyer = new Parse.User();
    const buyerName = `chat_buyer_${Date.now()}`;
    buyer.set('username', buyerName);
    buyer.set('password', 'password');
    buyer.set('email', `${buyerName}@example.com`);
    await buyer.signUp(null, { useMasterKey: true });
    const buyerToken = buyer.getSessionToken();
    console.log(`✅ Created Buyer: ${buyerName}`);

    const seller = new Parse.User();
    const sellerName = `chat_seller_${Date.now()}`;
    seller.set('username', sellerName);
    seller.set('password', 'password');
    seller.set('email', `${sellerName}@example.com`);
    await seller.signUp(null, { useMasterKey: true });
    const sellerToken = seller.getSessionToken();
    console.log(`✅ Created Seller: ${sellerName}`);

    // 2. Create Conversation (Buyer initiates)
    let convId = '';
    try {
        const res = await axios.post(`${API_URL}/conversations`, {
            type: 'pre_sales',
            participants: [buyer.id, seller.id],
            context: { productId: 'some_prod_id' }
        }, { headers: { 'X-Parse-Session-Token': buyerToken } });

        convId = res.data.objectId;
        console.log(`✅ Created Conversation: ${convId}`);
    } catch (e: any) {
        console.error('❌ Create Conversation Failed:', e.response?.data || e.message);
        return;
    }

    // 3. Send Message (Buyer -> Seller)
    try {
        await axios.post(`${API_URL}/messages`, {
            conversationId: convId,
            text: 'Hello, is this available?'
        }, { headers: { 'X-Parse-Session-Token': buyerToken } });
        console.log('✅ Buyer sent message');
    } catch (e: any) {
        console.error('❌ Send Message Failed:', e.response?.data || e.message);
    }

    // 4. Send Reply (Seller -> Buyer)
    try {
        await axios.post(`${API_URL}/messages`, {
            conversationId: convId,
            text: 'Yes only for you my friend.'
        }, { headers: { 'X-Parse-Session-Token': sellerToken } });
        console.log('✅ Seller replied');
    } catch (e: any) {
        console.error('❌ Seller Reply Failed:', e.response?.data || e.message);
    }

    // 5. Get Messages (Buyer View)
    try {
        const res = await axios.get(`${API_URL}/conversations/${convId}/messages`, {
            headers: { 'X-Parse-Session-Token': buyerToken }
        });
        if (res.data.results && res.data.results.length === 2) {
            console.log(`✅ Fetched Messages: ${res.data.results.length} found (Expected 2)`);
        } else {
            console.error(`❌ Fetched Messages count mismatch: ${res.data.results?.length}`);
        }
    } catch (e: any) {
        console.error('❌ Get Messages Failed:', e.response?.data || e.message);
    }

    // 6. Get Inbox (Seller View)
    try {
        const res = await axios.get(`${API_URL}/conversations`, {
            headers: { 'X-Parse-Session-Token': sellerToken }
        });
        const found = res.data.results.find((c: any) => c.objectId === convId);
        if (found) {
            console.log('✅ Inbox Check: Conversation found in Seller Inbox');
        } else {
            console.error('❌ Inbox Check Failed: Conversation not found');
        }
    } catch (e: any) {
        console.error('❌ Get Inbox Failed:', e.response?.data || e.message);
    }

    // Cleanup
    await buyer.destroy({ useMasterKey: true });
    await seller.destroy({ useMasterKey: true });
    // Note: Conversation cleanup omitted for simplicity (or can add if needed)
    console.log('🧹 Cleanup complete.');
}

main();
