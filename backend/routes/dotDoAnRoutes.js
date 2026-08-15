const express = require('express');
const router = express.Router();
const {
    getAllDotDoAn,
    createDotDoAn,
    updateDotDoAn,
    deleteDotDoAn,
    toggleTrangThaiDot
} = require('../controllers/dotDoAnController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getAllDotDoAn);
router.post('/', verifyToken, checkRole('admin'), createDotDoAn);
router.put('/:id', verifyToken, checkRole('admin'), updateDotDoAn);
router.put('/:id/toggle', verifyToken, checkRole('admin'), toggleTrangThaiDot);
router.delete('/:id', verifyToken, checkRole('admin'), deleteDotDoAn);

module.exports = router;