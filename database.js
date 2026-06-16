const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('finance.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL
    )
  `);
});

function addTransaction(userId, type, amount, description) {
  const date = new Date().toISOString();
  db.run(
    'INSERT INTO transactions (userId, type, amount, description, date) VALUES (?, ?, ?, ?, ?)',
    [userId, type, amount, description, date]
  );
}

function getMonthlyTransactions(userId) {
  return new Promise((resolve, reject) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${year}-${month}`;

    db.all(
      "SELECT * FROM transactions WHERE userId = ? AND date LIKE ?",
      [userId, `${prefix}%`],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

module.exports = { addTransaction, getMonthlyTransactions };