require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const existing = await User.findOne({ email: 'hlttam@admin.edu.vn' });
        if (existing) {
            console.log('Tài khoản đã tồn tại!');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const admin = new User({
            ma_so: 'AD000001',
            ho_ten: 'Hoàng Lâm Thanh Tâm',
            email: 'hlttam@admin.edu.vn',
            mat_khau: hashedPassword,
            vai_tro: 'admin',
            so_dien_thoai: '0902409301',
            trang_thai: true
        });

        await admin.save();
        console.log('Tạo tài khoản Admin thành công!');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi:', error.message);
        process.exit(1);
    }
}

createAdmin();