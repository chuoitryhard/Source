document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('overlay');
    const popup = document.getElementById('popup');
    const popupMessage = document.getElementById('popupMessage');
    const orderButton = document.getElementById('orderButton'); // Nút "Đặt món"
    const finishOrderButton = document.getElementById('finishOrder'); // Nút "Thanh toán"
    const moveButton = document.getElementById('moveButton'); // Nút "Chuyển bàn"
    const closePopup = document.getElementById('closePopup'); // Nút "Đóng"

    let selectedElement = null;

    // Tải header từ header.html
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Lỗi khi tải header:', error));

    // Fetch dữ liệu JSON từ orders.json để kiểm tra đơn hàng
    fetch('/orders.json')
        .then(response => response.json())
        .then(orders => {
            const orderMap = new Map();
            
            // Tạo một bản đồ để tra cứu nhanh các đơn hàng
            orders.forEach(order => {
                const key = order.room || order.table;
                if (key) {
                    orderMap.set(key, order);
                }
            });

            // Xử lý nút phòng/bàn
            handleButtons(orderMap);
        })
        .catch(error => console.error('Lỗi khi tải đơn hàng:', error));

    // Hàm kiểm tra và đổi màu nút phòng/bàn
    function handleButtons(orderMap) {
        document.querySelectorAll('.grid-container button').forEach(button => {
            const id = button.dataset.id; // Lấy data-id của nút
            const order = orderMap.get(id);

            if (order) {
                button.classList.add('occupied'); // Đánh dấu nút đã chiếm
            } else {
                button.classList.add('available'); // Đánh dấu nút còn trống
            }

            // Thêm sự kiện click cho từng nút phòng/bàn
            button.addEventListener('click', () => {
                selectedElement = button;

                if (button.classList.contains('occupied')) {
                    popupMessage.textContent = `${button.textContent} đã có người.`;
                    
                    // Ẩn nút "Đặt món", hiện các nút "Chuyển bàn", "Thanh toán"
                    orderButton.classList.add('hidden');
                    finishOrderButton.classList.remove('hidden');
                    moveButton.classList.remove('hidden');
                } else {
                    popupMessage.textContent = `${button.textContent} còn trống.`;

                    // Hiện nút "Đặt món", ẩn các nút "Chuyển bàn", "Thanh toán"
                    orderButton.classList.remove('hidden');
                    finishOrderButton.classList.add('hidden');
                    moveButton.classList.add('hidden');
                }

                popup.classList.add('active');
                overlay.classList.add('active');
            });
        });
    }

    

    // Xử lý sự kiện click nút "Gọi món"
    orderButton.addEventListener('click', () => {
        if (selectedElement) {
            window.location.href = 'product_list.html'; // Điều hướng đến trang menu
        }
    });

    // Xử lý sự kiện click nút "Hoàn tất"
    finishOrderButton.addEventListener('click', () => {
        if (selectedElement) {
            selectedElement.classList.remove('available');
            selectedElement.classList.add('occupied');
            popupMessage.textContent = `${selectedElement.textContent} đã có người.`;
        }
    });

    // Xử lý sự kiện click nút "Chuyển phòng/bàn" (chưa triển khai)
    moveButton.addEventListener('click', () => {
        if (selectedElement) {
            alert('Chuyển phòng/bàn chưa được triển khai.');
        }
    });

    // Đóng popup
    closePopup.addEventListener('click', () => {
        popup.classList.remove('active');
        overlay.classList.remove('active');
        selectedElement = null;
    });
});
