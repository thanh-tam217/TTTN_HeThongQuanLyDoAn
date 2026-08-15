const mongoose = require('mongoose');

const dangKySchema = new mongoose.Schema({
    sinh_vien: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    de_tai: { type: mongoose.Schema.Types.ObjectId, ref: 'DeTai', required: true },
    trang_thai: { type: String, enum: ['cho_duyet', 'dang_thuc_hien', 'da_hoan_thanh', 'da_huy'], default: 'cho_duyet' },
    ly_do_huy: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('DangKy', dangKySchema);