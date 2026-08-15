require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Kết nối CSDL
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve thư mục Uploads & Frontend tĩnh
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dot-do-an', require('./routes/dotDoAnRoutes'));
app.use('/api/de-tai', require('./routes/deTaiRoutes'));
app.use('/api/project-process', require('./routes/projectProcessRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(` Server đang chạy tại: http://localhost:${PORT}`);
});