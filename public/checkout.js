document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const roomId = document.getElementById('roomSelect').value;
        const tableId = document.getElementById('tableSelect').value;

        if (roomId || tableId) {
            let query = '';
            if (roomId) query += `room=${encodeURIComponent(roomId)}`;
            if (tableId) {
                if (query) query += '&';
                query += `table=${encodeURIComponent(tableId)}`;
            }

            // Fetch đơn hàng dựa trên room/table
            fetch(`/orders/search?${query}`)
                .then(response => response.json())
                .then(data => displayOrders(data))
                .catch(error => console.error('Lỗi:', error));
        } else {
            alert('Vui lòng chọn phòng hoặc bàn!');
        }
    });
});

function displayOrders(orders) {
    const orderDetails = document.getElementById('orderDetails');
    if (!orderDetails) {
        console.error('Phần tử với ID "orderDetails" không tìm thấy');
        return;
    }
    orderDetails.innerHTML = ''; // Xóa nội dung cũ

    let totalQuantity = 0;
    let totalAmount = 0;

    orders.forEach(order => {
        // Tính tổng số lượng và số tiền cho từng đơn hàng
        let orderTotalAmount = 0;

        const orderDiv = document.createElement('div');
        orderDiv.classList.add('order');
        orderDiv.innerHTML = `
            <h3>Đơn hàng ID: ${order.id}</h3>
            ${order.items.map(item => {
                orderTotalAmount += item.price * item.quantity;
                return `
                    <div class="item">
                        <p>${item.name} - ${item.quantity} x ${formatCurrency(item.price)}</p>
                    </div>
                `;
            }).join('')}
            <button class="complete-payment" data-order-id="${order.id}" data-total-amount="${orderTotalAmount}">Thanh toán</button>
            <button class="cancel-payment" data-order-id="${order.id}">Hủy thanh toán</button>
            <hr>
        `;
        orderDetails.appendChild(orderDiv);

        // Cộng dồn tổng số lượng và tổng tiền của các đơn hàng
        totalQuantity += order.items.reduce((sum, item) => sum + item.quantity, 0);
        totalAmount += orderTotalAmount;
    });

    // Hiển thị tổng số lượng và tổng tiền cho tất cả các đơn hàng
    const summaryDiv = document.createElement('div');
    summaryDiv.classList.add('order-summary');
    summaryDiv.innerHTML = `
        <div>Tổng số lượng: ${totalQuantity}</div>
        <div>Tổng tiền: ${formatCurrency(totalAmount)}</div>
    `;
    orderDetails.appendChild(summaryDiv);

    // Thêm sự kiện cho các nút thanh toán và hủy
    document.querySelectorAll('.complete-payment').forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            const totalAmount = this.getAttribute('data-total-amount');
            openPaymentDialog(orderId, totalAmount);  // Mở hộp thoại thanh toán với tổng tiền chính xác
        });
    });

    document.querySelectorAll('.cancel-payment').forEach(button => {
        button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            cancelPayment(orderId);
        });
    });
}

function formatCurrency(amount) {
    // Chuyển đổi số tiền thành chuỗi với định dạng tiền Việt Nam
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

function openPaymentDialog(orderId, totalAmount) {
    const paymentDialog = document.getElementById('paymentDialog');
    paymentDialog.style.display = 'block';  // Hiển thị hộp thoại thanh toán

    // Hiển thị tổng tiền trong hộp thoại thanh toán
    document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);

    // Sự kiện xác nhận thanh toán
    document.getElementById('confirmPayment').addEventListener('click', () => {
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        if (paymentMethod === 'cash') {
            const cashAmount = parseFloat(document.getElementById('cashAmount').value);
            if (cashAmount >= totalAmount) {
                const change = cashAmount - totalAmount;
                document.getElementById('change').textContent = formatCurrency(change);
                document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);
                completePayment(orderId);  // Hoàn tất thanh toán
            } else {
                alert('Số tiền khách đưa không đủ!');
            }
        } else if (paymentMethod === 'bankTransfer') {
            // Hiển thị mã QR cho chuyển khoản (có thể tích hợp hiển thị QR ở đây)
            completePayment(orderId);  // Hoàn tất thanh toán
        }
        paymentDialog.style.display = 'none';  // Đóng hộp thoại
    });

    // Hủy bỏ hộp thoại thanh toán
    document.getElementById('cancelPaymentDialog').addEventListener('click', () => {
        paymentDialog.style.display = 'none';
    });
}

function completePayment(orderId) {
    // Xử lý thanh toán đơn hàng
    fetch(`/orders/${orderId}/complete`, { method: 'POST' })
        .then(response => response.text())
        .then(message => {
            alert('Đơn hàng ID: ' + orderId + ' đã được thanh toán!');
            document.getElementById('searchForm').dispatchEvent(new Event('submit')); // Tìm kiếm lại để cập nhật trạng thái đơn hàng
        })
        .catch(error => console.error('Lỗi khi thanh toán:', error));
}

function cancelPayment(orderId) {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
        fetch(`/orders/${orderId}/cancel`, { method: 'POST' })
            .then(response => response.text())
            .then(message => {
                alert('Đơn hàng ID: ' + orderId + ' đã bị hủy!');
                document.getElementById('searchForm').dispatchEvent(new Event('submit')); // Tìm kiếm lại để cập nhật trạng thái đơn hàng
            })
            .catch(error => console.error('Lỗi khi hủy đơn hàng:', error));
    }
}
