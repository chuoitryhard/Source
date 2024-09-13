document.addEventListener('DOMContentLoaded', () => {
    // Tải danh sách sản phẩm khi trang được tải
    fetchProducts();

    // Xử lý gửi form tìm kiếm
    document.getElementById('searchForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const searchName = document.getElementById('searchName').value.toLowerCase();
        const searchCategory = document.getElementById('searchCategory').value;

        filterProducts(searchName, searchCategory);
    });

    // Xử lý gửi form
    document.getElementById('productForm').addEventListener('submit', function(event) {
        event.preventDefault();
        
        const formData = new FormData(this);
        const productId = formData.get('editProductId');
        const url = productId ? `/update/${productId}` : '/upload';
        
        fetch(url, {
            method: productId ? 'PUT' : 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            const notification = document.getElementById('notification');
            notification.style.display = 'block';

            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);

            fetchProducts(); // Tải lại danh sách sản phẩm sau khi thêm hoặc cập nhật
            document.getElementById('productForm').reset();
            document.getElementById('editProductId').value = '';
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });

    // Xử lý chuyển đến trang danh sách sản phẩm
    document.getElementById('viewProductList').addEventListener('click', () => {
        window.location.href = 'product_list.html';
    });
});

// Hàm để tải và hiển thị danh sách sản phẩm
function fetchProducts() {
    fetch('/products')
        .then(response => response.json())
        .then(products => {
            window.allProducts = products; // Lưu danh sách sản phẩm toàn bộ để sử dụng cho tìm kiếm
            filterProducts(); // Hiển thị toàn bộ sản phẩm ban đầu
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Hàm để lọc sản phẩm theo tên và danh mục
function filterProducts(name = '', category = '') {
    const filteredProducts = window.allProducts.filter(product => {
        const matchesName = product.name.toLowerCase().includes(name);
        const matchesCategory = category === '' || category === 'all' || product.category === category;

        return matchesName && matchesCategory;
    });

    displayProducts(filteredProducts);
}

// Hàm để hiển thị sản phẩm
function displayProducts(products) {
    const productInfo = document.getElementById('productInfo');
    productInfo.innerHTML = ''; // Xóa nội dung cũ

    if (products.length === 0) {
        productInfo.innerHTML = '<p>No products found.</p>'; // Hiển thị thông báo nếu không có sản phẩm
        return;
    }

    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.classList.add('product-item');
        productDiv.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>Price: ${product.price} Đồng</p>
            <p>Category: ${product.category}</p>
            <div class="product-buttons">
                <button class="edit-button" onclick="editProduct('${product.id}', '${product.name}', '${product.price}', '${product.image}')">Update</button>
                <button class="delete-button" onclick="deleteProduct('${product.id}')">Delete</button>
            </div>
        `;
        productInfo.appendChild(productDiv);
    });
}

// Hàm để chỉnh sửa sản phẩm
function editProduct(id, name, price, image) {
    document.getElementById('editProductId').value = id;
    document.getElementById('productName').value = name;
    document.getElementById('productPrice').value = price;
    // Không thể đặt giá trị cho input file qua JavaScript vì lý do bảo mật
}

// Hàm để xóa sản phẩm
function deleteProduct(id) {
    fetch(`/delete/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        fetchProducts(); // Cập nhật danh sách sản phẩm sau khi xóa
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
