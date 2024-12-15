require('dotenv').config({ path: './param.env' });
const { google } = require('googleapis');
const axios = require('axios');
const { sendToDiscord } = require('../discord/discordUtils');

let lastStreamStatus = null;

// Initialize the YouTube API client
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

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

module.exports = { checkStreamAndNotify };