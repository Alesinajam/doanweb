/* js/profile.js */

const idUser = localStorage.getItem("user_id") || 1;
const jobUser = localStorage.getItem("user_job");

// 1. Tải thông tin hồ sơ
async function loadProfile() {
    // A. Cập nhật Avatar trên Header trước cho đẹp
    const headerImg = document.querySelector('.header .avatar-circle img');
    if (headerImg && jobUser) {
        if (jobUser === 'Sinh Viên') headerImg.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135755.png';
        else if (jobUser === 'Nhân viên văn phòng') headerImg.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        else if (jobUser === 'Freelancer') headerImg.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png';
        else if (jobUser === 'Nội trợ') headerImg.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135823.png';
    }

    try {
        const res = await fetch(`http://localhost:3000/api/profile?id=${idUser}`);
        const data = await res.json();

        if (data.success) {
            // B. Điền dữ liệu vào form
            document.getElementById('username').value = data.data.TenDangNhap;
            document.getElementById('fullname').value = data.data.HoTen || '';
            document.getElementById('job').value = data.data.NgheNghiep || '';
            document.getElementById("welcome-message").innerHTML = `Xin chào, <b>${data.data.HoTen || 'Bạn'}</b>`;

            // C. Đổi Avatar ở giữa trang
            const imgElement = document.querySelector('.profile-card img'); 
            const job = data.data.NgheNghiep;

            if (job === 'Sinh Viên') imgElement.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135755.png';
            else if (job === 'Nhân viên văn phòng') imgElement.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
            else if (job === 'Freelancer') imgElement.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png';
            else if (job === 'Nội trợ') imgElement.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135823.png';
        }
    } catch (err) { console.error(err); }
}

// 2. Lưu thay đổi hồ sơ
async function capNhatHoSo() {
    const hoTenMoi = document.getElementById('fullname').value;
    const ngheNghiepMoi = document.getElementById('job').value;

    if(!hoTenMoi) { alert("Vui lòng nhập họ tên!"); return; }

    try {
        const res = await fetch('http://localhost:3000/api/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                MaNguoiDung: idUser,
                HoTen: hoTenMoi,
                NgheNghiep: ngheNghiepMoi
            })
        });
        
        const data = await res.json();
        if (data.success) {
            alert("Cập nhật thành công!");
            localStorage.setItem("user_name", hoTenMoi);
            localStorage.setItem("user_job", ngheNghiepMoi);
            location.reload(); 
        } else {
            alert("Lỗi: " + data.message);
        }
    } catch (err) { alert("Lỗi kết nối server!"); }
}

// 3. Xử lý Đổi Mật Khẩu
function moModalPassword() {
    document.getElementById('passwordModal').style.display = 'flex';
}

async function doiMatKhau() {
    const cu = document.getElementById('old-pass').value;
    const moi = document.getElementById('new-pass').value;

    if (!cu || !moi) { alert("Vui lòng nhập đủ thông tin!"); return; }

    try {
        const res = await fetch('http://localhost:3000/api/profile/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                MaNguoiDung: idUser,
                MatKhauCu: cu,
                MatKhauMoi: moi
            })
        });

        const data = await res.json();
        if (data.success) {
            alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
            localStorage.clear();
            window.location.href = "login.html";
        } else {
            alert("Lỗi: " + data.message);
        }
    } catch (err) { alert("Lỗi kết nối!"); }
}

// --- KHỞI CHẠY ---
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
});