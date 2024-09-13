document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Kiểm tra thông tin đăng nhập (có thể là thông tin tạm thời)
    if (username === 'admin' && password === '12345') {
        // Đăng nhập thành công, chuyển hướng đến trang nhập sản phẩm mới
        window.location.href = 'manage_products.html';
    } else {
        // Hiển thị thông báo lỗi
        document.getElementById('error').textContent = 'Invalid username or password.';
    }
});
