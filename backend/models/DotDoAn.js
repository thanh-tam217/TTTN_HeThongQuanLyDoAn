const mongoose = require('mongoose');

const dotDoAnSchema = new mongoose.Schema({
    ten_dot: { type: String, required: true, trim: true },
    nam_hoc: { type: String, required: true, trim: true },
    hoc_ky: { type: Number, required: true, enum: [1, 2, 3] },
    loai_do_an: { type: String, required: true, default: 'DATN' },
    ngay_bat_dau: { type: Date, required: true },
    ngay_ket_thuc: { type: Date, required: true },
    han_nop_bao_cao: { type: Date, required: true },
    trang_thai: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('DotDoAn', dotDoAnSchema);