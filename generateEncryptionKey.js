const crypto = require('crypto');

function generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex'); // Generates a 32 byte key and encodes it as a hex string
}

console.log(generateEncryptionKey());