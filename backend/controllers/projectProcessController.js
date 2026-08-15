// const DangKy = require('../models/DangKy');
// const DeTai = require('../models/DeTai');
// const BaoCao = require('../models/BaoCao');
// const BangDiem = require('../models/BangDiem');
// const YeuCauGiaHan = require('../models/YeuCauGiaHan');
// const DotDoAn = require('../models/DotDoAn');
// const path = require('path');

// // --- 1. PHÂN HỆ SINH VIÊN: ĐĂNG KÝ ĐỀ TÀI ---
// exports.dangKyDeTai = async (req, res) => {
//     try {
//         const { de_tai_id } = req.body;
//         const sinh_vien_id = req.user.id;

//         // Kiểm tra SV đã có đề tài active chưa
//         const activeRegistration = await DangKy.findOne({
//             sinh_vien: sinh_vien_id,
//             trang_thai: { $in: ['cho_duyet', 'dang_thuc_hien', 'da_hoan_thanh'] }
//         });

//         if (activeRegistration) {
//             return res.status(400).json({ message: 'Bạn đã đăng ký một đề tài trong hệ thống!' });
//         }

//         const deTai = await DeTai.findById(de_tai_id);
//         if (!deTai) return res.status(404).json({ message: 'Không tìm thấy đề tài!' });
//         if (deTai.trang_thai === 'da_khoa') {
//             return res.status(400).json({ message: 'Đề tài này đã khóa nhận sinh viên!' });
//         }

//         const countAccepted = await DangKy.countDocuments({ de_tai: de_tai_id, trang_thai: 'dang_thuc_hien' });
//         if (countAccepted >= deTai.so_luong_sv_toi_da) {
//             return res.status(400).json({ message: 'Đề tài đã nhận đủ số lượng sinh viên tối đa!' });
//         }

//         const newDangKy = new DangKy({
//             sinh_vien: sinh_vien_id,
//             de_tai: de_tai_id,
//             trang_thai: 'cho_duyet'
//         });
//         await newDangKy.save();

//         res.status(201).json({ message: 'Đăng ký đề tài thành công! Vui lòng chờ Giảng viên duyệt.', dang_ky: newDangKy });
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi server:', error: error.message });
//     }
// };

// // Sinh viên xem thông tin đề tài & tiến độ của mình
// exports.getMyStatus = async (req, res) => {
//     try {
//         const dangKy = await DangKy.findOne({
//             sinh_vien: req.user.id,
//             trang_thai: { $in: ['cho_duyet', 'dang_thuc_hien', 'da_hoan_thanh'] }
//         })
//         .populate({
//             path: 'de_tai',
//             populate: [
//                 { path: 'giang_vien', select: 'ho_ten email so_dien_thoai ma_so' },
//                 { path: 'dot_do_an' }
//             ]
//         });

//         if (!dangKy) return res.json({ hasProject: false });

//         const listBaoCao = await BaoCao.find({ dang_ky: dangKy._id }).sort({ submitted_at: -1 });
//         const bangDiem = await BangDiem.findOne({ dang_ky: dangKy._id });
//         const listGiaHan = await YeuCauGiaHan.find({ dang_ky: dangKy._id }).sort({ createdAt: -1 });

//         res.json({
//             hasProject: true,
//             dangKy,
//             listBaoCao,
//             bangDiem,
//             listGiaHan
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi server:', error: error.message });
//     }
// };

// // --- 2. PHÂN HỆ SINH VIÊN: NỘP BÁO CÁO (MULTER) ---
// exports.nopBaoCao = async (req, res) => {
//     try {
//         if (!req.file) return res.status(400).json({ message: 'Vui lòng đính kèm tệp báo cáo!' });

//         const dangKy = await DangKy.findOne({ sinh_vien: req.user.id, trang_thai: 'dang_thuc_hien' })
//             .populate({ path: 'de_tai', populate: { path: 'dot_do_an' } });

//         if (!dangKy) return res.status(400).json({ message: 'Bạn chưa có đề tài được duyệt hoặc đã hoàn thành!' });

//         // Kiểm tra hạn nộp báo cáo (hoặc hạn gia hạn đã được duyệt)
//         const dot = dangKy.de_tai.dot_do_an;
//         let effectiveDeadline = new Date(dot.han_nop_bao_cao);

//         const approvedGiaHan = await YeuCauGiaHan.findOne({ dang_ky: dangKy._id, trang_thai: 'da_duyet' }).sort({ han_nop_moi_de_xuat: -1 });
//         if (approvedGiaHan) effectiveDeadline = new Date(approvedGiaHan.han_nop_moi_de_xuat);

//         if (new Date() > effectiveDeadline) {
//             return res.status(400).json({ message: `Đã quá hạn nộp báo cáo (${effectiveDeadline.toLocaleString('vi-VN')})!` });
//         }

//         const count = await BaoCao.countDocuments({ dang_ky: dangKy._id });
//         const newBaoCao = new BaoCao({
//             dang_ky: dangKy._id,
//             file_url: `/uploads/${req.file.filename}`,
//             ten_file_goc: req.file.originalname,
//             kich_thuoc: req.file.size,
//             lan_nop: count + 1,
//             submitted_at: new Date()
//         });
//         await newBaoCao.save();

//         res.status(201).json({ message: `Nộp báo cáo lần ${newBaoCao.lan_nop} thành công!`, bao_cao: newBaoCao });
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi server:', error: error.message });
//     }
// };

// // --- 3. PHÂN HỆ SINH VIÊN: XIN GIA HẠN ---
// exports.guiYeuCauGiaHan = async (req, res) => {
//     try {
//         const { ly_do, han_nop_moi_de_xuat } = req.body;
//         const dangKy = await DangKy.findOne({ sinh_vien: req.user.id, trang_thai: 'dang_thuc_hien' });

//         if (!dangKy) return res.status(400).json({ message: 'Bạn không có đề tài đang thực hiện!' });

//         const newYeuCau = new YeuCauGiaHan({
//             dang_ky: dangKy._id,
//             ly_do,
//             han_nop_moi_de_xuat
//         });
//         await newYeuCau.save();

//         res.status(201).json({ message: 'Gửi yêu cầu xin gia hạn thành công!', yeu_cau: newYeuCau });
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi server:', error: error.message });
//     }
// };

// // --- 4. PHÂN HỆ GIẢNG VIÊN: DUYỆT ĐĂNG KÝ ---
// exports.getGVDanhSachDangKy = async (req, res) => {
//     try {
//         const myDeTaiList = await DeTai.find({ giang_vien: req.user.id }).select('_id');
//         const deTaiIds = myDeTaiList.map(dt => dt._id);

//         const list = await DangKy.find({ de_tai: { $in: deTaiIds } })
//             .populate('sinh_vien', 'ma_so ho_ten email so_dien_thoai')
//             .populate('de_tai', 'ten_de_tai so_luong_sv_toi_da trang_thai')
//             .sort({ createdAt: -1 });

//         res.json(list);
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi server:', error: error.message });
//     }
// };

// exports.duyetDangKy = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { trang_thai, ly_do_huy } = req.body;

//         const dangKy = await DangKy.findById(id).populate('de_tai');
//         if (!dangKy) return res.status(404).json({ message: 'Không tìm thấy đăng ký!' });

//         if (trang_thai === 'dang_thuc_hien') {
//             const countAccepted = await DangKy.countDocuments({ de_tai: dangKy.de_tai._id, trang_thai: 'dang_thuc_hien' });
//             if (countAccepted >= dangKy.de_tai.so_luong_sv_toi_da) {
//                 return res.status(400).json({ message: `Đề tài đã đủ tối đa ${dangKy.de_tai.so_luong_sv_toi_da} sinh viên!` });
//             }
//         }

//         dangKy.trang_thai = trang_thai;
//         if (ly_do_huy) dangKy.ly_do_huy = ly_do_huy;
//         await dangKy.save();

//         res.json({ message: trang_thai === 'dang_thuc_hien' ? 'Đã DUYỆT sinh viên!' : 'Đã TỪ CHỐI sinh viên!' });
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi server:', error: error.message });
//     }
// };

// // --- 5. PHÂN HỆ GIẢNG VIÊN: CHẤM ĐIỂM ---
// exports.getGVListChamDiem = async (req, res) => {
//     try {
//         const myDeTaiList = await DeTai.find({ giang_vien: req.user.id }).select('_id');
//         const deTaiIds = myDeTaiList.map(dt => dt._id);

//         const listDangKy = await DangKy.find({
//             de_tai: { $in: deTaiIds },
//             trang_thai: { $in: ['dang_thuc_hien', 'da_hoan_thanh'] }
//         })
//         .populate('sinh_vien', 'ma_so ho_ten email')
//         .populate('de_tai', 'ten_de_tai');

//         const result = [];
//         for (const dk of listDangKy) {
//             const lastBaoCao = await BaoCao.findOne({ dang_ky: dk._id }).sort({ submitted_at: -1 });
//             const bangDiem = await BangDiem.findOne({ dang_ky: dk._id });
//             result.push({
//                 dangKy: dk,
//                 lastBaoCao,
//                 bangDiem
//             });
//         }

//         res.json(result);
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi server:', error: error.message });
//     }
// };

// exports.chamDiem = async (req, res) => {
//     try {
//         const { dang_ky_id, diem_huong_dan, nhan_xet_huong_dan } = req.body;
//         const diemNum = Number(diem_huong_dan);

//         if (isNaN(diemNum) || diemNum < 0 || diemNum > 10) {
//             return res.status(400).json({ message: 'Điểm số phải nằm trong khoảng 0 đến 10!' });
//         }

//         let bangDiem = await BangDiem.findOne({ dang_ky: dang_ky_id });
//         if (bangDiem) {
//             bangDiem.diem_huong_dan = diemNum;
//             bangDiem.nhan_xet_huong_dan = nhan_xet_huong_dan || '';
//             bangDiem.diem_tong_ket = diemNum;
//             await bangDiem.save();
//         } else {
//             bangDiem = new BangDiem({
//                 dang_ky: dang_ky_id,
//                 diem_huong_dan: diemNum,
//                 nhan_xet_huong_dan: nhan_xet_huong_dan || '',
//                 diem_tong_ket: diemNum
//             });
//             await bangDiem.save();
//         }

//         await DangKy.findByIdAndUpdate(dang_ky_id, { trang_thai: 'da_hoan_thanh' });

//         res.json({ message: 'Lưu điểm và nhận xét thành công!', bangDiem });
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi server:', error: error.message });
//     }
// };

// // --- 6. PHÂN HỆ GIẢNG VIÊN: DUYỆT GIA HẠN ---
// exports.getGVListGiaHan = async (req, res) => {
//     try {
//         const myDeTaiList = await DeTai.find({ giang_vien: req.user.id }).select('_id');
//         const deTaiIds = myDeTaiList.map(dt => dt._id);
//         const dangKyList = await DangKy.find({ de_tai: { $in: deTaiIds } }).select('_id');
//         const dangKyIds = dangKyList.map(dk => dk._id);

//         const listGiaHan = await YeuCauGiaHan.find({ dang_ky: { $in: dangKyIds } })
//             .populate({
//                 path: 'dang_ky',
//                 populate: [
//                     { path: 'sinh_vien', select: 'ma_so ho_ten email' },
//                     { path: 'de_tai', select: 'ten_de_tai' }
//                 ]
//             })
//             .sort({ createdAt: -1 });

//         res.json(listGiaHan);
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi server:', error: error.message });
//     }
// };

// exports.duyetGiaHan = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { trang_thai, phan_hoi_giang_vien } = req.body;

//         const giaHan = await YeuCauGiaHan.findById(id);
//         if (!giaHan) return res.status(404).json({ message: 'Không tìm thấy yêu cầu gia hạn!' });

//         giaHan.trang_thai = trang_thai;
//         if (phan_hoi_giang_vien) giaHan.phan_hoi_giang_vien = phan_hoi_giang_vien;
//         await giaHan.save();

//         res.json({ message: trang_thai === 'da_duyet' ? 'Đã chấp nhận gia hạn!' : 'Đã từ chối gia hạn!' });
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi server:', error: error.message });
//     }
// };


const DangKy = require('../models/DangKy');
const DeTai = require('../models/DeTai');
const BaoCao = require('../models/BaoCao');
const BangDiem = require('../models/BangDiem');
const YeuCauGiaHan = require('../models/YeuCauGiaHan');
const DotDoAn = require('../models/DotDoAn');
const path = require('path');

// --- 1. PHÂN HỆ SINH VIÊN: ĐĂNG KÝ ĐỀ TÀI ---
exports.dangKyDeTai = async (req, res) => {
    try {
        const { de_tai_id } = req.body;
        const sinh_vien_id = req.user.id;

        // Kiểm tra SV đã có đề tài active chưa
        const activeRegistration = await DangKy.findOne({
            sinh_vien: sinh_vien_id,
            trang_thai: { $in: ['cho_duyet', 'dang_thuc_hien', 'da_hoan_thanh'] }
        });

        if (activeRegistration) {
            return res.status(400).json({ message: 'Bạn đã đăng ký một đề tài trong hệ thống!' });
        }

        const deTai = await DeTai.findById(de_tai_id);
        if (!deTai) return res.status(404).json({ message: 'Không tìm thấy đề tài!' });
        if (deTai.trang_thai === 'da_khoa') {
            return res.status(400).json({ message: 'Đề tài này đã khóa nhận sinh viên!' });
        }

        const countAccepted = await DangKy.countDocuments({ de_tai: de_tai_id, trang_thai: 'dang_thuc_hien' });
        if (countAccepted >= deTai.so_luong_sv_toi_da) {
            return res.status(400).json({ message: 'Đề tài đã nhận đủ số lượng sinh viên tối đa!' });
        }

        const newDangKy = new DangKy({
            sinh_vien: sinh_vien_id,
            de_tai: de_tai_id,
            trang_thai: 'cho_duyet'
        });
        await newDangKy.save();

        res.status(201).json({ message: 'Đăng ký đề tài thành công! Vui lòng chờ Giảng viên duyệt.', dang_ky: newDangKy });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

// Sinh viên xem thông tin đề tài & tiến độ của mình
exports.getMyStatus = async (req, res) => {
    try {
        const dangKy = await DangKy.findOne({
            sinh_vien: req.user.id,
            trang_thai: { $in: ['cho_duyet', 'dang_thuc_hien', 'da_hoan_thanh'] }
        })
        .populate({
            path: 'de_tai',
            populate: [
                { path: 'giang_vien', select: 'ho_ten email so_dien_thoai ma_so' },
                { path: 'dot_do_an' }
            ]
        });

        if (!dangKy) return res.json({ hasProject: false });

        const listBaoCao = await BaoCao.find({ dang_ky: dangKy._id }).sort({ submitted_at: -1 });
        const bangDiem = await BangDiem.findOne({ dang_ky: dangKy._id });
        const listGiaHan = await YeuCauGiaHan.find({ dang_ky: dangKy._id }).sort({ createdAt: -1 });

        res.json({
            hasProject: true,
            dangKy,
            listBaoCao,
            bangDiem,
            listGiaHan
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

// --- 2. PHÂN HỆ SINH VIÊN: NỘP BÁO CÁO (MULTER) ---
exports.nopBaoCao = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Vui lòng đính kèm tệp báo cáo!' });

        const dangKy = await DangKy.findOne({ sinh_vien: req.user.id, trang_thai: 'dang_thuc_hien' })
            .populate({ path: 'de_tai', populate: { path: 'dot_do_an' } });

        if (!dangKy) return res.status(400).json({ message: 'Bạn chưa có đề tài được duyệt hoặc đã hoàn thành!' });

        // Kiểm tra hạn nộp báo cáo (hoặc hạn gia hạn đã được duyệt)
        const dot = dangKy.de_tai.dot_do_an;
        let effectiveDeadline = new Date(dot.han_nop_bao_cao);

        const approvedGiaHan = await YeuCauGiaHan.findOne({ dang_ky: dangKy._id, trang_thai: 'da_duyet' }).sort({ han_nop_moi_de_xuat: -1 });
        if (approvedGiaHan) effectiveDeadline = new Date(approvedGiaHan.han_nop_moi_de_xuat);

        if (new Date() > effectiveDeadline) {
            return res.status(400).json({ message: `Đã quá hạn nộp báo cáo (${effectiveDeadline.toLocaleString('vi-VN')})!` });
        }

        const count = await BaoCao.countDocuments({ dang_ky: dangKy._id });
        const newBaoCao = new BaoCao({
            dang_ky: dangKy._id,
            file_url: `/uploads/${req.file.filename}`,
            ten_file_goc: req.file.originalname,
            kich_thuoc: req.file.size,
            lan_nop: count + 1,
            submitted_at: new Date()
        });
        await newBaoCao.save();

        res.status(201).json({ message: `Nộp báo cáo lần ${newBaoCao.lan_nop} thành công!`, bao_cao: newBaoCao });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

// --- 3. PHÂN HỆ SINH VIÊN: XIN GIA HẠN ---
exports.guiYeuCauGiaHan = async (req, res) => {
    try {
        const { ly_do, han_nop_moi_de_xuat } = req.body;
        const dangKy = await DangKy.findOne({ sinh_vien: req.user.id, trang_thai: 'dang_thuc_hien' });

        if (!dangKy) return res.status(400).json({ message: 'Bạn không có đề tài đang thực hiện!' });

        const newYeuCau = new YeuCauGiaHan({
            dang_ky: dangKy._id,
            ly_do,
            han_nop_moi_de_xuat
        });
        await newYeuCau.save();

        res.status(201).json({ message: 'Gửi yêu cầu xin gia hạn thành công!', yeu_cau: newYeuCau });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

// --- 4. PHÂN HỆ GIẢNG VIÊN: DUYỆT ĐĂNG KÝ ---
exports.getGVDanhSachDangKy = async (req, res) => {
    try {
        const myDeTaiList = await DeTai.find({ giang_vien: req.user.id }).select('_id');
        const deTaiIds = myDeTaiList.map(dt => dt._id);

        const list = await DangKy.find({ de_tai: { $in: deTaiIds } })
            .populate('sinh_vien', 'ma_so ho_ten email so_dien_thoai')
            .populate('de_tai', 'ten_de_tai so_luong_sv_toi_da trang_thai')
            .sort({ createdAt: -1 });

        res.json(list);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

exports.duyetDangKy = async (req, res) => {
    try {
        const { id } = req.params;
        const { trang_thai, ly_do_huy } = req.body;

        const dangKy = await DangKy.findById(id).populate('de_tai');
        if (!dangKy) return res.status(404).json({ message: 'Không tìm thấy đăng ký!' });

        if (trang_thai === 'dang_thuc_hien') {
            const countAccepted = await DangKy.countDocuments({ de_tai: dangKy.de_tai._id, trang_thai: 'dang_thuc_hien' });
            if (countAccepted >= dangKy.de_tai.so_luong_sv_toi_da) {
                return res.status(400).json({ message: `Đề tài đã đủ tối đa ${dangKy.de_tai.so_luong_sv_toi_da} sinh viên!` });
            }
        }

        dangKy.trang_thai = trang_thai;
        if (ly_do_huy) dangKy.ly_do_huy = ly_do_huy;
        await dangKy.save();

        res.json({ message: trang_thai === 'dang_thuc_hien' ? 'Đã DUYỆT sinh viên!' : 'Đã TỪ CHỐI sinh viên!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

// --- 5. PHÂN HỆ GIẢNG VIÊN: CHẤM ĐIỂM ---
exports.getGVListChamDiem = async (req, res) => {
    try {
        const myDeTaiList = await DeTai.find({ giang_vien: req.user.id }).select('_id');
        const deTaiIds = myDeTaiList.map(dt => dt._id);

        const listDangKy = await DangKy.find({
            de_tai: { $in: deTaiIds },
            trang_thai: { $in: ['dang_thuc_hien', 'da_hoan_thanh'] }
        })
        .populate('sinh_vien', 'ma_so ho_ten email so_dien_thoai')
        .populate({
            path: 'de_tai',
            select: 'ten_de_tai mo_ta',
            populate: { path: 'dot_do_an', select: 'ten_dot nam_hoc hoc_ky han_nop_bao_cao' }
        });

        const result = [];
        for (const dk of listDangKy) {
            const listBaoCao = await BaoCao.find({ dang_ky: dk._id }).sort({ submitted_at: -1 });
            const bangDiem = await BangDiem.findOne({ dang_ky: dk._id });
            result.push({
                dangKy: dk,
                lastBaoCao: listBaoCao[0] || null,
                listBaoCao,
                bangDiem
            });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

exports.chamDiem = async (req, res) => {
    try {
        const { dang_ky_id, diem_huong_dan, nhan_xet_huong_dan } = req.body;
        const diemNum = Number(diem_huong_dan);

        if (isNaN(diemNum) || diemNum < 0 || diemNum > 10) {
            return res.status(400).json({ message: 'Điểm số phải nằm trong khoảng 0 đến 10!' });
        }

        let bangDiem = await BangDiem.findOne({ dang_ky: dang_ky_id });
        if (bangDiem) {
            bangDiem.diem_huong_dan = diemNum;
            bangDiem.nhan_xet_huong_dan = nhan_xet_huong_dan || '';
            bangDiem.diem_tong_ket = diemNum;
            await bangDiem.save();
        } else {
            bangDiem = new BangDiem({
                dang_ky: dang_ky_id,
                diem_huong_dan: diemNum,
                nhan_xet_huong_dan: nhan_xet_huong_dan || '',
                diem_tong_ket: diemNum
            });
            await bangDiem.save();
        }

        await DangKy.findByIdAndUpdate(dang_ky_id, { trang_thai: 'da_hoan_thanh' });

        res.json({ message: 'Lưu điểm và nhận xét thành công!', bangDiem });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

// --- 6. PHÂN HỆ GIẢNG VIÊN: DUYỆT GIA HẠN ---
exports.getGVListGiaHan = async (req, res) => {
    try {
        const myDeTaiList = await DeTai.find({ giang_vien: req.user.id }).select('_id');
        const deTaiIds = myDeTaiList.map(dt => dt._id);
        const dangKyList = await DangKy.find({ de_tai: { $in: deTaiIds } }).select('_id');
        const dangKyIds = dangKyList.map(dk => dk._id);

        const listGiaHan = await YeuCauGiaHan.find({ dang_ky: { $in: dangKyIds } })
            .populate({
                path: 'dang_ky',
                populate: [
                    { path: 'sinh_vien', select: 'ma_so ho_ten email' },
                    { path: 'de_tai', select: 'ten_de_tai' }
                ]
            })
            .sort({ createdAt: -1 });

        res.json(listGiaHan);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

exports.duyetGiaHan = async (req, res) => {
    try {
        const { id } = req.params;
        const { trang_thai, phan_hoi_giang_vien } = req.body;

        const giaHan = await YeuCauGiaHan.findById(id);
        if (!giaHan) return res.status(404).json({ message: 'Không tìm thấy yêu cầu gia hạn!' });

        giaHan.trang_thai = trang_thai;
        if (phan_hoi_giang_vien) giaHan.phan_hoi_giang_vien = phan_hoi_giang_vien;
        await giaHan.save();

        res.json({ message: trang_thai === 'da_duyet' ? 'Đã chấp nhận gia hạn!' : 'Đã từ chối gia hạn!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};