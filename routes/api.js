const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all products or filter by category
router.get('/products', (req, res) => {
  try {
    const { category } = req.query;
    let rows;
    if (category) {
      rows = db.prepare('SELECT * FROM products WHERE active = 1 AND category = ? ORDER BY id DESC').all(category);
    } else {
      rows = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY category, id DESC').all();
    }
    res.json(rows);
  } catch (err) {
    console.error('Products API Error:', err);
    res.status(500).json({ error: 'Failed to load products', details: err.message });
  }
});

// Add a new product (Admin)
router.post('/products', (req, res) => {
  try {
    const { name, category, price, stock, emoji, tag } = req.body;
    if (!name || !category || !price) {
      return res.status(400).json({ error: 'Name, category and price are required' });
    }
    const stmt = db.prepare(`
      INSERT INTO products (name, category, price, stock, emoji, tag, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    const info = stmt.run(name, category, price, stock || 0, emoji || '🎁', tag || '');
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    console.error('Add Product Error:', err);
    res.status(500).json({ error: 'Failed to add product', details: err.message });
  }
});

module.exports = router;
