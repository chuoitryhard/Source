// kitchen.js

async function fetchOrders() {
    try {
        const response = await fetch('/cooking-orders');
        const orders = await response.json();
        
        // Sắp xếp đơn hàng theo thời gian thêm vào (từ cũ đến mới)
        orders.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        return orders;
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

function displayOrders(orders) {
    const orderList = document.getElementById('orderList');
    orderList.innerHTML = ''; // Xóa nội dung cũ

    orders.forEach((order, index) => {
        // Tạo các phần tử đơn hàng
        const orderItem = document.createElement('div');
        orderItem.classList.add('order-item');
        
        // Tạo tiêu đề đơn hàng
        const orderHeader = document.createElement('div');
        orderHeader.classList.add('order-header');
        orderHeader.innerHTML = `<h2>Đơn hàng ${index + 1}</h2><span>Thời gian thêm: ${new Date(order.timestamp).toLocaleString()}</span>`;
        
        // Tạo chi tiết đơn hàng
        const orderDetails = document.createElement('div');
        orderDetails.classList.add('order-item-details');
        orderDetails.innerHTML = order.items.map(item => 
            `<h3>${order.room || 'N/A'}</h3><h3>${order.table || 'N/A'}</h3><span>${item.name}: ${item.quantity}</span>`).join('');
        
        // Tạo nút hoàn thành
        const completeButton = document.createElement('button');
        completeButton.classList.add('complete-button');
        completeButton.textContent = 'Hoàn thành';
        completeButton.onclick = async () => {
            try {
                const response = await fetch('/complete-item', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: order.id }) // Sửa key từ 'orderId' thành 'id'
                });

                if (response.ok) {
                    alert('Đơn hàng đã hoàn thành');
                    fetchAndDisplayOrders(); // Tự động làm mới dữ liệu sau khi hoàn thành
                } else {
                    alert('Lỗi khi hoàn thành đơn hàng');
                }
            } catch (error) {
                console.error('Error completing item:', error);
            }
        };

        orderItem.appendChild(orderHeader);
        orderItem.appendChild(orderDetails);
        orderItem.appendChild(completeButton);
        orderList.appendChild(orderItem);
    });
}

async function fetchAndDisplayOrders() {
    const orders = await fetchOrders();
    displayOrders(orders);
}

// Làm mới dữ liệu mỗi 1 giây
setInterval(fetchAndDisplayOrders, 1000);

// Lần đầu tiên tải dữ liệu ngay lập tức khi trang được mở
fetchAndDisplayOrders();
