const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// JSON ফাইলভিত্তিক ডাটাবেস (যাতে সার্ভার রিস্টার্ট হলেও অর্ডার বা প্রোডাক্ট মুছে না যায়)
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

// 1. Get Products API
app.get('/api/products', (req, res) => {
  const db = loadData();
  res.json(db.products);
});

// 2. Add Product API (with stock)
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

// 3. Delete Product API
app.delete('/api/products/:id', (req, res) => {
  const db = loadData();
  const id = Number(req.params.id);
  db.products = db.products.filter(p => p.id !== id);
  saveData(db);
  res.json({ success: true });
});

// 4. Get Orders API
app.get('/api/orders', (req, res) => {
  const db = loadData();
  res.json(db.orders);
});

// 5. Create Order API
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

  db.orders.unshift(newOrder); // নতুন অর্ডার উপরে দেখানোর জন্য unshift
  saveData(db);
  res.json({ success: true, order: newOrder });
});

// 6. Update Order Status API (Stock Deduction on 'Delivered')
app.patch('/api/orders/:id/status', (req, res) => {
  const db = loadData();
  const orderId = Number(req.params.id);
  const { status } = req.body;

  const order = db.orders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // যদি স্ট্যাটাস আগের থেকে আলাদা এবং নতুন স্ট্যাটাস "Delivered" হয়, তবে স্টক থেকে পরিমাণ মাইনাস হবে
  if (order.status !== 'Delivered' && status === 'Delivered') {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(orderedItem => {
        const product = db.products.find(p => p.id === orderedItem.id);
        if (product) {
          product.stock = Math.max(0, (product.stock || 0) - 1); // প্রতি পিস অর্ডারের জন্য স্টক ১ কমবে
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
