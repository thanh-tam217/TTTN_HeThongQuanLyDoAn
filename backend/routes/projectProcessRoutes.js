const express = require('express');
const router = express.Router();
const {
    dangKyDeTai,
    getMyStatus,
    nopBaoCao,
    guiYeuCauGiaHan,
    getGVDanhSachDangKy,
    duyetDangKy,
    getGVListChamDiem,
    chamDiem,
    getGVListGiaHan,
    duyetGiaHan
} = require('../controllers/projectProcessController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Sinh viên
router.post('/dang-ky', verifyToken, checkRole('sinh_vien'), dangKyDeTai);
router.get('/my-status', verifyToken, checkRole('sinh_vien'), getMyStatus);
router.post('/nop-bao-cao', verifyToken, checkRole('sinh_vien'), upload.single('file_bao_cao'), nopBaoCao);
router.post('/xin-gia-han', verifyToken, checkRole('sinh_vien'), guiYeuCauGiaHan);

// Giảng viên
router.get('/gv-dang-ky', verifyToken, checkRole('giang_vien'), getGVDanhSachDangKy);
router.put('/duyet-dang-ky/:id', verifyToken, checkRole('giang_vien'), duyetDangKy);
router.get('/gv-cham-diem', verifyToken, checkRole('giang_vien'), getGVListChamDiem);
router.post('/cham-diem', verifyToken, checkRole('giang_vien'), chamDiem);
router.get('/gv-gia-han', verifyToken, checkRole('giang_vien'), getGVListGiaHan);
router.put('/duyet-gia-han/:id', verifyToken, checkRole('giang_vien'), duyetGiaHan);

module.exports = router;