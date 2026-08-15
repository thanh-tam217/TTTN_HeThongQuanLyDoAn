const DeTai = require('../models/DeTai');

exports.getDanhSachDeTai = async (req, res) => {
    try {
        const list = await DeTai.find({ trang_thai: 'da_duyet' })
            .populate('giang_vien', 'ho_ten email ma_so so_dien_thoai')
            .populate('dot_do_an', 'ten_dot nam_hoc hoc_ky trang_thai han_nop_bao_cao')
            .sort({ createdAt: -1 });
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

exports.getMyDeTai = async (req, res) => {
    try {
        const list = await DeTai.find({ giang_vien: req.user.id })
            .populate('dot_do_an', 'ten_dot nam_hoc hoc_ky')
            .sort({ createdAt: -1 });
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

exports.createDeTai = async (req, res) => {
    try {
        const { ten_de_tai, mo_ta, yeu_cau, so_luong_sv_toi_da, dot_do_an } = req.body;
        const newDeTai = new DeTai({
            ten_de_tai,
            mo_ta: mo_ta || '',
            yeu_cau: yeu_cau || '',
            so_luong_sv_toi_da: Number(so_luong_sv_toi_da) || 1,
            dot_do_an,
            giang_vien: req.user.id,
            trang_thai: 'da_duyet'
        });
        await newDeTai.save();
        res.status(201).json({ message: 'Đăng tải đề tài thành công!', de_tai: newDeTai });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

exports.updateDeTai = async (req, res) => {
    try {
        const { id } = req.params;
        const deTai = await DeTai.findOne({ _id: id, giang_vien: req.user.id });
        if (!deTai) return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa đề tài này!' });

        const updated = await DeTai.findByIdAndUpdate(id, req.body, { new: true });
        res.json({ message: 'Cập nhật đề tài thành công!', de_tai: updated });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

exports.deleteDeTai = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await DeTai.findOneAndDelete({ _id: id, giang_vien: req.user.id });
        if (!deleted) return res.status(403).json({ message: 'Không tìm thấy đề tài hoặc không có quyền xóa!' });
        res.json({ message: 'Xóa đề tài thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

exports.toggleKhoaDeTai = async (req, res) => {
    try {
        const { id } = req.params;
        const deTai = await DeTai.findOne({ _id: id, giang_vien: req.user.id });
        if (!deTai) return res.status(404).json({ message: 'Không tìm thấy đề tài!' });

        deTai.trang_thai = deTai.trang_thai === 'da_khoa' ? 'da_duyet' : 'da_khoa';
        await deTai.save();

        res.json({
            message: deTai.trang_thai === 'da_khoa' ? 'Đã NGƯNG nhận sinh viên!' : 'Đã MỞ NHẬN sinh viên!',
            trang_thai: deTai.trang_thai
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};