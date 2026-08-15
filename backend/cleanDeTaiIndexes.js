require('dotenv').config();
const mongoose = require('mongoose');

async function cleanDeTaiIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Đã kết nối MongoDB thành công.');

        const deTaiCollection = mongoose.connection.collection('detais');

        const beforeIndexes = await deTaiCollection.indexes();
        console.log('📋 Danh sách index hiện tại:', beforeIndexes.map(i => i.name));

        await deTaiCollection.dropIndexes();
        console.log('🗑️ Đã xóa toàn bộ index cũ!');

        const DeTai = require('./models/DeTai');
        await DeTai.syncIndexes();
        console.log('✨ Đã đồng bộ lại index chuẩn!');

        const afterIndexes = await deTaiCollection.indexes();
        console.log('🎉 Danh sách index mới chuẩn:', afterIndexes.map(i => i.name));

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

cleanDeTaiIndexes();