const express = require('express');
const router = express.Router();
const {
    getDanhSachDeTai,
    getMyDeTai,
    createDeTai,
    updateDeTai,
    deleteDeTai,
    toggleKhoaDeTai
} = require('../controllers/deTaiController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getDanhSachDeTai);
router.get('/my-de-tai', verifyToken, checkRole('giang_vien'), getMyDeTai);
router.post('/', verifyToken, checkRole('giang_vien'), createDeTai);
router.put('/:id', verifyToken, checkRole('giang_vien'), updateDeTai);
router.put('/:id/toggle-khoa', verifyToken, checkRole('giang_vien'), toggleKhoaDeTai);
router.delete('/:id', verifyToken, checkRole('giang_vien'), deleteDeTai);

module.exports = router;