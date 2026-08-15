const mongoose = require('mongoose');

const bangDiemSchema = new mongoose.Schema({
    dang_ky: { type: mongoose.Schema.Types.ObjectId, ref: 'DangKy', required: true, unique: true },
    diem_huong_dan: { type: Number, required: true, min: 0, max: 10 },
    nhan_xet_huong_dan: { type: String, default: '' },
    diem_tong_ket: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('BangDiem', bangDiemSchema);