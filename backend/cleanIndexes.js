require('dotenv').config();
const mongoose = require('mongoose');

async function cleanAllOldIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Đã kết nối MongoDB thành công.');

        const usersCollection = mongoose.connection.collection('users');

        // Lấy danh sách index trước khi xóa
        const beforeIndexes = await usersCollection.indexes();
        console.log('📋 Danh sách index hiện tại:', beforeIndexes.map(i => i.name));

        // Xóa tất cả index (trừ index mặc định _id_)
        await usersCollection.dropIndexes();
        console.log('🗑️ Đã xóa toàn bộ index cũ!');

        // Yêu cầu Mongoose build lại đúng các index định nghĩa trong User.js (ma_so_1, email_1)
        const User = require('./models/User');
        await User.syncIndexes();
        console.log('✨ Đã đồng bộ lại index chuẩn (ma_so, email)!');

        const afterIndexes = await usersCollection.indexes();
        console.log('🎉 Danh sách index mới chuẩn:', afterIndexes.map(i => i.name));

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

cleanAllOldIndexes();