document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchForm').addEventListener('submit', function(event) {
        event.preventDefault();
        fetch('header.html')
                .then(response => response.text())
                .then(data => {
                    document.getElementById('header-placeholder').innerHTML = data;
                })
                .catch(error => console.error('Error loading header:', error));
        const roomId = document.getElementById('roomSelect').value;
        const tableId = document.getElementById('tableSelect').value;

        fetch(`/orders/search?room=${roomId}&table=${tableId}`)
            .then(response => response.json())
            .then(data => displayOrders(data))
            .catch(error => console.error('Error:', error));
    });
});

function displayOrders(orders) {
    const orderDetails = document.getElementById('orderDetails');
    orderDetails.innerHTML = ''; // Xóa nội dung cũ

    orders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.classList.add('order');
        orderDiv.innerHTML = `<h3>${order.id}</h3>`;

        order.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('item');
            itemDiv.innerHTML = `
                <p>${item.name} - ${item.quantity} x ${item.price}</p>
                <button class="delete" onclick="deleteItem('${order.id}', '${item.id}')">Xóa</button>
                <button onclick="showUpdateQuantity('${order.id}', '${item.id}')">Cập nhật số lượng</button>
            `;
            orderDiv.appendChild(itemDiv);
        });

        orderDetails.appendChild(orderDiv);
    });
}

function deleteItem(orderId, itemId) {
    fetch(`/orders/${orderId}/items/${itemId}`, {
        method: 'DELETE'
    })
    .then(response => response.text())
    .then(message => {
        alert(message);
        document.getElementById('searchForm').dispatchEvent(new Event('submit'));
    })
    .catch(error => console.error('Error:', error));
}

function showUpdateQuantity(orderId, itemId) {
    const newQuantity = prompt('Nhập số lượng mới:');
    if (newQuantity) {
        updateItemQuantity(orderId, itemId, parseInt(newQuantity));
    }
}

function updateItemQuantity(orderId, itemId, quantity) {
    fetch(`/orders/${orderId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
    })
    .then(response => response.text())
    .then(message => {
        alert(message);
        document.getElementById('searchForm').dispatchEvent(new Event('submit'));
    })
    .catch(error => console.error('Error:', error));
}
