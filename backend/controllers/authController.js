const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function generateRandomPassword(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Tự động sinh mã số tiếp theo ĐẢM BẢO KHÔNG BAO GIỜ TRÙNG
exports.getNextMaSo = async (req, res) => {
    try {
        const { vai_tro } = req.params;
        let prefix = 'SV';
        if (vai_tro === 'giang_vien') prefix = 'GV';
        if (vai_tro === 'admin') prefix = 'AD';

        // Lấy tất cả mã số bắt đầu bằng tiền tố đó trên TOÀN BỘ database
        const users = await User.find({ ma_so: new RegExp(`^${prefix}`, 'i') }, 'ma_so');
        let maxNumber = 0;

        users.forEach(u => {
            if (u.ma_so) {
                const numMatch = u.ma_so.match(/\d+/);
                if (numMatch) {
                    const num = parseInt(numMatch[0], 10);
                    if (!isNaN(num) && num > maxNumber) {
                        maxNumber = num;
                    }
                }
            }
        });

        let nextNum = maxNumber + 1;
        let candidateMaSo = `${prefix}${String(nextNum).padStart(6, '0')}`;

        // Kiểm tra chắc chắn mã số này chưa từng tồn tại trên toàn DB
        let exists = await User.findOne({ ma_so: candidateMaSo });
        while (exists) {
            nextNum++;
            candidateMaSo = `${prefix}${String(nextNum).padStart(6, '0')}`;
            exists = await User.findOne({ ma_so: candidateMaSo });
        }

        res.json({ nextMaSo: candidateMaSo });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tính mã số:', error: error.message });
    }
};

exports.register = async (req, res) => {
    try {
        const { ma_so, ho_ten, email, vai_tro, so_dien_thoai, mat_khau } = req.body;

        if (!ma_so || !ho_ten || !email || !vai_tro) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ các thông tin bắt buộc!' });
        }

        // Kiểm tra trùng Email
        const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({ message: `Email "${email}" đã tồn tại trên hệ thống!` });
        }

        // Kiểm tra trùng Mã số
        const existingMaSo = await User.findOne({ ma_so: ma_so.trim() });
        if (existingMaSo) {
            return res.status(400).json({ message: `Mã số "${ma_so}" đã tồn tại trên hệ thống!` });
        }

        // Tạo mật khẩu băm
        const rawPassword = mat_khau && mat_khau.trim() !== '' ? mat_khau.trim() : generateRandomPassword(8);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        const newUser = new User({
            ma_so: ma_so.trim(),
            ho_ten: ho_ten.trim(),
            email: email.trim().toLowerCase(),
            vai_tro,
            so_dien_thoai: so_dien_thoai ? so_dien_thoai.trim() : '',
            mat_khau: hashedPassword,
            trang_thai: true
        });

        await newUser.save();

        res.status(201).json({
            message: 'Cấp tài khoản thành công!',
            raw_password: rawPassword,
            user: { 
                id: newUser._id, 
                ma_so: newUser.ma_so, 
                ho_ten: newUser.ho_ten, 
                email: newUser.email, 
                vai_tro: newUser.vai_tro 
            }
        });
    } catch (error) {
        console.error('Lỗi khi đăng ký tài khoản:', error);
        // Xử lý lỗi trùng index từ MongoDB
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0];
            return res.status(400).json({ message: `Dữ liệu bị trùng lặp: ${field === 'email' ? 'Email' : 'Mã số'} này đã được sử dụng!` });
        }
        res.status(500).json({ message: error.message || 'Lỗi hệ thống khi tạo tài khoản!' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, mat_khau } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });

        if (!user.trang_thai) return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa!' });

        const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
        if (!isMatch) return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác!' });

        const token = jwt.sign(
            { id: user._id, vai_tro: user.vai_tro },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user._id,
                ma_so: user.ma_so,
                ho_ten: user.ho_ten,
                email: user.email,
                vai_tro: user.vai_tro,
                so_dien_thoai: user.so_dien_thoai
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-mat_khau').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { ho_ten, email, vai_tro, so_dien_thoai, mat_khau_moi } = req.body;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });

        user.ho_ten = ho_ten || user.ho_ten;
        user.email = email || user.email;
        user.vai_tro = vai_tro || user.vai_tro;
        user.so_dien_thoai = so_dien_thoai !== undefined ? so_dien_thoai : user.so_dien_thoai;

        if (mat_khau_moi && mat_khau_moi.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            user.mat_khau = await bcrypt.hash(mat_khau_moi, salt);
        }

        await user.save();
        res.json({ message: 'Cập nhật tài khoản thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await User.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
        res.json({ message: 'Xóa tài khoản thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server:', error: error.message });
    }
};