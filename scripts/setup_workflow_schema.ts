
import Parse from 'parse/node.js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

console.log('DOTENV loaded.');
const APP_ID = (process.env.PARSE_APP_ID || 'kvW3HkS0F35JjX5Bf8L7uZ3gQ9c1V4N6mT2yR8x').trim();
const MASTER_KEY = process.env.PARSE_MASTER_KEY ? process.env.PARSE_MASTER_KEY.trim() : undefined;

console.log('App ID:', APP_ID);
console.log('Master Key (first 5):', MASTER_KEY ? MASTER_KEY.substring(0, 5) : 'UNDEFINED');
console.log('Master Key length:', MASTER_KEY ? MASTER_KEY.length : 0);

if (!MASTER_KEY) {
    console.error('Error: PARSE_MASTER_KEY is missing in server/.env');
    process.exit(1);
}

Parse.initialize(APP_ID, undefined, MASTER_KEY);
(Parse as any).serverURL = 'https://parseapi.back4app.com';

async function setupSchema() {
    console.log('🔄 Setting up Workflow & Dispute Schema...');

    try {
        const schema = new Parse.Schema('Dispute');
        console.log('Defining Dispute class...');
        schema.addPointer('order', 'Order');
        schema.addPointer('product', 'Product');
        schema.addPointer('initiator', '_User');
        schema.addPointer('respondent', 'Vendor');
        schema.addString('reason');
        schema.addString('description');
        schema.addNumber('amountRequested');
        schema.addString('status'); // opened, negotiating, escalated, resolved_refund, resolved_dismissed, cancelled
        schema.addArray('messages'); // Lightweight array for message snapshots or internal logs
        schema.addArray('evidence'); // Array of file URLs

        // Security
        const clp = {
            get: { requiresAuthentication: true },
            find: { requiresAuthentication: true },
            create: { requiresAuthentication: true },
            update: { requiresAuthentication: true },
            delete: { requiresAuthentication: true }, // Admin only usually, but allowed for dev
        };
        schema.setCLP(clp);
        await schema.save();
        console.log('✅ Dispute class created/updated.');

        console.log('Defining Conversation class...');
        const convSchema = new Parse.Schema('Conversation');
        convSchema.addArray('participants'); // Array of User Pointers (IDs)
        convSchema.addString('type'); // 'pre_sales', 'order_support', 'dispute'
        convSchema.addObject('context'); // { orderId, disputeId, productId }
        convSchema.addDate('lastMessageAt');
        convSchema.setCLP({
            get: { requiresAuthentication: true },
            find: { requiresAuthentication: true },
            create: { requiresAuthentication: true },
            update: { requiresAuthentication: true },
            delete: { requiresAuthentication: true },
        });
        await convSchema.save();
        console.log('✅ Conversation class created/updated.');

        console.log('Defining Message class...');
        const msgSchema = new Parse.Schema('Message');
        msgSchema.addPointer('conversation', 'Conversation');
        msgSchema.addPointer('sender', '_User');
        msgSchema.addString('text');
        msgSchema.addArray('attachments');
        msgSchema.addArray('readBy'); // Array of User IDs
        msgSchema.setCLP({
            get: { requiresAuthentication: true },
            find: { requiresAuthentication: true },
            create: { requiresAuthentication: true },
            update: { requiresAuthentication: true },
            delete: { requiresAuthentication: true },
        });
        await msgSchema.save();
        console.log('✅ Message class created/updated.');

        console.log('Updating Order class (Timeline)...');
        const orderSchema = new Parse.Schema('Order');
        orderSchema.addArray('timeline'); // [{status, actorId, date, note}]
        await orderSchema.update();
        console.log('✅ Order class updated.');

        console.log('Updating Review class (Vendor Reply)...');
        const reviewSchema = new Parse.Schema('Review');
        reviewSchema.addString('vendorReply');
        reviewSchema.addDate('vendorReplyAt');
        reviewSchema.addBoolean('isReported');
        await reviewSchema.update();
        console.log('✅ Review class updated.');

    } catch (error: any) {
        if (error.code === 103) {
            console.log('⚠️ Class already exists, proceeding...');
        } else {
            console.error('❌ Error setting up schema:', error);
        }
    }
}

setupSchema();
