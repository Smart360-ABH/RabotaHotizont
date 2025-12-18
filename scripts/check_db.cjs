
const Parse = require('parse/node');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });
const appId = process.env.VITE_PARSE_APP_ID;
const jsKey = process.env.VITE_PARSE_JS_KEY;

if (!appId) {
    console.error('Missing VITE_PARSE_APP_ID in .env');
    process.exit(1);
}

Parse.initialize(appId, jsKey);
Parse.serverURL = 'https://parseapi.back4app.com';

async function checkProducts() {
    try {
        const Product = Parse.Object.extend('Product');
        const query = new Parse.Query(Product);
        const count = await query.count();
        console.log(`--- DATABASE_CHECK_START ---`);
        console.log(`Product count: ${count}`);
        console.log(`--- DATABASE_CHECK_END ---`);
    } catch (e) {
        console.error('Error checking products:', e.message);
    }
}

checkProducts();
