/* js/auth.js - Xử lý Đăng nhập & Đăng ký */

// ==============================
// PHẦN 1: ĐĂNG NHẬP (LOGIN)
// ==============================
function login() {
    var tenNguoiDung = document.getElementById("username").value;
    var matKhau = document.getElementById("password").value;

    if (tenNguoiDung == "") {
        alert("Vui lòng nhập tên tài khoản!");
        return;
    }

    fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            TenDangNhap: tenNguoiDung,
            MatKhau: matKhau
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem("user_name", data.data.HoTen);
            localStorage.setItem("user_job", data.data.NgheNghiep);
            localStorage.setItem("user_id", data.data.MaNguoiDung);

            alert("Đăng nhập thành công!");
            window.location.href = "dashboard.html"; 
        } else {
            alert(data.message); 
        }
    })
    .catch(error => {
        console.error('Lỗi:', error);
        alert("Không kết nối được với Server Backend!");
    });
}

// ==============================
// PHẦN 2: ĐĂNG KÝ (REGISTER)
// ==============================
async function dangKy() {
    const hoten = document.getElementById('fullname').value;
    const nghe = document.getElementById('job').value;
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const rePass = document.getElementById('re-password').value;

    // 1. Kiểm tra nhập thiếu
    if (!hoten || !user || !pass) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    // 2. Kiểm tra mật khẩu khớp nhau
    if (pass !== rePass) {
        alert("Mật khẩu nhập lại không khớp!");
        return;
    }

    // 3. Gửi xuống Server
    try {
        const res = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                TenDangNhap: user,
                MatKhau: pass,
                HoTen: hoten,
                NgheNghiep: nghe
            })
        });

        const data = await res.json();

        if (data.success) {
            alert("Đăng ký thành công! Hãy đăng nhập ngay.");
            window.location.href = "login.html"; // Chuyển về trang đăng nhập
        } else {
            alert("Lỗi: " + data.message); // Ví dụ: Tên đăng nhập trùng
        }

    } catch (err) {
        alert("Lỗi kết nối server!");
        console.error(err);
    }
}

// ==============================
// PHẦN 3: TIỆN ÍCH (BẤM ENTER)
// ==============================
document.addEventListener('DOMContentLoaded', () => {
    // Xử lý Enter cho trang Đăng nhập
    const inputLoginPass = document.getElementById("password");
    if(inputLoginPass) {
        inputLoginPass.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                login();
            }
        });
    }

    // Xử lý Enter cho trang Đăng ký (ô nhập lại mật khẩu)
    const inputRegPass = document.getElementById("re-password");
    if(inputRegPass) {
        inputRegPass.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                dangKy();
            }
        });
    }
});