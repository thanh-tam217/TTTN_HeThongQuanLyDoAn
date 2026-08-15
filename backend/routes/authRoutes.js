const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getAllUsers,
    getNextMaSo,
    updateUser,
    deleteUser
} = require('../controllers/authController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/next-ma-so/:vai_tro', verifyToken, checkRole('admin'), getNextMaSo);
router.post('/register', verifyToken, checkRole('admin'), register);
// router.post('/register', register);
router.get('/users', verifyToken, checkRole('admin'), getAllUsers);
router.put('/users/:id', verifyToken, updateUser);
router.delete('/users/:id', verifyToken, checkRole('admin'), deleteUser);

module.exports = router;