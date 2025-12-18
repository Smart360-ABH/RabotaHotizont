const fetch = require('node-fetch');
require('dotenv').config();

const APP_ID = process.env.PARSE_APP_ID;
const MASTER_KEY = process.env.PARSE_MASTER_KEY;

async function listUsers() {
    const response = await fetch('https://parseapi.back4app.com/users', {
        headers: {
            'X-Parse-Application-Id': APP_ID,
            'X-Parse-Master-Key': MASTER_KEY
        }
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

listUsers();
