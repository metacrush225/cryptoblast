const crypto = require('crypto');


let stateStorage = {};

function storeStateAndChannelId(state, channelId) {
    // Store the state and channelId in an object with an expiration logic
    stateStorage[state] = { channelId, expiresAt: Date.now() + 300000 }; // expires in 5 minutes
}

function getStateAndDiscordChannelId(state) {
    const data = stateStorage[state];
    if (!data || data.expiresAt < Date.now()) {
        delete stateStorage[state]; // Clean up expired data
        return null;
    }
    return data.channelId;
}

function generateUniqueState() {
    return crypto.randomBytes(16).toString('hex');
}


module.exports = { getStateAndDiscordChannelId, generateUniqueState, storeStateAndChannelId };