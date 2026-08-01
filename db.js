const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'data', 'store.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,      -- toys | learning | dress | food | cosmetics
  price INTEGER NOT NULL,      -- in BDT, integer taka
  stock INTEGER NOT NULL DEFAULT 0,
  emoji TEXT DEFAULT '🎁',
  tag TEXT DEFAULT '',         -- e.g. "Best Seller", "New", or ''
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tran_id TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  items_json TEXT NOT NULL,     -- snapshot of ordered items
  total_amount INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | PAID | FAILED | CANCELLED
  payment_method TEXT DEFAULT '',
  sslcz_val_id TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// Seed products only if table is empty, so re-deploys don't duplicate data
const count = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO products (name, category, price, stock, emoji, tag)
    VALUES (@name, @category, @price, @stock, @emoji, @tag)
  `);
  const seed = [
    // Toys
    { name: 'Colour Stacking Blocks (40pcs)', category: 'toys', price: 690, stock: 25, emoji: '🧱', tag: 'Best Seller' },
    { name: 'Pull-Back Race Car Set', category: 'toys', price: 450, stock: 30, emoji: '🚗', tag: '' },
    { name: 'Wooden Puzzle — Jungle Animals', category: 'toys', price: 380, stock: 20, emoji: '🧩', tag: 'New' },
    { name: 'Huggable Teddy Bear, 14"', category: 'toys', price: 990, stock: 15, emoji: '🧸', tag: '' },
    // Learning
    { name: 'Junior Science Experiment Kit', category: 'learning', price: 1290, stock: 12, emoji: '🧪', tag: 'Best Seller' },
    { name: 'Rotating World Globe, 8"', category: 'learning', price: 850, stock: 18, emoji: '🌍', tag: '' },
    { name: 'Alphabet & Number Flash Cards', category: 'learning', price: 250, stock: 40, emoji: '🔤', tag: '' },
    { name: 'Math Counting Beads Set', category: 'learning', price: 420, stock: 22, emoji: '🧮', tag: 'New' },
    // Dress
    { name: 'Floral Party Frock (2–6y)', category: 'dress', price: 890, stock: 14, emoji: '👗', tag: 'New' },
    { name: 'Cotton Printed T-Shirt Set', category: 'dress', price: 350, stock: 35, emoji: '👕', tag: '' },
    { name: 'Dino Hooded Winter Jacket', category: 'dress', price: 1150, stock: 10, emoji: '🧥', tag: '' },
    { name: 'Everyday Shorts, 2-Pack', category: 'dress', price: 420, stock: 28, emoji: '🩳', tag: '' },
    // Food
    { name: 'Whole-Grain Animal Cookies', category: 'food', price: 180, stock: 50, emoji: '🍪', tag: 'Best Seller' },
    { name: 'Honey Oats Cereal, 400g', category: 'food', price: 320, stock: 26, emoji: '🥣', tag: '' },
    { name: 'No-Sugar-Added Choco Bites', category: 'food', price: 250, stock: 33, emoji: '🍫', tag: '' },
    { name: 'Real Fruit Juice Box, 6-Pack', category: 'food', price: 300, stock: 24, emoji: '🧃', tag: '' },
    // Cosmetics
    { name: 'Tear-Free Baby Shampoo, 200ml', category: 'cosmetics', price: 380, stock: 20, emoji: '🧴', tag: 'Best Seller' },
    { name: 'Calendula Baby Soap, 3-Pack', category: 'cosmetics', price: 290, stock: 27, emoji: '🧼', tag: '' },
    { name: 'Soft-Bristle Toddler Toothbrush', category: 'cosmetics', price: 150, stock: 45, emoji: '🪥', tag: '' },
    { name: 'Diaper Rash Cream, 100g', category: 'cosmetics', price: 340, stock: 19, emoji: '🧷', tag: 'New' },
  ];
  const insertMany = db.transaction((rows) => rows.forEach((r) => insert.run(r)));
  insertMany(seed);
  console.log(`Seeded ${seed.length} products.`);
}

module.exports = db;
