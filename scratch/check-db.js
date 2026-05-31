const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'apps', 'pos', 'prisma', 'pos.db');
console.log('Opening database:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
});

db.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, rows) => {
  if (err) {
    console.error('Error querying tables:', err);
    process.exit(1);
  }
  console.log('Tables in database:', rows.map(r => r.name));
  
  db.all("SELECT count(*) as count FROM Table;", [], (err, rows) => {
    if (err) {
      console.error('Error counting Table:', err);
    } else {
      console.log('Table count:', rows[0].count);
    }
    
    db.all("SELECT * FROM Table;", [], (err, rows) => {
      if (err) {
        console.error('Error querying Table:', err);
      } else {
        console.log('Tables:', rows);
      }
      db.close();
    });
  });
});
