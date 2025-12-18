
import Parse from 'parse/node.js';
import { MOCK_VENDORS, MOCK_PRODUCTS } from '../constants';

const appId = "XLiNP1wljZYgnjhgjy4RHrjvKx3OLKI6OCMwZQvA";
const masterKey = "D7WVMK4K1Nb39E18vmnfLVHD1cld5WxT6Fyu8635";

Parse.initialize(appId, undefined, masterKey);
(Parse as any).serverURL = 'https://parseapi.back4app.com';

async function syncData() {
    console.log('🚀 Starting Data Synchronization to Back4App...');

    try {
        const vendorMap: Record<string, string> = {};

        // 1. Sync Vendors
        console.log('\n--- Syncing Vendors ---');
        for (const mv of MOCK_VENDORS) {
            const Vendor = Parse.Object.extend('Vendor');
            const query = new Parse.Query(Vendor);
            query.equalTo('name', mv.name);
            let vendorObj = await query.first({ useMasterKey: true });

            if (!vendorObj) {
                vendorObj = new Vendor();
                console.log(`Creating Vendor: ${mv.name}`);
            } else {
                console.log(`Updating Vendor: ${mv.name}`);
            }

            vendorObj.set('name', mv.name);
            vendorObj.set('description', mv.description);
            vendorObj.set('image', mv.image);
            vendorObj.set('coverImage', mv.coverImage);
            vendorObj.set('rating', mv.rating);
            vendorObj.set('status', mv.status);
            // We map the MOCK id to the REAL objectId for internal reference
            vendorObj.set('mockId', mv.id);

            const savedVendor = await vendorObj.save(null, { useMasterKey: true });
            vendorMap[mv.id] = savedVendor.id;
        }

        // 2. Sync Products
        console.log('\n--- Syncing Products ---');
        for (const mp of MOCK_PRODUCTS) {
            const Product = Parse.Object.extend('Product');
            const query = new Parse.Query(Product);
            query.equalTo('title', mp.title);
            let productObj = await query.first({ useMasterKey: true });

            if (!productObj) {
                productObj = new Product();
                console.log(`Creating Product: ${mp.title}`);
            } else {
                console.log(`Updating Product: ${mp.title}`);
            }

            productObj.set('title', mp.title);
            productObj.set('author', mp.author);
            productObj.set('price', mp.price);
            productObj.set('oldPrice', mp.oldPrice);
            productObj.set('category', mp.category);
            productObj.set('image', mp.image);
            productObj.set('description', mp.description);
            productObj.set('tags', mp.tags);
            productObj.set('isNew', mp.isNew);
            productObj.set('inStock', mp.inStock);

            // Map the vendorId from mock to real
            const realVendorId = vendorMap[mp.vendorId] || mp.vendorId;
            productObj.set('vendorId', realVendorId);

            productObj.set('rating', mp.rating);
            productObj.set('reviewsCount', mp.reviewsCount);

            await productObj.save(null, { useMasterKey: true });
        }

        console.log('\n✅ Data Synchronization Complete!');
    } catch (error: any) {
        console.error('\n❌ Sync Error:', error.message);
    }
}

syncData();
