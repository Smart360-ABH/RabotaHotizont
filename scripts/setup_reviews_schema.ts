
import Parse from 'parse/node.js';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
};

async function main() {
    console.log('--- Reviews System Schema Setup ---');
    console.log('This script will create the Review class and add rating fields to Product.');

    const appId = await askQuestion('Enter Back4App App ID: ');
    const masterKey = await askQuestion('Enter Back4App Master Key: ');

    Parse.initialize(appId.trim(), undefined, masterKey.trim());
    (Parse as any).serverURL = 'https://parseapi.back4app.com';

    try {
        console.log('Verifying connection...'); // Check if keys work
        const config = await Parse.Config.get({ useMasterKey: true });
        console.log('Connection successful!');

        // 1. Define Review Class Schema
        console.log('Creating/Updating Review Schema...');
        const schema = new Parse.Schema('Review');

        // Fields
        schema.addPointer('user', '_User');
        schema.addPointer('product', 'Product');
        schema.addPointer('order', 'Order'); // Optional: Link to specific order
        schema.addNumber('rating'); // 1-5
        schema.addString('text');
        schema.addArray('images'); // Array of file URLs or objects
        schema.addString('status'); // 'pending', 'approved', 'rejected'
        schema.addNumber('helpfulness');

        // CLPs (Class Level Permissions)
        const clp = {
            get: { '*': true }, // Public read
            find: { '*': true }, // Public read
            create: { 'requiresAuthentication': true }, // Only auth users
            update: { 'requiresAuthentication': true }, // (Ideally only owner, handled by ACLs)
            delete: { 'requiresAuthentication': true },
            addField: {} // Lock schema
        };
        schema.setCLP(clp);

        await schema.update();
        console.log('Review class configured.');

        // 2. Update Product Class Schema
        console.log('Updating Product Schema with Rating fields...');
        const productSchema = new Parse.Schema('Product');
        productSchema.addNumber('averageRating');
        productSchema.addNumber('reviewsCount');
        await productSchema.update();
        console.log('Product class updated.');

        console.log('✅ Schema setup complete.');

    } catch (error: any) {
        console.error('❌ Error during setup:', error.message || error);
    } finally {
        rl.close();
    }
}

main();
