const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ইন-মেমোরি বা ফাইল বেসড ডেটা (প্রোডাক্ট ও অর্ডার)
const DATA_FILE = path.join(__dirname, 'data.json');

// ডিফল্ট ডেটা যদি ফাইল না থাকে
function getInitialData() {
  return {
    products: [
      { id: 1, name: "DC Circuit Kit", price: 1000, category: "Toys", tag: "New", emoji: "🧸" },
      { id: 2, name: 'Rotating World Globe, 8"', price: 950, category: "Learning", tag: "Sale", emoji: "🌍" },
      { id: 3, name: "Kids Cotton Frock", price: 650, category: "Dress", tag: "New", emoji: "👗" },
      { id: 4, name: "Organic Honey Nuts", price: 450, category: "Food", tag: "Hot", emoji: "🍯" },
      { id: 5, name: "Baby Gentle Lotion", price: 350, category: "Cosmetics", tag: "New", emoji: "🧴" }
    ],
    orders: []
  };
}

// ডেটা লোড করার ফাংশন
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

// ডেটা সেভ করার ফাংশন
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- API Endpoints ---

// ১. সব প্রোডাক্ট ফেচ করার জন্য
app.get('/api/products', (req, res) => {
  const data = loadData();
  res.json(data.products);
});

// ২. নতুন প্রোডাক্ট যোগ করার জন্য (অ্যাডমিন)
app.post('/api/products', (req, res) => {
  const data = loadData();
  const newProduct = {
    id: Date.now(),
    name: req.body.name,
    price: Number(req.body.price),
    category: req.body.category,
    tag: req.body.tag || 'New',
    emoji: req.body.emoji || '🎁'
  };
  data.products.push(newProduct);
  saveData(data);
  res.json({ success: true, product: newProduct });
});

// ৩. প্রোডাক্ট ডিলিট করার জন্য (অ্যাডমিন)
app.delete('/api/products/:id', (req, res) => {
  const data = loadData();
  const id = Number(req.params.id);
  data.products = data.products.filter(p => p.id !== id);
  saveData(data);
  res.json({ success: true });
});

// ৪. অর্ডার লিস্ট দেখার জন্য (অ্যাডমিন)
app.get('/api/orders', (req, res) => {
  const data = loadData();
  res.json(data.orders);
});

// ৫. নতুন অর্ডার প্লেস করার জন্য
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
    date: new Date().toLocaleString()
  };
  data.orders.push(newOrder);
  saveData(data);
  res.json({ success: true, order: newOrder });
});

// ৬. অ্যাডমিন লগইন চেক করার API (এনভায়রনমেন্ট ভেরিয়েবল এবং ফলব্যাক সহ)
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
