const fs = require('fs').promises;
const path = require('path');

const ordersFilePath = path.join(__dirname, 'orders.json');

async function readOrders() {
    try {
        const data = await fs.readFile(ordersFilePath, 'utf8');
        const orders = JSON.parse(data);

        if (!Array.isArray(orders)) {
            throw new Error('Dữ liệu đơn hàng không phải là mảng');
        }

        return orders;
    } catch (error) {
        console.error('Lỗi khi đọc dữ liệu đơn hàng:', error.message);
        throw error;
    }
}

async function writeOrders(orders) {
    try {
        await fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2));
    } catch (error) {
        console.error('Lỗi khi ghi dữ liệu đơn hàng:', error.message);
        throw error;
    }
}

module.exports = { readOrders, writeOrders };
