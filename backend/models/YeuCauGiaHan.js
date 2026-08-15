const mongoose = require('mongoose');

const yeuCauGiaHanSchema = new mongoose.Schema({
    dang_ky: { type: mongoose.Schema.Types.ObjectId, ref: 'DangKy', required: true },
    ly_do: { type: String, required: true },
    han_nop_moi_de_xuat: { type: Date, required: true },
    trang_thai: { type: String, enum: ['cho_duyet', 'da_duyet', 'tu_choi'], default: 'cho_duyet' },
    phan_hoi_giang_vien: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('YeuCauGiaHan', yeuCauGiaHanSchema);