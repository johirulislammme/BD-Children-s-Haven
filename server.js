const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading data file:', e);
    }
  }
  return {
    products: [
      { id: 1, name: 'DC Circuit Kit', price: 1000, category: 'Toys', tag: 'New', stock: 15, image: '' },
      { id: 2, name: 'Rotating World Globe, 8"', price: 950, category: 'Learning', tag: 'Sale', stock: 10, image: '' },
      { id: 3, name: 'Kids Cotton Frock', price: 650, category: 'Dress', tag: 'New', stock: 20, image: '' },
      { id: 4, name: 'Organic Honey Nuts', price: 450, category: 'Food', tag: 'Hot', stock: 25, image: '' },
      { id: 5, name: 'Baby Gentle Lotion', price: 350, category: 'Cosmetics', tag: 'New', stock: 30, image: '' }
    ],
    orders: []
  };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Admin Login API (আপনার সঠিক ইউজারনেম ও পাসওয়ার্ড)
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'johirul' && password === 'Js30113811') {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Wrong username or password.' });
  }
});

// Get Products API
app.get('/api/products', (req, res) => {
  const db = loadData();
  res.json(db.products);
});

// Add Product API (with stock)
app.post('/api/products', (req, res) => {
  const db = loadData();
  const { name, price, category, tag, stock, image } = req.body;
  
  const newProduct = {
    id: Date.now(),
    name,
    price: Number(price) || 0,
    category: category || 'Toys',
    tag: tag || 'New',
    stock: Number(stock) || 0,
    image: image || ''
  };

  db.products.push(newProduct);
  saveData(db);
  res.json({ success: true, product: newProduct });
});

// Delete Product API
app.delete('/api/products/:id', (req, res) => {
  const db = loadData();
  const id = Number(req.params.id);
  db.products = db.products.filter(p => p.id !== id);
  saveData(db);
  res.json({ success: true });
});

// Get Orders API
app.get('/api/orders', (req, res) => {
  const db = loadData();
  res.json(db.orders);
});

// Create Order API
app.post('/api/orders', (req, res) => {
  const db = loadData();
  const { name, phone, address, paymentMethod, items, total } = req.body;

  const newOrder = {
    id: Date.now(),
    name,
    phone,
    address,
    paymentMethod,
    items,
    total,
    status: 'Pending',
    date: new Date().toISOString()
  };

  db.orders.unshift(newOrder);
  saveData(db);
  res.json({ success: true, order: newOrder });
});

// Update Order Status API (Stock Deduction on 'Delivered')
app.patch('/api/orders/:id/status', (req, res) => {
  const db = loadData();
  const orderId = Number(req.params.id);
  const { status } = req.body;

  const order = db.orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (order.status !== 'Delivered' && status === 'Delivered') {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(orderedItem => {
        const product = db.products.find(p => p.id === orderedItem.id);
        if (product) {
          product.stock = Math.max(0, (product.stock || 0) - 1);
        }
      });
    }
  }

  order.status = status;
  saveData(db);
  res.json({ success: true, order });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
