import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const APP_ID = process.env.PARSE_APP_ID;
const MASTER_KEY = process.env.PARSE_MASTER_KEY;

async function debugVendorMismatch() {
    console.log('=== Debugging Vendor ID Mismatch ===\n');

    try {
        // 1. Get all products
        console.log('1. Fetching products...');
        const productsRes = await axios.get(`https://parseapi.back4app.com/classes/Product?limit=5`, {
            headers: {
                'X-Parse-Application-Id': APP_ID,
                'X-Parse-Master-Key': MASTER_KEY
            }
        });

        const products = productsRes.data.results;
        console.log(`   Found ${products.length} products`);

        if (products.length > 0) {
            const sampleProduct = products[0];
            console.log(`   Sample product: "${sampleProduct.title}"`);
            console.log(`   - vendorId: ${sampleProduct.vendorId}`);
            console.log(`   - vendorId type: ${typeof sampleProduct.vendorId}`);
        }

        // 2. Get all users with role='vendor'
        console.log('\n2. Fetching vendor users...');
        const vendorsRes = await axios.get(`https://parseapi.back4app.com/classes/_User?where=${encodeURIComponent(JSON.stringify({ role: 'vendor' }))}&limit=10`, {
            headers: {
                'X-Parse-Application-Id': APP_ID,
                'X-Parse-Master-Key': MASTER_KEY
            }
        });

        const vendors = vendorsRes.data.results;
        console.log(`   Found ${vendors.length} vendor users`);

        if (vendors.length > 0) {
            vendors.forEach((v, i) => {
                console.log(`   Vendor ${i + 1}:`);
                console.log(`   - objectId: ${v.objectId}`);
                console.log(`   - username: ${v.username}`);
                console.log(`   - companyName: ${v.companyName || 'N/A'}`);
            });
        }

        // 3. Check for mismatches
        console.log('\n3. Checking for ID mismatches...');
        const productVendorIds = new Set(products.map(p => p.vendorId).filter(Boolean));
        const vendorObjectIds = new Set(vendors.map(v => v.objectId));

        console.log(`   Product vendorIds: ${Array.from(productVendorIds).join(', ')}`);
        console.log(`   Vendor objectIds: ${Array.from(vendorObjectIds).join(', ')}`);

        const mismatches = Array.from(productVendorIds).filter(id => !vendorObjectIds.has(id));
        if (mismatches.length > 0) {
            console.log(`   ⚠️  MISMATCH FOUND: ${mismatches.length} vendorIds don't match any vendor objectId`);
            console.log(`   Missing vendors: ${mismatches.join(', ')}`);
        } else {
            console.log(`   ✅ All product vendorIds match vendor objectIds`);
        }

    } catch (error: any) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

debugVendorMismatch();
