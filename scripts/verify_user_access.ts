
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load envs
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const APP_ID = process.env.PARSE_APP_ID;
const REST_KEY = process.env.PARSE_REST_KEY;
// We need a known vendor user ID. I'll pick one from the previous logs or creating one if possible. 
// But since I don't know the exact ID the user is clicking, I'll first try to find ANY user with role='vendor' using Master Key,
// and then try to fetch it again WITHOUT Master Key (simulating anonymous).

const MASTER_KEY = process.env.PARSE_MASTER_KEY;

async function verifyAccess() {
    console.log('--- Verifying Public Read Access to _User ---');

    // 1. Find a vendor user using Master Key (God Mode)
    console.log('1. Finding a target vendor user (using Master Key)...');
    try {
        const query = encodeURIComponent(JSON.stringify({ role: 'vendor' }));
        const res = await axios.get(`https://parseapi.back4app.com/classes/_User?where=${query}&limit=1`, {
            headers: {
                'X-Parse-Application-Id': APP_ID,
                'X-Parse-Master-Key': MASTER_KEY // <--- GOD MODE
            }
        });

        if (res.data.results.length === 0) {
            console.warn('No users with role="vendor" found to test with.');
            return;
        }

        const targetUser = res.data.results[0];
        console.log(`   Found target user: ${targetUser.objectId} (${targetUser.username})`);

        // 2. Try to fetch this user using REST Key ONLY (Anonymous Client)
        console.log('2. Attempting to fetch this user as Anonymous (REST Key only)...');
        try {
            await axios.get(`https://parseapi.back4app.com/classes/_User/${targetUser.objectId}`, {
                headers: {
                    'X-Parse-Application-Id': APP_ID,
                    'X-Parse-REST-API-Key': REST_KEY // <--- CLIENT MODE (No Session, No Master)
                }
            });
            console.log('   [SUCCESS] Anonymous read allowed! Issue might be something else.');
        } catch (err: any) {
            if (err.response) {
                console.log(`   [FAILED] Server responded with ${err.response.status} ${err.response.statusText}`);
                console.log('   Error body:', err.response.data);
                if (err.response.status === 403 || err.response.status === 404) {
                    console.log('   >>> DIAGNOSIS: Public Read is disabled for _User class. Anonymous users (Yandex) cannot see vendors.');
                }
            } else {
                console.log('   [FAILED] Network error:', err.message);
            }
        }

    } catch (err: any) {
        console.error('Failed step 1:', err.message);
    }
}

verifyAccess();
