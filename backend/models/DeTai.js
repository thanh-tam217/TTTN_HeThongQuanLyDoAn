const mongoose = require('mongoose');

const deTaiSchema = new mongoose.Schema({
    ten_de_tai: { type: String, required: true, trim: true },
    mo_ta: { type: String, required: true },
    yeu_cau: { type: String, default: '' },
    so_luong_sv_toi_da: { type: Number, default: 1, min: 1 },
    dot_do_an: { type: mongoose.Schema.Types.ObjectId, ref: 'DotDoAn', required: true },
    giang_vien: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trang_thai: { type: String, enum: ['da_duyet', 'da_khoa'], default: 'da_duyet' }
}, { timestamps: true });

module.exports = mongoose.model('DeTai', deTaiSchema);