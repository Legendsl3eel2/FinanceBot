const Database = require('better-sqlite3');
const db = new Database('finance.db');

// สร้างตารางเก็บข้อมูล
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    date TEXT NOT NULL
  )
`);

// เพิ่มรายการ
function addTransaction(userId, type, amount, description) {
  const date = new Date().toISOString();
  const stmt = db.prepare(
    'INSERT INTO transactions (userId, type, amount, description, date) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(userId, type, amount, description, date);
}

// ดึงข้อมูลของเดือนนี้
function getMonthlyTransactions(userId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `${year}-${month}`;

  const stmt = db.prepare(
    "SELECT * FROM transactions WHERE userId = ? AND date LIKE ?"
  );
  return stmt.all(userId, `${prefix}%`);
}

module.exports = { addTransaction, getMonthlyTransactions };