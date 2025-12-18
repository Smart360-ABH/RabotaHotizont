
const Parse = require('parse/node');

const appId = "XLiNP1wljZYgnjhgjy4RHrjvKx3OLKI6OCMwZQvA";
const masterKey = "D7WVMK4K1Nb39E18vmnfLVHD1cld5WxT6Fyu8635";

Parse.initialize(appId, undefined, masterKey);
Parse.serverURL = 'https://parseapi.back4app.com';

async function listProducts() {
    try {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        const results = await query.find({ useMasterKey: true });
        console.log(`--- PRODUCT_LIST_START ---`);
        results.forEach(p => {
            console.log(`- [${p.id}] ${p.get('title')} (Vendor: ${p.get('vendorId')})`);
        });
        console.log(`--- PRODUCT_LIST_END ---`);
    } catch (e) {
        console.error('Error listing products:', e.message);
    }
}

listProducts();
