import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const APP_ID = process.env.PARSE_APP_ID;
const REST_KEY = process.env.PARSE_REST_KEY;

if (!APP_ID || !REST_KEY) {
    console.warn('⚠️ PARSE_APP_ID or PARSE_REST_KEY not set in environment');
}

const MASTER_KEY = process.env.PARSE_MASTER_KEY;

export const parseRequest = async (endpoint: string, method: string = 'GET', body: any = null, sessionToken: string | null = null, useMasterKey: boolean = false) => {
    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `https://parseapi.back4app.com${cleanEndpoint}`;

    const headers: any = {
        'X-Parse-Application-Id': APP_ID || '',
        'Content-Type': 'application/json'
    };

    if (useMasterKey && MASTER_KEY) {
        headers['X-Parse-Master-Key'] = MASTER_KEY;
    } else {
        headers['X-Parse-REST-API-Key'] = REST_KEY || '';
        if (sessionToken) {
            headers['X-Parse-Session-Token'] = sessionToken;
        }
    }

    const options: any = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    // console.log(`[Parse] ${method} ${url}`);

    try {
        if (url.includes('Conversation')) {
            console.log(`[Debug] Fetching: ${url}`);
        }
        const response = await fetch(url, options);

        // Handle empty responses
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (!response.ok) {
            throw new Error(data.error || `Back4App Error ${response.status}: ${JSON.stringify(data)}`);
        }

        return data;
    } catch (error) {
        console.error(`Parse Request Error [${method} ${endpoint}]:`, error);
        throw error;
    }
};
