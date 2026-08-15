const DotDoAn = require('../models/DotDoAn');

exports.getAllDotDoAn = async (req, res) => {
    try {
        const list = await DotDoAn.find().sort({ createdAt: -1 });
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

exports.createDotDoAn = async (req, res) => {
    try {
        const { ten_dot, nam_hoc, hoc_ky, loai_do_an, ngay_bat_dau, ngay_ket_thuc, han_nop_bao_cao } = req.body;
        const newDot = new DotDoAn({
            ten_dot,
            nam_hoc,
            hoc_ky,
            loai_do_an,
            ngay_bat_dau,
            ngay_ket_thuc,
            han_nop_bao_cao: han_nop_bao_cao || `${ngay_ket_thuc}T23:59:59.000Z`
        });
        await newDot.save();
        res.status(201).json({ message: 'Tạo đợt đồ án thành công!', dot: newDot });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

exports.updateDotDoAn = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await DotDoAn.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Không tìm thấy đợt đồ án!' });
        res.json({ message: 'Cập nhật đợt đồ án thành công!', dot: updated });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

exports.deleteDotDoAn = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await DotDoAn.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'Không tìm thấy đợt đồ án!' });
        res.json({ message: 'Xóa đợt đồ án thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

exports.toggleTrangThaiDot = async (req, res) => {
    try {
        const { id } = req.params;
        const dot = await DotDoAn.findById(id);
        if (!dot) return res.status(404).json({ message: 'Không tìm thấy đợt đồ án!' });
        dot.trang_thai = !dot.trang_thai;
        await dot.save();
        res.json({ message: `Đã ${dot.trang_thai ? 'Mở' : 'Đóng'} đợt thành công!`, trang_thai: dot.trang_thai });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};