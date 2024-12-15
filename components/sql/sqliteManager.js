const sqlite3 = require('sqlite3').verbose();
require('dotenv').config({ path: '../param.env' });
require('encryptor').config({ path: './encryptor' });


  const db = new sqlite3.Database(process.env.SQLITEDB, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }


});

function initializeDatabase() {
  // This statement ensures that the 'guildId' column is unique
  db.run(`CREATE TABLE IF NOT EXISTS parameters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guildId INT UNIQUE, 
    twitchClientId TEXT, 
    twitchClientSecret TEXT
  )`, function(err) {
    if (err) {
      console.error('Error creating table', err);
    } else {
      console.log('Table created or already exists.');
    }
  });
}



// Function to insert or update Twitch credentials
function insertOrUpdateTwitchCredentials(guildId, twitchClientId, twitchClientSecret) {
  const encryptedClientId = encrypt(twitchClientId);
  const encryptedClientSecret = encrypt(twitchClientSecret);

  const sql = `REPLACE INTO parameters (guildId, twitchClientId, twitchClientSecret) VALUES (?, ?, ?)`;
  db.run(sql, [guildId, encryptedClientId, encryptedClientSecret], function(err) {
      if (err) {
          return console.error('Error inserting or updating Twitch credentials', err);
      }
      console.log('Twitch credentials updated successfully');
  });
}

// Function to get Twitch credentials
function getTwitchCredentials(guildId, callback) {
  const sql = `SELECT twitchClientId, twitchClientSecret FROM parameters WHERE guildId = ?`;
  db.get(sql, [guildId], function(err, row) {
      if (err) {
          return console.error('Error retrieving Twitch credentials', err);
      }
      if (row) {
          const clientId = decrypt(row.twitchClientId);
          const clientSecret = decrypt(row.twitchClientSecret);
          callback(null, { clientId, clientSecret });
      } else {
          callback(new Error('No credentials found for this guildId'));
      }
  });
}



// Export the database object for use in other files
module.exports = { db, insertOrUpdateTwitchCredentials, getTwitchCredentials };