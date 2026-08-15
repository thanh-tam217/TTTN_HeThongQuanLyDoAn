const mongoose = require('mongoose');

const baoCaoSchema = new mongoose.Schema({
    dang_ky: { type: mongoose.Schema.Types.ObjectId, ref: 'DangKy', required: true },
    file_url: { type: String, required: true },
    ten_file_goc: { type: String, required: true },
    kich_thuoc: { type: Number, default: 0 },
    lan_nop: { type: Number, default: 1 },
    submitted_at: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('BaoCao', baoCaoSchema);