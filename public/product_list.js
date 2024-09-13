document.addEventListener('DOMContentLoaded', () => {
    const openSidebarButton = document.getElementById('openSidebarButton');
    const closeSidebarButton = document.getElementById('closeSidebarButton');
    const sidebar = document.getElementById('rightSidebar');

    // Xử lý sự kiện mở sidebar
    openSidebarButton.addEventListener('click', () => {
        sidebar.classList.add('open');
        openSidebarButton.classList.add('hidden');
    });

    // Xử lý sự kiện đóng sidebar
    closeSidebarButton.addEventListener('click', () => {
        sidebar.classList.remove('open');
        openSidebarButton.classList.remove('hidden');
    });

    // Load header từ file header.html
    fetch('header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Error loading header:', error));

    // Fetch sản phẩm và danh mục
    fetch('/products')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(products => {
            const categoryList = document.getElementById('categoryList');

            // Lưu các danh mục
            const categories = new Set();
            products.forEach(product => {
                categories.add(product.category);
            });

            // Hiển thị các danh mục
            categories.forEach(category => {
                const categoryDiv = document.createElement('div');
                categoryDiv.innerHTML = `
                    <label>
                        <input type="checkbox" class="category-filter" value="${category}"> ${category}
                    </label>
                `;
                categoryList.appendChild(categoryDiv);
            });

            // Hiển thị sản phẩm
            displayProducts(products);

            // Xử lý sự kiện tìm kiếm
            document.getElementById('searchInput').addEventListener('input', filterProducts);

            // Xử lý sự kiện lọc theo danh mục
            document.querySelectorAll('.category-filter').forEach(checkbox => {
                checkbox.addEventListener('change', filterProducts);
            });
        })
        .catch(error => console.error('Error fetching products:', error));

    // Tải danh sách phòng và bàn
    loadRoomsAndTables();
});

// Định dạng tiền tệ theo chuẩn Việt Nam
function formatCurrency(number) {
    return number.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

// Hàm để lọc và hiển thị sản phẩm
function filterProducts() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const selectedCategories = Array.from(document.querySelectorAll('.category-filter:checked')).map(cb => cb.value);

    fetch('/products')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(products => {
            const filteredProducts = products.filter(product => {
                const matchesSearch = product.name.toLowerCase().includes(searchValue);
                const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);

                return matchesSearch && matchesCategory;
            });

            displayProducts(filteredProducts);
        })
        .catch(error => console.error('Error filtering products:', error));
}



// Hàm để hiển thị sản phẩm
function displayProducts(products) {
    const productList = document.getElementById('productList');
    productList.innerHTML = ''; // Xóa nội dung cũ

    products.forEach(product => {
        const productDiv = document.createElement('div');
        const formattedPrice = parseInt(product.price).toLocaleString('vi-VN'); // Format the price with spaces every three digits
        productDiv.classList.add('product-item');
        productDiv.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>Giá: ${formattedPrice} Đồng</p>
            <p>Danh mục: ${product.category}</p>
            <button class="order-button" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">Đặt hàng</button>
        `;
        productList.appendChild(productDiv);
    });

    // Thêm sự kiện cho các nút "Đặt hàng"
    document.querySelectorAll('.order-button').forEach(button => {
        button.addEventListener('click', handleOrderButtonClick);
    });
}

const selectedItems = [];

// Xử lý sự kiện khi nút "Order" được nhấn
function handleOrderButtonClick(event) {
    const button = event.target;
    const productId = button.getAttribute('data-id');
    const productName = button.getAttribute('data-name');
    const productPrice = parseFloat(button.getAttribute('data-price'));

    const existingItem = selectedItems.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        selectedItems.push({ id: productId, name: productName, price: productPrice, quantity: 1 });
    }

    showRightSidebar();
    updateSelectedItemsList();
}

// Hiển thị sidebar bên phải
function showRightSidebar() {
    document.getElementById('rightSidebar').style.display = 'block';
}

// Cập nhật danh sách món đã chọn trong sidebar
function updateSelectedItemsList() {
    const selectedItemsList = document.getElementById('selectedItemsList');
    selectedItemsList.innerHTML = '';

    let totalQuantity = 0;

    selectedItems.forEach((item, index) => {
        totalQuantity += item.quantity;

        const listItem = document.createElement('li');
        listItem.classList.add('product-item');
        listItem.innerHTML = `
            <div class="product-info">
                <span class="product-number">#${index + 1}</span>
                <span class="product-name">${item.name} - ${formatCurrency(item.price)}</span>
                <div class="quantity-controls">
                    <button data-id="${item.id}" class="decrease-button">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button data-id="${item.id}" class="increase-button">+</button>
                </div>
                <button data-id="${item.id}" class="remove-button">Xóa</button>
            </div>
        `;
        selectedItemsList.appendChild(listItem);
    });

    // Thêm tổng số lượng
    const totalQuantityDiv = document.createElement('div');
    totalQuantityDiv.classList.add('total-quantity');
    totalQuantityDiv.innerHTML = `Tổng số lượng: ${totalQuantity}`;
    selectedItemsList.appendChild(totalQuantityDiv);

    // Thêm tổng tiền
    const totalAmount = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalAmountDiv = document.createElement('div');
    totalAmountDiv.classList.add('total-amount');
    totalAmountDiv.innerHTML = `Tổng tiền: ${formatCurrency(totalAmount)}`;
    selectedItemsList.appendChild(totalAmountDiv);

    // Thêm sự kiện cho nút tăng/giảm số lượng và nút xóa
    document.querySelectorAll('.increase-button').forEach(button => {
        button.addEventListener('click', handleIncreaseQuantity);
    });
    document.querySelectorAll('.decrease-button').forEach(button => {
        button.addEventListener('click', handleDecreaseQuantity);
    });
    document.querySelectorAll('.remove-button').forEach(button => {
        button.addEventListener('click', handleRemoveItemClick);
    });
}

// Hàm để tăng số lượng sản phẩm
function handleIncreaseQuantity(event) {
    const productId = event.target.getAttribute('data-id');
    const item = selectedItems.find(item => item.id === productId);
    if (item) {
        item.quantity += 1;
        updateSelectedItemsList();
    }
}

function mergeItems(existingItems, newItems) {
    newItems.forEach(newItem => {
        const existingItem = existingItems.find(item => item.id === newItem.id);
        if (existingItem) {
            existingItem.quantity += newItem.quantity; // Cộng dồn số lượng sản phẩm
        } else {
            existingItems.push(newItem); // Thêm sản phẩm mới
        }
    });
    return existingItems;
}


// Hàm để giảm số lượng sản phẩm
function handleDecreaseQuantity(event) {
    const productId = event.target.getAttribute('data-id');
    const item = selectedItems.find(item => item.id === productId);
    if (item && item.quantity > 1) {
        item.quantity -= 1;
        updateSelectedItemsList();
    }
}

// Xóa món khỏi danh sách khi bấm vào nút "Remove"
function handleRemoveItemClick(event) {
    const productId = event.target.getAttribute('data-id');
    const index = selectedItems.findIndex(item => item.id === productId);

    if (index > -1) {
        selectedItems.splice(index, 1);
        updateSelectedItemsList();
    }
}



// Xóa toàn bộ đơn
document.getElementById('clearOrder').addEventListener('click', () => {
    selectedItems.length = 0;
    updateSelectedItemsList();
});

// Hoàn tất đơn
document.getElementById('finishOrder').addEventListener('click', () => {
    const selectedRoom = document.getElementById('roomSelect').value;
    const selectedTable = document.getElementById('tableSelect').value;
    const orderId = selectedTable || selectedRoom || Date.now(); // Sử dụng Date.now() nếu không chọn phòng hoặc bàn

    // Kiểm tra xem người dùng có chọn ít nhất một trong hai
    if (!selectedRoom && !selectedTable) {
        alert('Vui lòng chọn ít nhất một phòng hoặc bàn.');
        return;
    }

    if (selectedItems.length === 0) {
        alert('Vui lòng chọn ít nhất một sản phẩm.');
        return;
    }

    const orderData = {
        id: orderId,
        items: selectedItems,
        room: selectedRoom || null,
        table: selectedTable || null
    };

    // Gửi yêu cầu POST tới server
    fetch('/submit-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Phản hồi từ mạng không đúng');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('Đơn hàng đã được cập nhật thành công!');
            selectedItems.length = 0;
            document.getElementById('rightSidebar').style.display = 'none';
            location.reload();
        } else {
            alert('Có lỗi xảy ra khi đặt đơn hàng.');
        }
    })
    .catch(error => {
        console.error('Lỗi:', error);
        alert('Có lỗi xảy ra khi đặt đơn hàng.');
    });
});



// Tải danh sách phòng và bàn
function loadRoomsAndTables() {
    fetch('/rooms')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(rooms => {
            const roomSelect = document.getElementById('roomSelect');
            roomSelect.innerHTML = '<option value="">Chọn phòng</option>';
            rooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room.id;
                option.textContent = room.name;
                roomSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching rooms:', error));

    fetch('/tables')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(tables => {
            const tableSelect = document.getElementById('tableSelect');
            tableSelect.innerHTML = '<option value="">Chọn bàn</option>';
            tables.forEach(table => {
                const option = document.createElement('option');
                option.value = table.id;
                option.textContent = table.name;
                tableSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching tables:', error));
}

// Xử lý tìm kiếm đơn hàng
document.getElementById('searchOrderButton').addEventListener('click', () => {
    const selectedRoom = document.getElementById('searchRoomSelect').value;
    const selectedTable = document.getElementById('searchTableSelect').value;

    if (!selectedRoom && !selectedTable) {
        alert('Vui lòng chọn phòng hoặc bàn để tìm đơn.');
        return;
    }

    fetch('/orders')  // Giả sử bạn đang dùng API này để đọc file orders.json
        .then(response => response.json())
        .then(orders => {
            const foundOrder = orders.find(order => 
                order.room === selectedRoom || order.table === selectedTable
            );

            const orderSearchResult = document.getElementById('orderSearchResult');
            orderSearchResult.innerHTML = '';

            if (foundOrder) {
                // Hiển thị đơn hàng
                foundOrder.items.forEach((item, index) => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <div>
                            <span>#${index + 1}</span>
                            <span>${item.name} - ${formatCurrency(item.price)}</span>
                            <div>
                                <button class="decrease-button" data-id="${item.id}">-</button>
                                <span>${item.quantity}</span>
                                <button class="increase-button" data-id="${item.id}">+</button>
                            </div>
                            <button class="remove-button" data-id="${item.id}">Xóa</button>
                        </div>
                    `;
                    orderSearchResult.appendChild(listItem);
                });

                // Thêm sự kiện tăng/giảm số lượng và xóa món
                document.querySelectorAll('.increase-button').forEach(button => {
                    button.addEventListener('click', (event) => updateQuantity(event, foundOrder, 1));
                });
                document.querySelectorAll('.decrease-button').forEach(button => {
                    button.addEventListener('click', (event) => updateQuantity(event, foundOrder, -1));
                });
                document.querySelectorAll('.remove-button').forEach(button => {
                    button.addEventListener('click', (event) => removeItem(event, foundOrder));
                });
            } else {
                alert('Không tìm thấy đơn hàng cho phòng/bàn này.');
            }
        })
        .catch(error => {
            console.error('Lỗi tìm kiếm đơn hàng:', error);
        });
});
