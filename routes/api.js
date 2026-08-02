const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all products
router.get('/products', async (req, res) => {
  try {
    const products = await db.getProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// Process Manual Checkout (bKash / Nagad / Rocket / COD)
router.post('/checkout', async (req, res) => {
  try {
    const { customerName, phone, address, city, paymentMethod, senderNumber, trxId, items, totalAmount } = req.body;

    if (!customerName || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({ error: 'সবগুলো প্রয়োজনীয় তথ্য সঠিকভাবে পূরণ করুন।' });
    }

    const order = {
      id: 'ORD-' + Date.now().toString().slice(-6),
      customerName,
      phone,
      address,
      city: city || 'Dhaka',
      paymentMethod,
      senderNumber: paymentMethod === 'cod' ? 'N/A' : (senderNumber || 'N/A'),
      trxId: paymentMethod === 'cod' ? 'COD' : (trxId || 'N/A'),
      items,
      totalAmount,
      status: paymentMethod === 'cod' ? 'Pending (COD)' : 'Pending Verification',
      createdAt: new Date().toISOString()
    };

    if (db.saveOrder) {
      await db.saveOrder(order);
    }

    res.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'অর্ডার প্রসেস করতে সমস্যা হয়েছে।' });
  }
});

module.exports = router;
