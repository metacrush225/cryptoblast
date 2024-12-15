require('dotenv').config({ path: './param.env' });

const { ApiClient } = require('twitch');
const { ClientCredentialsAuthProvider } = require('twitch-auth');
const axios = require('axios');


const twitchAuthProvider = new ClientCredentialsAuthProvider(process.env.TWITCH_CLIENT_ID, process.env.TWITCH_CLIENT_SECRET);
const twitchApi = new ApiClient({ authProvider: twitchAuthProvider });
const { sendToDiscord } = require('../discord/discordUtils');



let lastStreamStatus = null;


// Function to get stream information
async function getStreamInfo() {
    try {
        const stream = await twitchApi.helix.streams.getStreamByUserId(userId);
        return stream;
    } catch (error) {
        console.error('Error fetching stream information:', error);
        return null;
    }
}

async function fetchUserId(username) {
    try {
        const user = await twitchApi.helix.users.getUserByName(username);
        userId = user.id;
        console.log('Your Twitch User ID is:', userId);
    } catch (error) {
        console.error('Error fetching user ID:', error);
    }
}



const getUserProfile = async (accessToken) => {
    try {
        const response = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Client-Id': process.env.TWITCH_CLIENT_ID
            }
        });
        console.log(`userProfile = ${response.data[0]}`)
        return response.data;
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        throw error;  // Or handle error appropriately
    }
};



async function getTwitchInfos(code, redirectUri) {
    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri
            }
        });
        return response.data; // This should include accessToken and refreshToken
    } catch (error) {
        console.error('Error during Twitch OAuth token exchange:', error);
        throw error; // Rethrow the error to be handled by the caller
    }
}



// Function to check stream status and notify Discord
async function checkStreamAndNotify() {
    const streamRoleId = '1237152102908956746';

    const streamInfo = await getStreamInfo();

    console.log('Checking stream status...');
    if (streamInfo) {
        console.log(`Stream info received: ${streamInfo.title}`);
    } else {
        console.log('No stream info available.');
    }

    if (streamInfo && streamInfo.type === 'live' && lastStreamStatus !== 'live') {
        lastStreamStatus = 'live';
        // await sendToDiscord(`<@&${streamRoleId}> [${process.env.TWITCH_URL}]\n**Title :** ${streamInfo.title}\n**Game :** ${streamInfo.gameName}`);
        await sendToDiscord(`# <@&${streamRoleId}> [${process.env.TWITCH_URL}]\n**Title :** ${streamInfo.title}\n**Game :** ${streamInfo.gameName}`);

    } else if (!streamInfo && lastStreamStatus === 'live') {
        lastStreamStatus = null;
        // await sendToDiscord('Stream has ended.');
        await sendToDiscord('# Stream has ended.');

    }
}



module.exports = { checkStreamAndNotify, getUserProfile, fetchUserId, getTwitchInfos };