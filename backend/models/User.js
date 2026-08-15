const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    ma_so: { type: String, required: true, unique: true, trim: true },
    ho_ten: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    mat_khau: { type: String, required: true },
    vai_tro: { type: String, enum: ['admin', 'giang_vien', 'sinh_vien'], default: 'sinh_vien' },
    so_dien_thoai: { type: String, default: '' },
    trang_thai: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);