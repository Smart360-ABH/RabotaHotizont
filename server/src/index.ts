import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import qs from 'qs';
import { parseRequest } from './parseClient';

dotenv.config();

const app = express();

// --- PRODUCTION HARDENING: CORS ---
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5173'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
// ... (rest of imports/setup)

// ... (after PUT /api/orders/:id/status code)

// Disputes
app.post('/api/disputes', async (req, res) => {
    const sessionToken = req.header('X-Parse-Session-Token');
    if (!sessionToken) return res.status(401).json({ error: 'Missing session token' });

    try {
        const { orderId, reason, description, amountRequested, evidence } = req.body;
        if (!orderId || !reason) return res.status(400).json({ error: 'Order ID and Reason are required' });

        // 1. Verify User
        const user = await parseRequest('/users/me', 'GET', null, sessionToken);
        if (!user || !user.objectId) return res.status(401).json({ error: 'Invalid session' });

        // 2. Fetch Order
        const order = await parseRequest(`/classes/Order/${orderId}`, 'GET', null, null, true);
        if (!order || order.error) return res.status(404).json({ error: 'Order not found' });

        // 3. Verify Ownership (Must be Buyer)
        // Check both pointer and string cases for userId
        const orderUserId = typeof order.userId === 'string' ? order.userId : order.userId?.objectId;
        // Also handling legacy 'user' field if exists, but strictly relying on userId as per OrderDetails type usually
        // Let's assume userId is the field for the Buyer User Pointer

        // Note: Check against both user check and user pointer
        // const isBuyer = orderUserId === user.objectId || (order.user && order.user.objectId === user.objectId);

        // Let's rely on stored userId in Order if available
        if (order.userId !== user.objectId) {
            return res.status(403).json({ error: 'You can only dispute your own orders' });
        }

        // 4. Check for existing active dispute
        const existingQuery = qs.stringify({
            where: JSON.stringify({
                order: { __type: 'Pointer', className: 'Order', objectId: orderId },
                status: { $in: ['opened', 'negotiating', 'escalated'] }
            })
        });
        const existing = await parseRequest(`/classes/Dispute?${existingQuery}`, 'GET', null, null, true);
        if (existing.results && existing.results.length > 0) {
            return res.status(409).json({ error: 'An active dispute already exists for this order' });
        }

        // 5. Create Dispute
        const disputePayload = {
            order: { __type: 'Pointer', className: 'Order', objectId: orderId },
            product: order.items && order.items.length === 1 ? { __type: 'Pointer', className: 'Product', objectId: order.items[0].productId } : undefined, // Optional: link to single product if simple order
            initiator: { __type: 'Pointer', className: '_User', objectId: user.objectId },
            respondent: { __type: 'Pointer', className: 'Vendor', objectId: order.vendorId }, // Critical: Link to Vendor
            reason,
            description,
            amountRequested: Number(amountRequested) || 0,
            status: 'opened',
            evidence: evidence || [], // Array of URLs
            messages: []
        };

        const createdDispute = await parseRequest('/classes/Dispute', 'POST', disputePayload, null, true);

        // 6. Notify Vendor (TODO: Email/Push)
        // console.log(`[Notification] Dispute ${createdDispute.objectId} created for Order ${orderId}`);

        res.json(createdDispute);

    } catch (error: any) {
        console.error('Create dispute error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 4000;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'changeme';

// Allow requests from frontend
// Middleware moved to top

// Middleware to check Admin Secret
const requireAdminSecret = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const secret = req.header('X-Admin-Secret');
    if (secret !== ADMIN_SECRET) {
        return res.status(403).json({ error: 'Unauthorized: Invalid Admin Secret' });
    }
    next();
};

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', server: 'gorizont-backend' });
});

// --- Proxied Endpoints ---

// Reviews
app.post('/api/reviews', async (req, res) => {
    const sessionToken = req.header('X-Parse-Session-Token');
    if (!sessionToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { product, order, rating, text } = req.body;

        if (!product || !order || !rating) {
            return res.status(400).json({ error: 'Missing required fields: product, order, rating' });
        }

        // 1. Verify User
        const user = await parseRequest('/users/me', 'GET', null, sessionToken);
        if (!user || !user.objectId) return res.status(401).json({ error: 'Invalid session' });

        // 2. Verify Order Logic (Security)
        // Fetch order to check ownership and status
        const orderData = await parseRequest(`/classes/Order/${order}`, 'GET', null, null, true); // Use Master Key to safely inspect

        if (!orderData || orderData.error) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check ownership
        // Note: orderData.user might be a pointer or string depending on fetch depth. Assuming pointer/objectId logic.
        const orderUserId = typeof orderData.user === 'string' ? orderData.user : orderData.user?.objectId;
        if (orderUserId !== user.objectId) {
            return res.status(403).json({ error: 'You did not make this order' });
        }

        // Check status
        if (orderData.status !== 'completed' && orderData.status !== 'delivered') {
            return res.status(400).json({ error: 'Order must be completed to leave a review' });
        }

        // Check if product is in order items (assuming items is an array of objects/pointers)
        // Adjust logic based on actual Order schema. Assuming items store productId or similar.
        const hasProduct = orderData.items && orderData.items.some((item: any) => item.objectId === product || item.productId === product);
        if (!hasProduct) {
            // Fallback: If items structure is different, we might need to be laxer or stricter. 
            // For strictness: return res.status(400).json({ error: 'Product not found in this order' });
            console.warn(`Review verification warning: Product ${product} not explicitly found in Order ${order} items. Proceeding with user check only.`);
        }

        // 3. Create Review
        const reviewPayload = {
            text,
            rating: Number(rating),
            user: { __type: 'Pointer', className: '_User', objectId: user.objectId },
            product: { __type: 'Pointer', className: 'Product', objectId: product },
            order: { __type: 'Pointer', className: 'Order', objectId: order },
            status: 'approved' // Auto-approve for now
        };

        const result = await parseRequest('/classes/Review', 'POST', reviewPayload, null, true); // Master Key creation to enforce schema/CLPs if needed

        // 4. Update Product Rating (Async - Fire and forget or await)
        // Calculate new average... (ToDo: Implement recalculation logic)

        res.json(result);

    } catch (error: any) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reviews', async (req, res) => {
    try {
        const query = req.query.where ? `?where=${req.query.where}` : '';
        const limit = req.query.limit ? `&limit=${req.query.limit}` : '';
        const order = req.query.order ? `&order=${req.query.order}` : '&order=-createdAt';

        const result = await parseRequest(`/classes/Review${query}${limit}${order}`, 'GET');
        res.json(result);
    } catch (error: any) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/reviews/:id', requireAdminSecret, async (req, res) => {
    try {
        const result = await parseRequest(`/classes/Review/${req.params.id}`, 'PUT', req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/reviews/:id', requireAdminSecret, async (req, res) => {
    try {
        const result = await parseRequest(`/classes/Review/${req.params.id}`, 'DELETE');
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Appeals (Protected)
app.post('/api/appeals', async (req, res) => {
    try {
        const result = await parseRequest('/classes/Appeal', 'POST', req.body, req.header('X-Parse-Session-Token'));
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/appeals', requireAdminSecret, async (req, res) => {
    try {
        const query = req.query.where ? `?where=${req.query.where}` : '';
        const result = await parseRequest(`/classes/Appeal${query}`, 'GET');
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/appeals/:id', requireAdminSecret, async (req, res) => {
    try {
        const result = await parseRequest(`/classes/Appeal/${req.params.id}`, 'PUT', req.body);
        res.json(result);
    } catch (error: any) {
    }
});

// Products (Protected Deletion via Master Key)
app.delete('/api/products/:id', async (req, res) => {
    const sessionToken = req.header('X-Parse-Session-Token');
    if (!sessionToken) {
        return res.status(401).json({ error: 'Missing session token' });
    }

    try {
        // 1. Verify User
        const user = await parseRequest('/users/me', 'GET', null, sessionToken);
        if (!user || !user.objectId) {
            return res.status(401).json({ error: 'Invalid session' });
        }

        // 2. Fetch Product (Master Key to bypass ACL)
        const product = await parseRequest(`/classes/Product/${req.params.id}`, 'GET', null, null, true);
        if (!product || product.error) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // 3. Verify Ownership
        if (product.vendorId !== user.objectId) {
            console.warn(`Unauthorized delete attempt: User ${user.objectId} tried to delete Product ${product.objectId} (Owner: ${product.vendorId})`);
            return res.status(403).json({ error: 'You do not own this product' });
        }

        // 4. Delete (Master Key)
        await parseRequest(`/classes/Product/${req.params.id}`, 'DELETE', null, null, true);
        res.json({ success: true });

    } catch (error: any) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

// Orders - Status Management (Workflow Sync)
app.put('/api/orders/:id/status', async (req, res) => {
    const sessionToken = req.header('X-Parse-Session-Token');
    if (!sessionToken) return res.status(401).json({ error: 'Missing session token' });

    try {
        const { status, note } = req.body;
        if (!status) return res.status(400).json({ error: 'Status is required' });

        // 1. Verify User
        const user = await parseRequest('/users/me', 'GET', null, sessionToken);
        if (!user || !user.objectId) return res.status(401).json({ error: 'Invalid session' });

        // 2. Fetch Order (Master Key)
        const orderId = req.params.id;
        const order = await parseRequest(`/classes/Order/${orderId}`, 'GET', null, null, true);
        if (!order || order.error) return res.status(404).json({ error: 'Order not found' });

        // 3. Vendor Authorization
        // Only the assigned Vendor (or Admin) can change status forward
        // For now preventing random people, assuming vendorId is a string pointer
        if (order.vendorId && order.vendorId !== user.objectId && user.role !== 'admin') {
            // Note: 'role' check is simplified here, ideally check Role class
            // For MVP assuming strict Vendor ownership
            return res.status(403).json({ error: 'Only the vendor can update order status' });
        }

        // 4. Workflow Check: LOCKING
        // Check for active disputes
        const disputeQuery = qs.stringify({
            where: JSON.stringify({
                order: { __type: 'Pointer', className: 'Order', objectId: orderId },
                status: { $in: ['opened', 'negotiating', 'escalated'] }
            })
        });
        const activeDisputes = await parseRequest(`/classes/Dispute?${disputeQuery}`, 'GET', null, null, true);

        if (activeDisputes && activeDisputes.results && activeDisputes.results.length > 0) {
            return res.status(409).json({ error: 'Order is locked due to an active dispute.' });
        }

        // Check for Cancellation Request (if Buyer requested cancel, Vendor cannot ship)
        if (order.status === 'cancellation_requested' && status === 'shipped') {
            return res.status(409).json({ error: 'Buyer requested cancellation. Resolve request first.' });
        }

        // 5. Update Status & Timeline
        const timelineEntry = {
            status,
            actorId: user.objectId,
            actorName: user.name || 'Vendor',
            date: new Date().toISOString(),
            note: note || ''
        };

        const updatePayload = {
            status,
            timeline: { __op: 'Add', objects: [timelineEntry] }
        };

        const result = await parseRequest(`/classes/Order/${orderId}`, 'PUT', updatePayload, null, true);
        res.json(result);

    } catch (error: any) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- Communication System (Unified Chat) ---

// Create or Get Conversation
app.post('/api/conversations', async (req, res) => {
    const sessionToken = req.header('X-Parse-Session-Token');
    if (!sessionToken) return res.status(401).json({ error: 'Missing session token' });

    try {
        const { type, participants, context } = req.body;

        if (!type || !participants || !Array.isArray(participants)) {
            return res.status(400).json({ error: 'Type and participants array required' });
        }

        // 1. Verify Requestor
        let user: any;
        const IS_PROD = process.env.NODE_ENV === 'production';

        if (!IS_PROD && sessionToken.startsWith('mock_session_token_vendor')) {
            user = { objectId: 'qoK5mTF2Lo', username: 'v_tech_vendor' };
        } else if (!IS_PROD && sessionToken.startsWith('mock_session_token')) {
            user = { objectId: 'RvDjRB413H', username: 'john_doe' };
        } else {
            user = await parseRequest('/users/me', 'GET', null, sessionToken);
        }

        if (!user || !user.objectId) return res.status(401).json({ error: 'Invalid session' });

        // Ensure current user is in participants
        if (!participants.includes(user.objectId)) {
            return res.status(403).json({ error: 'You must be a participant' });
        }

        // 2. Check for existing conversation (Deduplication)
        // Find by participants first, then filter by context in memory to avoid REST API object query issues
        const existingQueryObj = {
            type,
            participants: { $all: participants.map(id => ({ __type: 'Pointer', className: '_User', objectId: id })) }
        };

        const existingQuery = `where=${encodeURIComponent(JSON.stringify(existingQueryObj))}`;
        const existing = await parseRequest(`/classes/Conversation?${existingQuery}`, 'GET', null, null, true);

        let match = null;
        if (existing.results && existing.results.length > 0) {
            if (context) {
                // strict deep equal check for context (simplified as string comparison for MVP)
                // Note: deeply nested objects might order keys differently, but for simple {productId: '...'} it works
                match = existing.results.find((c: any) => JSON.stringify(c.context) === JSON.stringify(context));
            } else {
                // If no context requested, return any matching conversation? 
                // Or maybe deduplication implies Empty Context?
                // Let's assume if no context requested, we return the first generic one? 
                // Or only if context is ALSO empty/undefined in DB?
                match = existing.results.find((c: any) => !c.context || Object.keys(c.context).length === 0);
            }
        }

        if (match) {
            return res.json(match);
        }

        // 3. Create New Conversation
        const acl = { [user.objectId]: { read: true, write: true } };
        participants.forEach(id => {
            acl[id] = { read: true, write: true };
        });

        const conversationPayload = {
            type,
            participants: participants.map(id => ({ __type: 'Pointer', className: '_User', objectId: id })),
            context: context || {},
            lastMessageAt: { __type: 'Date', iso: new Date().toISOString() },
            ACL: acl
        };

        console.log('[Debug] Creating conversation with ACL:', JSON.stringify(acl));
        const newConv = await parseRequest('/classes/Conversation', 'POST', conversationPayload, null, true);
        res.json(newConv);

    } catch (error: any) {
        console.error('Create conversation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send Message
app.post('/api/messages', async (req, res) => {
    const sessionToken = req.header('X-Parse-Session-Token');
    if (!sessionToken) return res.status(401).json({ error: 'Missing session token' });

    try {
        const { conversationId, text, attachments } = req.body;
        if (!conversationId || !text) return res.status(400).json({ error: 'Conversation ID and text required' });

        // 1. Verify User
        let user: any;
        const IS_PROD = process.env.NODE_ENV === 'production';

        if (!IS_PROD && sessionToken.startsWith('mock_session_token_vendor')) {
            user = { objectId: 'qoK5mTF2Lo', username: 'v_tech_vendor' };
        } else if (!IS_PROD && sessionToken.startsWith('mock_session_token')) {
            user = { objectId: 'RvDjRB413H', username: 'john_doe' };
        } else {
            user = await parseRequest('/users/me', 'GET', null, sessionToken);
        }
        if (!user || !user.objectId) return res.status(401).json({ error: 'Invalid session' });

        // 2. Verify Conversation Access
        const conversation = await parseRequest(`/classes/Conversation/${conversationId}`, 'GET', null, null, true);
        if (!conversation || conversation.error) return res.status(404).json({ error: 'Conversation not found' });

        // Check if user is participant (participants is array of pointers)
        const isParticipant = conversation.participants.some((p: any) => p.objectId === user.objectId);
        if (!isParticipant) return res.status(403).json({ error: 'Access denied' });

        // 3. Create Message
        const acl: Record<string, { read: boolean; write: boolean }> = {
            [user.objectId]: { read: true, write: true }
        };
        // Grant read/write access to other participants in the conversation
        conversation.participants.forEach((p: any) => {
            acl[p.objectId] = { read: true, write: true };
        });

        const messagePayload = {
            conversation: { __type: 'Pointer', className: 'Conversation', objectId: conversationId },
            sender: { __type: 'Pointer', className: '_User', objectId: user.objectId },
            text,
            attachments: attachments || [],
            readBy: [user.objectId], // Mark read by sender
            ACL: acl
        };

        const newMessage = await parseRequest('/classes/Message', 'POST', messagePayload, null, true);

        // 4. Update Conversation Timestamp
        await parseRequest(`/classes/Conversation/${conversationId}`, 'PUT', {
            lastMessageAt: { __type: 'Date', iso: new Date().toISOString() }
        }, null, true);

        res.json(newMessage);

    } catch (error: any) {
        console.error('Send message error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Messages for Conversation
app.get('/api/conversations/:id/messages', async (req, res) => {
    const sessionToken = req.header('X-Parse-Session-Token');
    if (!sessionToken) return res.status(401).json({ error: 'Missing session token' });

    try {
        // 1. Verify User
        let user: any;
        const IS_PROD = process.env.NODE_ENV === 'production';

        if (!IS_PROD && sessionToken.startsWith('mock_session_token_vendor')) {
            user = { objectId: 'qoK5mTF2Lo', username: 'v_tech_vendor' };
        } else if (!IS_PROD && sessionToken.startsWith('mock_session_token')) {
            user = { objectId: 'RvDjRB413H', username: 'john_doe' };
        } else {
            user = await parseRequest('/users/me', 'GET', null, sessionToken);
        }
        if (!user || !user.objectId) return res.status(401).json({ error: 'Invalid session' });

        const conversationId = req.params.id;

        // 2. Verify Access
        const conversation = await parseRequest(`/classes/Conversation/${conversationId}`, 'GET', null, null, true);
        if (!conversation || conversation.error) return res.status(404).json({ error: 'Conversation not found' });

        const isParticipant = conversation.participants.some((p: any) => p.objectId === user.objectId);
        if (!isParticipant) return res.status(403).json({ error: 'Access denied' });

        // 3. Fetch Messages
        const where = encodeURIComponent(JSON.stringify({
            conversation: { __type: 'Pointer', className: 'Conversation', objectId: conversationId }
        }));
        const query = `where=${where}&order=createdAt&limit=100`;

        const messages = await parseRequest(`/classes/Message?${query}`, 'GET', null, null, true);
        res.json(messages);

    } catch (error: any) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get My Conversations (Inbox)
app.get('/api/conversations', async (req, res) => {
    const sessionToken = req.header('X-Parse-Session-Token');
    if (!sessionToken) return res.status(401).json({ error: 'Missing session token' });

    try {
        let user: any;
        const IS_PROD = process.env.NODE_ENV === 'production';

        if (!IS_PROD && sessionToken.startsWith('mock_session_token_vendor')) {
            user = { objectId: 'qoK5mTF2Lo', username: 'v_tech_vendor' };
        } else if (!IS_PROD && sessionToken.startsWith('mock_session_token')) {
            user = { objectId: 'RvDjRB413H', username: 'john_doe' };
        } else {
            user = await parseRequest('/users/me', 'GET', null, sessionToken);
        }
        if (!user || !user.objectId) return res.status(401).json({ error: 'Invalid session' });

        // Query conversations where 'participants' contains current user pointer
        const where = encodeURIComponent(JSON.stringify({
            participants: { __type: 'Pointer', className: '_User', objectId: user.objectId }
        }));
        const query = `where=${where}&order=-lastMessageAt&include=participants`;

        const conversations = await parseRequest(`/classes/Conversation?${query}`, 'GET', null, null, true);
        res.json(conversations);

    } catch (error: any) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Audit Logs
app.post('/api/audit', async (req, res) => {
    try {
        const result = await parseRequest('/classes/AuditLog', 'POST', req.body);
        res.json(result);
    } catch (error: any) {
        // Audit log failures should not block client, but we log them here
        console.error('Audit log failed:', error);
        res.status(500).json({ error: 'Failed to log' });
    }
});

app.get('/api/audit', requireAdminSecret, async (req, res) => {
    try {
        const query = req.query.where ? `?where=${req.query.where}` : '';
        const limit = req.query.limit ? `&limit=${req.query.limit}` : '';
        const result = await parseRequest(`/classes/AuditLog${query}${limit}`, 'GET');
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`Admin Secret configured: ${process.env.ADMIN_SECRET ? 'YES' : 'NO (Using default)'}`);
});
