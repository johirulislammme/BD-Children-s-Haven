const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ডামি প্রোডাক্ট ডেটা (আপনার যদি আলাদা ডেটাবে বা অ্যারে থাকে তা রাখতে পারেন)
let products = [
  { id: 1, name: 'DC Circuit', category: 'Toys', price: 1000, emoji: '🧸', tag: 'New' },
  { id: 2, name: 'Rotating World Globe, 8"', category: 'Learning', price: 950, emoji: '🌍', tag: 'Sale' }
];

// অর্ডারগুলো মেমোরিতে জমানোর জন্য অ্যারে
let orders = [];

// ১. প্রোডাক্ট ফেচ করার API
app.get('/api/products', (req, res) => {
  res.json(products);
});

// ২. নতুন অর্ডার সেভ করার API (Confirm Order করার পর এখানে ডেটা আসবে)
app.post('/api/orders', (req, res) => {
  const newOrder = {
    id: orders.length + 1,
    customerName: req.body.name,
    phone: req.body.phone,
    address: req.body.address,
    paymentMethod: req.body.paymentMethod,
    items: req.body.items,
    total: req.body.total,
    status: 'Pending',
    date: new Date().toLocaleString()
  };
  
  orders.push(newOrder);
  console.log('New Order Received:', newOrder); // সার্ভার কনসোলে দেখতে পাবেন
  res.json({ success: true, message: 'Order placed successfully', order: newOrder });
});

// ৩. অ্যাডমিন প্যানেলের জন্য অর্ডার লিস্ট দেখার API
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
