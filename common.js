/* common.js - Chứa các hàm dùng chung cho mọi trang */

// 1. LOGIC KIỂM TRA ĐĂNG NHẬP (Bảo vệ)
// Đoạn này sẽ chạy ngay lập tức khi trang web load
(function checkLogin() {
    // Nếu không tìm thấy ID người dùng trong kho
    const userId = localStorage.getItem("user_id");
    
    // Và nếu đang KHÔNG ở trang login hay trang chủ (để tránh vòng lặp vô tận)
    const path = window.location.pathname;
    const isPublicPage = path.includes("login.html") || path.includes("index.html");

    if (!userId && !isPublicPage) {
        // Đá về trang đăng nhập ngay lập tức
        alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
        window.location.href = "login.html";
    }
})();

// 2. HÀM ĐĂNG XUẤT
function dangXuat() {
    // Hỏi lại cho chắc
    if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi MyWallet?")) {
        
        // Xóa sạch mọi thứ trong kho
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_job");
        // Hoặc dùng localStorage.clear() nếu muốn xóa sạch sành sanh
        
        // Chuyển hướng về trang Đăng nhập (hoặc trang chủ index.html tùy bạn)
        window.location.href = "login.html";
    }
}