const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data.json');

function getInitialData() {
  return {
    products: [
      { id: 1, name: "DC Circuit Kit", price: 1000, category: "Toys", tag: "New", emoji: "🧸", image: "" },
      { id: 2, name: 'Rotating World Globe, 8"', price: 950, category: "Learning", tag: "Sale", emoji: "🌍", image: "" },
      { id: 3, name: "Kids Cotton Frock", price: 650, category: "Dress", tag: "New", emoji: "👗", image: "" },
      { id: 4, name: "Organic Honey Nuts", price: 450, category: "Food", tag: "Hot", emoji: "🍯", image: "" },
      { id: 5, name: "Baby Gentle Lotion", price: 350, category: "Cosmetics", tag: "New", emoji: "🧴", image: "" }
    ],
    orders: []
  };
}

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = getInitialData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return getInitialData();
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API Endpoints
app.get('/api/products', (req, res) => {
  const data = loadData();
  res.json(data.products);
});

app.post('/api/products', (req, res) => {
  const data = loadData();
  const newProduct = {
    id: Date.now(),
    name: req.body.name,
    price: Number(req.body.price),
    category: req.body.category,
    tag: req.body.tag || 'New',
    emoji: req.body.emoji || '🎁',
    image: req.body.image || ''
  };
  data.products.push(newProduct);
  saveData(data);
  res.json({ success: true, product: newProduct });
});

app.delete('/api/products/:id', (req, res) => {
  const data = loadData();
  const id = Number(req.params.id);
  data.products = data.products.filter(p => p.id !== id);
  saveData(data);
  res.json({ success: true });
});

app.get('/api/orders', (req, res) => {
  const data = loadData();
  res.json(data.orders);
});

app.post('/api/orders', (req, res) => {
  const data = loadData();
  const newOrder = {
    id: Date.now().toString().slice(-6),
    customerName: req.body.name,
    phone: req.body.phone,
    address: req.body.address,
    paymentMethod: req.body.paymentMethod || 'COD',
    items: req.body.items || [],
    total: req.body.total || 0,
    status: 'Pending',
    date: new Date().toISOString()
  };
  data.orders.push(newOrder);
  saveData(data);
  res.json({ success: true, order: newOrder });
});

// অর্ডারের স্ট্যাটাস আপডেট করার API
app.patch('/api/orders/:id/status', (req, res) => {
  const data = loadData();
  const orderId = req.params.id;
  const newStatus = req.body.status;

  const order = data.orders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    saveData(data);
    res.json({ success: true, order });
  } else {
    res.status(404).json({ success: false, message: 'Order not found' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const expectedUser = process.env.ADMIN_USERNAME || 'johirul';
  const expectedPass = process.env.ADMIN_PASSWORD || 'Js30113811';

  if (username === expectedUser && password === expectedPass) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Wrong username or password.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
