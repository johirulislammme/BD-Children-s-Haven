const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

function readData(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return [];
  }
}

function writeData(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Products API
app.get('/api/products', (req, res) => {
  res.json(readData(PRODUCTS_FILE));
});

app.post('/api/products', (req, res) => {
  const { name, price, category, tag, stock, image, video } = req.body;
  const products = readData(PRODUCTS_FILE);

  const newProduct = {
    id: Date.now(),
    name: name || 'Unnamed',
    price: Number(price) || 0,
    category: category || 'General',
    tag: tag || '',
    stock: Number(stock) || 0,
    image: image || '',
    video: video || ''
  };

  products.push(newProduct);
  writeData(PRODUCTS_FILE, products);
  res.json({ success: true, product: newProduct });
});

app.delete('/api/products/:id', (req, res) => {
  const productId = Number(req.params.id);
  let products = readData(PRODUCTS_FILE);
  products = products.filter(p => p.id !== productId);
  writeData(PRODUCTS_FILE, products);
  res.json({ success: true });
});

// Orders API
app.get('/api/orders', (req, res) => {
  res.json(readData(ORDERS_FILE));
});

app.post('/api/orders', (req, res) => {
  const { name, phone, address, paymentMethod, items, total } = req.body;
  const orders = readData(ORDERS_FILE);
  const products = readData(PRODUCTS_FILE);

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
    date: new Date().toLocaleString()
  };

  orders.push(newOrder);
  writeData(ORDERS_FILE, orders);
  res.json({ success: true, orderId: newOrder.id });
});

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
