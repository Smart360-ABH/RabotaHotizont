"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRequest = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const APP_ID = process.env.PARSE_APP_ID;
const REST_KEY = process.env.PARSE_REST_KEY;
if (!APP_ID || !REST_KEY) {
    console.warn('⚠️ PARSE_APP_ID or PARSE_REST_KEY not set in environment');
}
const MASTER_KEY = process.env.PARSE_MASTER_KEY;
const parseRequest = async (endpoint, method = 'GET', body = null, sessionToken = null, useMasterKey = false) => {
    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `https://parseapi.back4app.com${cleanEndpoint}`;
    const headers = {
        'X-Parse-Application-Id': APP_ID || '',
        'Content-Type': 'application/json'
    };
    if (useMasterKey && MASTER_KEY) {
        headers['X-Parse-Master-Key'] = MASTER_KEY;
    }
    else {
        headers['X-Parse-REST-API-Key'] = REST_KEY || '';
        if (sessionToken) {
            headers['X-Parse-Session-Token'] = sessionToken;
        }
    }
    const options = {
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
        const response = await (0, node_fetch_1.default)(url, options);
        // Handle empty responses
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        if (!response.ok) {
            throw new Error(data.error || `Back4App Error ${response.status}: ${JSON.stringify(data)}`);
        }
        return data;
    }
    catch (error) {
        console.error(`Parse Request Error [${method} ${endpoint}]:`, error);
        throw error;
    }
};
exports.parseRequest = parseRequest;
