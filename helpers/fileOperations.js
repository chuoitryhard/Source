const fs = require('fs').promises;

// Đọc dữ liệu từ tệp JSON
async function readData(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // Nếu tệp không tồn tại, trả về mảng rỗng
        }
        throw error;
    }
}

// Ghi dữ liệu vào tệp JSON
async function writeData(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        throw error;
    }
}

module.exports = { readData, writeData };
