require('dotenv').config();
const mongoose = require('mongoose');

async function cleanDangKyIndex() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Đã kết nối MongoDB.');

        const collection = mongoose.connection.collection('dangkies');
        const indexes = await collection.indexes();
        console.log('Indexes hiện tại của dangkies:', indexes.map(i => i.name));

        const hasIndex = indexes.some(i => i.name === 'sinh_vien_1');
        if (hasIndex) {
            await collection.dropIndex('sinh_vien_1');
            console.log('🎉 ĐÃ XÓA INDEX sinh_vien_1 UNIQUE CŨ THÀNH CÔNG!');
        } else {
            console.log('ℹ️ Không có index sinh_vien_1.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

cleanDangKyIndex();