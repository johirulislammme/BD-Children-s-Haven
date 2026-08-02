const express = require('express');
const { v4: uuidv4 } = require('uuid');
const SSLCommerzPayment = require('sslcommerz-lts');
const db = require('../db');

const router = express.Router();

const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = process.env.SSLCOMMERZ_IS_LIVE === 'true';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ---- GET /api/products?category=toys ----
router.get('/products', (req, res) => {
  const { category } = req.query;
  let rows;
  if (category) {
    rows = db.prepare('SELECT * FROM products WHERE active = 1 AND category = ? ORDER BY id DESC').all(category);
  } else {
    rows = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY category, id DESC').all();
  }
  res.json(rows);
});

// ---- POST /api/checkout ----
// body: { customer: {name, phone, address}, items: [{id, qty}] }
router.post('/checkout', async (req, res) => {
  try {
    const { customer, items } = req.body;
    if (!customer || !customer.name || !customer.phone || !customer.address) {
      return res.status(400).json({ error: 'Missing customer name, phone or address.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    // Re-price everything server-side from the DB. Never trust prices sent by the client.
    const getProduct = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1');
    let total = 0;
    const orderItems = [];
    for (const it of items) {
      const p = getProduct.get(it.id);
      if (!p) continue;
      const qty = Math.max(1, parseInt(it.qty, 10) || 1);
      total += p.price * qty;
      orderItems.push({ id: p.id, name: p.name, price: p.price, qty });
    }
    if (orderItems.length === 0) {
      return res.status(400).json({ error: 'No valid items in cart.' });
    }

    const tran_id = uuidv4();

    db.prepare(`
      INSERT INTO orders (tran_id, customer_name, customer_phone, customer_address, items_json, total_amount, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(tran_id, customer.name, customer.phone, customer.address, JSON.stringify(orderItems), total);

    // If SSLCommerz isn't configured yet, fall back to Cash on Delivery so checkout still works in dev.
    if (!store_id || store_id === 'your_store_id') {
      db.prepare(`UPDATE orders SET payment_status = 'PENDING', payment_method = 'COD' WHERE tran_id = ?`).run(tran_id);
      return res.json({ ok: true, method: 'cod', redirect: `/thank-you.html?tran_id=${tran_id}` });
    }

    const data = {
      total_amount: total,
      currency: 'BDT',
      tran_id,
      success_url: `${BASE_URL}/api/payment/success`,
      fail_url: `${BASE_URL}/api/payment/fail`,
      cancel_url: `${BASE_URL}/api/payment/cancel`,
      ipn_url: `${BASE_URL}/api/payment/ipn`,
      shipping_method: 'Courier',
      product_name: orderItems.map((i) => i.name).join(', ').slice(0, 250),
      product_category: 'Kids Products',
      product_profile: 'general',
      cus_name: customer.name,
      cus_email: customer.email || 'noemail@bdchildrenshaven.com',
      cus_add1: customer.address,
      cus_city: customer.city || 'Dhaka',
      cus_postcode: customer.postcode || '1000',
      cus_country: 'Bangladesh',
      cus_phone: customer.phone,
      ship_name: customer.name,
      ship_add1: customer.address,
      ship_city: customer.city || 'Dhaka',
      ship_postcode: customer.postcode || '1000',
      ship_country: 'Bangladesh',
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(data);

    if (apiResponse && apiResponse.GatewayPageURL) {
      res.json({ ok: true, method: 'sslcommerz', redirect: apiResponse.GatewayPageURL });
    } else {
      res.status(502).json({ error: 'Could not start payment session.', details: apiResponse });
    }
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Something went wrong starting checkout.' });
  }
});

// ---- SSLCommerz redirects back here (server-to-server POST) ----
router.post('/payment/success', (req, res) => {
  const { tran_id, val_id } = req.body;
  if (tran_id) {
    db.prepare(`UPDATE orders SET payment_status = 'PAID', payment_method = 'SSLCommerz', sslcz_val_id = ? WHERE tran_id = ?`)
      .run(val_id || '', tran_id);
  }
  res.redirect(`${BASE_URL}/thank-you.html?tran_id=${tran_id || ''}&status=paid`);
});

router.post('/payment/fail', (req, res) => {
  const { tran_id } = req.body;
  if (tran_id) {
    db.prepare(`UPDATE orders SET payment_status = 'FAILED' WHERE tran_id = ?`).run(tran_id);
  }
  res.redirect(`${BASE_URL}/thank-you.html?tran_id=${tran_id || ''}&status=failed`);
});

router.post('/payment/cancel', (req, res) => {
  const { tran_id } = req.body;
  if (tran_id) {
    db.prepare(`UPDATE orders SET payment_status = 'CANCELLED' WHERE tran_id = ?`).run(tran_id);
  }
  res.redirect(`${BASE_URL}/thank-you.html?tran_id=${tran_id || ''}&status=cancelled`);
});

// Instant Payment Notification - SSLCommerz calls this server-to-server as a reliability backstop
router.post('/payment/ipn', (req, res) => {
  const { tran_id, status } = req.body;
  if (tran_id && status === 'VALID') {
    db.prepare(`UPDATE orders SET payment_status = 'PAID' WHERE tran_id = ?`).run(tran_id);
  }
  res.sendStatus(200);
});

module.exports = router;
