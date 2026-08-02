const express = require('express');
const db = require('../db');

const router = express.Router();

function requireLogin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: 'Not logged in.' });
}

// ---- Auth ----
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Wrong username or password.' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  res.json({ loggedIn: !!(req.session && req.session.isAdmin) });
});

// ---- Products CRUD (all require login) ----
router.get('/products', requireLogin, (req, res) => {
  res.json(db.prepare('SELECT * FROM products ORDER BY category, id DESC').all());
});

router.post('/products', requireLogin, (req, res) => {
  const { name, category, price, stock, emoji, tag } = req.body;
  if (!name || !category || price == null) {
    return res.status(400).json({ error: 'name, category and price are required.' });
  }
  const info = db.prepare(`
    INSERT INTO products (name, category, price, stock, emoji, tag)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, category, parseInt(price, 10), parseInt(stock, 10) || 0, emoji || '🎁', tag || '');
  res.json({ ok: true, id: info.lastInsertRowid });
});

router.put('/products/:id', requireLogin, (req, res) => {
  const { name, category, price, stock, emoji, tag, active } = req.body;
  db.prepare(`
    UPDATE products SET name=?, category=?, price=?, stock=?, emoji=?, tag=?, active=?
    WHERE id=?
  `).run(name, category, parseInt(price, 10), parseInt(stock, 10) || 0, emoji || '🎁', tag || '', active ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

router.delete('/products/:id', requireLogin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---- Orders (read-only list, and status update) ----
router.get('/orders', requireLogin, (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
  res.json(rows.map((o) => ({ ...o, items: JSON.parse(o.items_json) })));
});

router.put('/orders/:id/status', requireLogin, (req, res) => {
  const { payment_status } = req.body;
  db.prepare('UPDATE orders SET payment_status = ? WHERE id = ?').run(payment_status, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
