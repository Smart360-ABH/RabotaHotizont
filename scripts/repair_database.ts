
import * as readline from 'readline';
import Parse from 'parse/node.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (query: string): Promise<string> => {
    return new Promise(resolve => rl.question(query, resolve));
};

async function main() {
    console.log('\n🔧 Back4App Database Repair Tool 🔧');
    console.log('This script will fix permissions so Vendors can manage their products.');
    console.log('------------------------------------------------------------------\n');

    const appId = (await ask('Enter your Back4App App ID: ')).trim();
    const masterKey = (await ask('Enter your Back4App Master Key: ')).trim();
    const serverURL = 'https://parseapi.back4app.com';

    if (!appId || !masterKey) {
        console.error('❌ Keys are required!');
        process.exit(1);
    }

    console.log('\nConnecting to Back4App...');
    Parse.initialize(appId, undefined, masterKey);
    (Parse as any).serverURL = serverURL;

    // Verify connection
    try {
        console.log('   Verifying credentials...');
        await new Parse.Query(Parse.User).count({ useMasterKey: true });
        console.log('   ✅ Credentials accepted!');
    } catch (e: any) {
        console.error('   ❌ Authentication Failed! Please check your keys.');
        console.error('   Error:', e.message);
        process.exit(1);
    }

    try {
        // 1. Fix Class Level Permissions (CLP)
        console.log('\n[1/3] Updating Class Permissions (CLPs)...');
        await updateCLP('Product');
        await updateCLP('Order');
        await updateCLP('Vendor');

        // 2. Fix Object ACLs
        console.log('\n[2/3] Fixing Product ACLs...');
        await fixProductACLs();

        console.log('\n[3/3] Fixing Order ACLs...');
        await fixOrderACLs(); // Optional but good practice

        console.log('\n✅ REPAIR COMPLETE! You can now restart your server and test.');

    } catch (error: any) {
        console.error('\n❌ FATAL ERROR:', error.message || error);
    } finally {
        rl.close();
    }
}

async function updateCLP(className: string) {
    try {
        const schema = new Parse.Schema(className);
        const current = await schema.get();

        // Allow Public Read, Auth Write (Standard Model)
        // Or for Vendor Dashboard: Allow Public Read, but restricted Writes?
        // Actually, we want to ensure Owners can write.

        // We set CLP to be permissive for Authenticated users, 
        // relying on ACLs for object-level security.
        const clp = {
            get: { "*": true },
            find: { "*": true },
            create: { "*": true }, // Any logged in user can try to create (app logic restricts roles)
            update: { "*": true },
            delete: { "*": true },
            addField: { "*": true } // Simplify schema changes
        };

        await schema.setCLP(clp as any);
        await schema.update();
        console.log(`   ✅ ${className}: CLPs updated to Public Read / Public Write (ACLs will protect objects)`);
    } catch (e: any) {
        if (e.code === 103) {
            console.log(`   ⚠️ ${className}: Schema not found (will be created on first data save)`);
        } else {
            console.error(`   ❌ ${className} CLP Error:`, e.message);
        }
    }
}

async function fixProductACLs() {
    const Product = Parse.Object.extend('Product');
    const query = new Parse.Query(Product);
    query.limit(1000); // Process in batches if needed, start simple

    const products = await query.find({ useMasterKey: true });
    console.log(`   Found ${products.length} products to check.`);

    let valid = 0;
    let fixed = 0;

    for (const p of products) {
        const vendorId = p.get('vendorId');
        if (!vendorId) {
            console.warn(`   ⚠️ Product ${p.id} has no vendorId! Skipping.`);
            continue;
        }

        const acl = p.getACL();
        // Check if ACL specifically gives write access to vendorId
        // Back4App ACLs map userId -> { read: true, write: true }

        // We will FORCE overwrite the ACL to ensure it's correct
        const newACL = new Parse.ACL();
        newACL.setPublicReadAccess(true);
        newACL.setWriteAccess(vendorId, true);
        newACL.setReadAccess(vendorId, true); // Vendor can always read their own

        // If it was created manually via dashboard, it might have Master Key only.

        p.setACL(newACL);
        try {
            await p.save(null, { useMasterKey: true });
            fixed++;
        } catch (e: any) {
            console.error(`   ❌ Failed to update Product ${p.id}:`, e.message);
        }
    }
    console.log(`   Results: ${fixed} ACLs updated.`);
}

async function fixOrderACLs() {
    // Similar logic for Orders if needed
    // Orders should be readable by Vendor AND Customer
    const Order = Parse.Object.extend('Order');
    const query = new Parse.Query(Order);
    query.limit(1000);
    const orders = await query.find({ useMasterKey: true });

    let fixed = 0;
    for (const o of orders) {
        const vendorId = o.get('vendorId');
        const userId = o.get('userId'); // Customer

        if (vendorId || userId) {
            const newACL = new Parse.ACL();
            if (vendorId) {
                newACL.setReadAccess(vendorId, true);
                newACL.setWriteAccess(vendorId, true);
            }
            if (userId) {
                newACL.setReadAccess(userId, true);
                // Customers usually shouldn't delete orders directly, but maybe update?
                // Let's keep it simple: Read only for customer, Write for System/Vendor
                newACL.setWriteAccess(userId, false);
            }

            o.setACL(newACL);
            await o.save(null, { useMasterKey: true });
            fixed++;
        }
    }
    console.log(`   Fixed ${fixed} Order ACLs.`);
}

main();
