
const Parse = require('parse/node');

const appId = "XLiNP1wljZYgnjhgjy4RHrjvKx3OLKI6OCMwZQvA";
const masterKey = "D7WVMK4K1Nb39E18vmnfLVHD1cld5WxT6Fyu8635";

Parse.initialize(appId, undefined, masterKey);
Parse.serverURL = 'https://parseapi.back4app.com';

async function checkProducts() {
    try {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        const count = await query.count({ useMasterKey: true });
        console.log(`--- DATABASE_CHECK_START ---`);
        console.log(`Product count: ${count}`);
        console.log(`--- DATABASE_CHECK_END ---`);
    } catch (e) {
        console.error('Error checking products:', e.message);
    }
}

checkProducts();
