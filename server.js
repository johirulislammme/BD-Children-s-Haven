require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

require('./db'); // creates tables + seeds on first run

const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // SSLCommerz posts form-encoded data back

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }, // 8 hours
}));

app.use('/api/admin', adminRoutes);
app.use('/api', apiRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`BD Children's Haven server running at http://localhost:${PORT}`);
});
