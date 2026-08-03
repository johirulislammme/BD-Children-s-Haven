const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // স্ট্যাটিক ফাইল সার্ভ করার জন্য

// ডাটা ফাইল পাথ (যদি ফাইল বেইজড প্রজেক্ট হয়)
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// হেল্পার ফাংশন: ডাটা পড়া
function readData(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// হেল্পার ফাংশন: ডাটা লেখা
function writeData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ১. প্রোডাক্ট রিড করার API
app.get('/api/products', (req, res) => {
  const products = readData(PRODUCTS_FILE);
  res.json(products);
});

// ২. নতুন প্রোডাক্ট যোগ করার API (এখানেই ভিডিও ফিল্ড হ্যান্ডেল করা হচ্ছে)
app.post('/api/products', (req, res) => {
  const { name, price, category, tag, stock, image, video } = req.body;
  const products = readData(PRODUCTS_FILE);

  const newProduct = {
    id: Date.now(),
    name: name || 'Unnamed',
    price: Number(price) || 0,
    category: category || 'Toys',
    tag: tag || '',
    stock: Number(stock) || 0,
    image: image || '',
    video: video || '' // ভিডিও ইউআরএল এখানে সেভ হচ্ছে
  };

  products.push(newProduct);
  writeData(PRODUCTS_FILE, products);

  res.json({ success: true, product: newProduct });
});

// ৩. প্রোডাক্ট ডিলিট করার API
app.delete('/api/products/:id', (req, res) => {
  const productId = Number(req.params.id);
  let products = readData(PRODUCTS_FILE);
  
  products = products.filter(p => p.id !== productId);
  writeData(PRODUCTS_FILE, products);

  res.json({ success: true });
});

// ৪. অর্ডার দেখার API
app.get('/api/orders', (req, res) => {
  const orders = readData(ORDERS_FILE);
  res.json(orders);
});

// ৫. নতুন অর্ডার প্লেস করার API
app.post('/api/orders', (req, res) => {
  const { name, phone, address, paymentMethod, items, total } = req.body;
  const orders = readData(ORDERS_FILE);
  const products = readData(PRODUCTS_FILE);

  // স্টক আপডেট করার লজিক
  items.forEach(cartItem => {
    const product = products.find(p => p.id === cartItem.id);
    if (product) {
      product.stock = Math.max(0, (product.stock || 0) - cartItem.qty);
    }
  });
  writeData(PRODUCTS_FILE, products);

  const newOrder = {
    id: Date.now(),
    name,
    phone,
    address,
    paymentMethod,
    items,
    total,
    status: 'Pending',
    date: new Date()
  };

  orders.push(newOrder);
  writeData(ORDERS_FILE, orders);

  res.json({ success: true, orderId: newOrder.id });
});

// ৬. অর্ডারের স্ট্যাটাস আপডেট করার API
app.put('/api/orders/:id', (req, res) => {
  const orderId = Number(req.params.id);
  const { status } = req.body;
  let orders = readData(ORDERS_FILE);

  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
    writeData(ORDERS_FILE, orders);
    return res.json({ success: true });
  }

  res.status(404).json({ success: false, message: 'Order not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
