const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;

const app = express();
const port = 4000;

// File paths
const dataFilePath = path.join(__dirname, 'products.json');
const ordersFilePath = path.join(__dirname, 'orders.json');
const checkoutFilePath = path.join(__dirname, 'checkout.json');
const preCheckoutFilePath = path.join(__dirname, 'pre_checkout.json');
const historyCookingFilePath = path.join(__dirname, 'history_cooking.json');


app.use(express.json());

module.exports = { splitOrdersToPreOrders };

// API lấy tất cả đơn hàng từ orders.json
app.get('/api/orders', (req, res) => {
    fs.readFile(ordersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Lỗi khi lấy đơn hàng.' });
        }
        const orders = JSON.parse(data);
        res.json(orders);
    });
});

// API để hoàn tất thanh toán, chuyển đơn hàng sang history_checkout.json
app.post('/api/checkout', (req, res) => {
    const orderId = req.body.orderId;

    // Đọc file orders.json để tìm đơn hàng
    fs.readFile(ordersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Lỗi khi đọc file đơn hàng.' });
        }
        let orders = JSON.parse(data);
        const order = orders.find(o => o.id === orderId);

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        }

        // Đọc file history_checkout.json để lưu đơn hàng đã thanh toán
        fs.readFile(historyCheckoutFilePath, 'utf8', (err, historyData) => {
            if (err && err.code !== 'ENOENT') {
                return res.status(500).json({ message: 'Lỗi khi đọc lịch sử thanh toán.' });
            }

            let historyOrders = [];
            if (historyData) {
                historyOrders = JSON.parse(historyData);
            }

            // Thêm đơn hàng vào lịch sử thanh toán
            historyOrders.push(order);

            // Ghi lại vào history_checkout.json
            fs.writeFile(historyCheckoutFilePath, JSON.stringify(historyOrders, null, 2), 'utf8', err => {
                if (err) {
                    return res.status(500).json({ message: 'Lỗi khi ghi lịch sử thanh toán.' });
                }

                // Xóa đơn hàng khỏi orders.json sau khi đã thanh toán
                orders = orders.filter(o => o.id !== orderId);
                fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8', err => {
                    if (err) {
                        return res.status(500).json({ message: 'Lỗi khi cập nhật đơn hàng.' });
                    }

                    res.json({ message: 'Đã thanh toán thành công!' });
                });
            });
        });
    });
});


// Đọc dữ liệu từ orders.json
const readOrders = async () => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'orders.json'), 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading orders file:', err);
        throw err;
    }
};

// Cập nhật dữ liệu vào orders.json
const writeOrders = async (orders) => {
    try {
        await fs.writeFile(path.join(__dirname, 'orders.json'), JSON.stringify(orders, null, 2));
    } catch (err) {
        console.error('Error writing orders file:', err);
        throw err;
    }
};

// Tìm kiếm đơn hàng theo ID phòng/bàn
app.get('/orders/search', async (req, res) => {
    try {
        const roomId = req.query.room;
        const tableId = req.query.table;

        let orders = await readOrders();

        if (roomId) {
            orders = orders.filter(order => order.room === roomId);
        }

        if (tableId) {
            orders = orders.filter(order => order.table === tableId);
        }

        res.json(orders);
    } catch (err) {
        console.error('Error processing search request:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Xóa món theo ID đơn hàng và ID món
app.delete('/orders/:orderId/items/:itemId', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const itemId = req.params.itemId;

        let orders = await readOrders();
        orders = orders.map(order => {
            if (order.id === orderId) {
                order.items = order.items.filter(item => item.id !== itemId);
            }
            return order;
        });

        await writeOrders(orders);
        res.status(200).send('Item deleted');
        await splitOrdersToPreOrders();
    } catch (err) {
        console.error('Error deleting item:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Cập nhật số lượng món theo ID đơn hàng, ID món và số lượng mới
app.put('/orders/:orderId/items/:itemId', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const itemId = req.params.itemId;
        const newQuantity = req.body.quantity;

        let orders = await readOrders();
        orders = orders.map(order => {
            if (order.id === orderId) {
                order.items = order.items.map(item => {
                    if (item.id === itemId) {
                        item.quantity = newQuantity;
                    }
                    return item;
                });
            }
            return order;
        });

        await writeOrders(orders);
        res.status(200).send('Item quantity updated');
        await splitOrdersToPreOrders();
    } catch (err) {
        console.error('Error updating item quantity:', err);
        res.status(500).send('Internal Server Error');
    }
});


async function splitOrdersToPreOrders() {
    try {
        const orders = await readData(ordersFilePath);
        let preCheckoutData = [];

        orders.forEach(order => {
            order.items.forEach(item => {
                preCheckoutData.push({
                    id: order.id,
                    items: [item],
                    room: order.room,
                    table: order.table,
                    timestamp: order.timestamp,
                    addedAt: new Date().toISOString() // Thêm trường thời gian khi thêm vào pre_checkout.json
                });
            });
        });

        // Sắp xếp dữ liệu theo trường addedAt
        preCheckoutData.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));

        await writeData(preCheckoutFilePath, preCheckoutData);
    } catch (error) {
        console.error('Error splitting orders:', error);
    }
}


// Thêm route mới
app.post('/split-orders', async (req, res) => {
    const { id, updates } = req.body;

    if (!id || !updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: 'Dữ liệu đầu vào không hợp lệ' });
    }

    try {
        const orders = await readData(ordersFilePath);
        const preCheckoutData = await readData(preCheckoutFilePath);

        // Tìm đơn hàng cần cập nhật
        const orderIndex = orders.findIndex(order => order.id === id);
        if (orderIndex === -1) {
            return res.status(404).json({ message: 'Đơn hàng không tìm thấy' });
        }

        // Cập nhật số lượng hoặc xóa món ăn trong đơn hàng
        const order = orders[orderIndex];
        updates.forEach(update => {
            const itemIndex = order.items.findIndex(item => item.id === update.itemId);
            if (itemIndex !== -1) {
                if (update.action === 'update') {
                    // Cập nhật số lượng món ăn
                    order.items[itemIndex].quantity = update.newQuantity;
                } else if (update.action === 'delete') {
                    // Xóa món ăn
                    order.items.splice(itemIndex, 1);
                }
            }
        });

        // Nếu không còn món ăn nào trong đơn hàng, xóa đơn hàng
        if (order.items.length === 0) {
            orders.splice(orderIndex, 1);
        } else {
            // Cập nhật đơn hàng
            orders[orderIndex] = order;
        }

        // Tạo dữ liệu mới cho pre_checkout
        const newPreCheckoutData = [];
        order.items.forEach(item => {
            newPreCheckoutData.push({
                id: order.id,
                items: [item],
                room: order.room,
                table: order.table,
                timestamp: order.timestamp,
                addedAt: new Date().toISOString() // Thêm thời gian khi thêm vào pre_checkout.json
            });
        });

        // Thêm các mục mới vào pre_checkout
        preCheckoutData.push(...newPreCheckoutData);

        // Sắp xếp theo addedAt
        preCheckoutData.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));

        // Cập nhật tệp tin
        await writeData(ordersFilePath, orders);
        await writeData(preCheckoutFilePath, preCheckoutData);

        res.json({ message: 'Dữ liệu đã được tách và lưu vào pre_checkout.json' });
    } catch (error) {
        console.error('Lỗi khi xử lý đơn hàng:', error);
        res.status(500).json({ message: 'Lỗi khi xử lý đơn hàng' });
    }
});




function mergeItems(existingItems, newItems) {
    const itemMap = new Map();

    // Add existing items to the map
    existingItems.forEach(item => itemMap.set(item.id, item));

    // Update the map with new items
    newItems.forEach(item => {
        if (itemMap.has(item.id)) {
            // Update quantity if item already exists
            const existingItem = itemMap.get(item.id);
            existingItem.quantity = (existingItem.quantity || 0) + (item.quantity || 0);
        } else {
            // Add new item if it does not exist
            itemMap.set(item.id, item);
        }
    });

    // Convert the map back to an array
    return Array.from(itemMap.values());
}


// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'images');
        fs.mkdir(uploadDir, { recursive: true }).then(() => {
            cb(null, uploadDir);
        }).catch(err => cb(err));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});
const upload = multer({ storage });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Helper functions
async function readData(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // Return empty array if file doesn't exist
        }
        throw error;
    }
}

async function writeData(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        throw error;
    }
}

// API routes
app.get('/orders.json', async (req, res) => {
    try {
        const data = await fs.readFile(ordersFilePath, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).send('Error reading orders file');
    }
});

app.post('/update-precheckout', async (req, res) => {
    const { key, itemId } = req.body;

    try {
        const preCheckoutData = await readData(preCheckoutFilePath);

        const order = preCheckoutData.find(order => order.room === key || order.table === key);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const item = order.items.find(i => i.id === itemId);
        if (item) {
            item.done = true;
            await writeData(preCheckoutFilePath, preCheckoutData);
            res.json({ message: 'Dish marked as done' });
        } else {
            res.status(404).json({ message: 'Dish not found' });
        }
    } catch (error) {
        console.error(error); // Ghi log lỗi chi tiết
        res.status(500).json({ message: error.message });
    }
});

app.post('/submit-order', async (req, res) => {
    const { id, items, room, table } = req.body;

    if (!id || !items || !Array.isArray(items)) {
        return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    const newOrder = {
        id: id,
        items: items,
        room: room || null,
        table: table || null,
        timestamp: new Date().toISOString()
    };

    try {
        const orders = await readData(ordersFilePath);
        const existingOrderIndex = orders.findIndex(order => order.room === room && order.table === table);
        
        if (existingOrderIndex !== -1) {
            const existingOrder = orders[existingOrderIndex];
            existingOrder.items = mergeItems(existingOrder.items, newOrder.items);
            existingOrder.timestamp = newOrder.timestamp;
            orders[existingOrderIndex] = existingOrder;
        } else {
            orders.push(newOrder);
        }

        await writeData(ordersFilePath, orders);

        // Gọi hàm để tách đơn hàng và lưu vào pre_checkout.json
        await splitOrdersToPreOrders();

        res.json({ success: true });
    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});



app.post('/remove-precheckout', async (req, res) => {
    const { key } = req.body;

    try {
        let preCheckoutData = await readData(preCheckoutFilePath);

        preCheckoutData = preCheckoutData.filter(order => order.room !== key && order.table !== key);
        await writeData(preCheckoutFilePath, preCheckoutData);

        res.json({ message: 'Order removed from pre_checkout' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/update-checkout', async (req, res) => {
    const { key, itemId } = req.body;

    try {
        const checkoutData = await readData(checkoutFilePath);

        const order = checkoutData.find(o => o.room === key || o.table === key);
        if (order) {
            const item = order.items.find(i => i.id === itemId);
            if (item) {
                item.done = true; // Mark item as done
            }
        } else {
            // Add new order if not found
            checkoutData.push({
                room: key,
                items: [{ id: itemId, done: true }]
            });
        }

        await writeData(checkoutFilePath, checkoutData);

        res.json({ message: 'Item updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Thêm vào cuối mã server.js
app.post('/complete-item', async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'Thiếu id' });
    }

    try {
        const preCheckoutData = await readData(preCheckoutFilePath);
        const historyCookingData = await readData(historyCookingFilePath);

        // Tìm đơn hàng trong pre_checkout
        const itemIndex = preCheckoutData.findIndex(item => item.id === id);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Không tìm thấy món ăn trong pre_checkout' });
        }

        // Lấy món ăn hoàn thành và xóa khỏi pre_checkout
        const completedItem = preCheckoutData.splice(itemIndex, 1)[0];

        // Thêm món ăn vào history_cooking
        historyCookingData.push({
            id: completedItem.id,
            room: completedItem.room,  // Thêm phòng nếu có
            table: completedItem.table,  // Thêm bàn nếu có
            items: completedItem.items,  // Thêm thông tin món ăn
            timestamp: new Date().toISOString()
        });

        // Cập nhật dữ liệu trong tệp
        await writeData(preCheckoutFilePath, preCheckoutData);
        await writeData(historyCookingFilePath, historyCookingData);

        res.json({ message: 'Món ăn đã được đánh dấu hoàn thành' });
    } catch (error) {
        console.error('Lỗi khi hoàn thành món ăn:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi hoàn thành món ăn' });
    }
});



app.post('/submit-order', async (req, res) => {
    const { id, items, room, table } = req.body;

    // Kiểm tra đầu vào
    if (!id || !items || !Array.isArray(items)) {
        return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    const newOrder = {
        id: id,
        items: items,
        room: room || null,
        table: table || null,
        timestamp: new Date().toISOString()
    };

    try {
        // Đọc dữ liệu từ orders.json
        const orders = await readData(ordersFilePath);

        // Tìm đơn hàng có cùng room hoặc table
        const existingOrderIndex = orders.findIndex(order => order.room === room && order.table === table);
        
        if (existingOrderIndex !== -1) {
            // Cập nhật đơn hàng hiện có
            const existingOrder = orders[existingOrderIndex];
            existingOrder.items = mergeItems(existingOrder.items, newOrder.items); // Cộng dồn số lượng sản phẩm
            existingOrder.timestamp = newOrder.timestamp;
            orders[existingOrderIndex] = existingOrder;
        } else {
            // Thêm đơn hàng mới nếu chưa tồn tại
            orders.push(newOrder);
        }

        // Ghi dữ liệu vào orders.json
        await writeData(ordersFilePath, orders);

        res.json({ success: true });
    } catch (error) {
        console.error('Error processing order:', error); // Log lỗi chi tiết
        res.status(500).json({ success: false, message: 'Server error' });
    }
});



app.get('/cooking-orders', async (req, res) => {
    try {
        const preCheckoutData = await readData(preCheckoutFilePath);
        res.json(preCheckoutData);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/products', async (req, res) => {
    try {
        const products = await readData(dataFilePath);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/upload', upload.single('productImage'), async (req, res) => {
    const { productName, productPrice, productCategory } = req.body;
    const productImage = req.file ? req.file.filename : '';

    const newProduct = {
        id: Date.now(),
        name: productName,
        price: productPrice,
        category: productCategory,
        image: `/images/${productImage}`
    };

    try {
        const products = await readData(dataFilePath);
        products.push(newProduct);
        await writeData(dataFilePath, products);
        res.json(newProduct);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

