require('dotenv').config({ path: './param.env' });
const { google } = require('googleapis');
const axios = require('axios');
const { sendToDiscord } = require('../discord/discordUtils');

let lastStreamStatus = null;

// Configure the OAuth2 client with your Google credentials
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3535/callback'  // You will need to set this in your Google Developer Console
);

// Function to initialize the YouTube client with an OAuth2 client
const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client
});


async function getAndSetTokens(code) {
    try {
        const { tokens } = await oauth2Client.getToken(code);
        setAuthCredentials(tokens);
    } catch (error) {
        console.error('Error getting tokens:', error);
    }
}



// Function to set credentials after obtaining them
function setAuthCredentials(tokens) {
    oauth2Client.setCredentials(tokens);
}




// Function to fetch live stream information by channel ID
async function getStreamInfo(channelId) {
    try {
        const response = await youtube.liveBroadcasts.list({
            part: 'snippet,contentDetails,status',
            broadcastStatus: 'active',
            broadcastType: 'all',
            id: channelId
        });
        return response.data.items[0]; // Assuming the first item is the desired stream
    } catch (error) {
        console.error('Error fetching YouTube stream information:', error);
        return null;
    }
}

// Function to check stream status and notify Discord
async function checkStreamAndNotify(channelId) {
    console.log('Checking YouTube stream status...');
    const streamInfo = await getStreamInfo(channelId);

    if (streamInfo) {
        console.log(`YouTube stream info received: ${streamInfo.snippet.title}`);
        if (lastStreamStatus !== 'live') {
            lastStreamStatus = 'live';
            await sendToDiscord(`Stream is live! Title: ${streamInfo.snippet.title}`);
        }
    } else {
        if (lastStreamStatus === 'live') {
            lastStreamStatus = null;
            await sendToDiscord('Stream has ended.');
        }
        console.log('No YouTube stream info available.');
    }
}

module.exports = { checkStreamAndNotify, setAuthCredentials };