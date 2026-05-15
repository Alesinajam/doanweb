/* js/input.js */

// --- CẤU HÌNH CHUNG ---
const idUser = localStorage.getItem("user_id") || 1;
const jobUser = localStorage.getItem("user_job");
const tenUser = localStorage.getItem("user_name");

// Biến toàn cục theo dõi trạng thái
let loaiHienTai = 'Chi';

// 1. Khởi tạo giao diện (Header, Avatar, Ngày tháng)
function initPage() {
    // Hiển thị tên
    document.getElementById("user-name").innerText = tenUser || "Người dùng";
    
    // Chọn sẵn ngày hôm nay
    document.getElementById('date').valueAsDate = new Date(); 

    // Đổi avatar theo nghề nghiệp
    const imgEl = document.querySelector('.avatar-circle img');
    if (imgEl) {
        if (jobUser === 'Sinh Viên') imgEl.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135755.png';
        else if (jobUser === 'Nhân viên văn phòng') imgEl.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        else if (jobUser === 'Freelancer') imgEl.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png';
        else if (jobUser === 'Nội trợ') imgEl.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135823.png';
    }
}

// 2. Chuyển chế độ Thu/Chi
function chuyenCheDo(loai) {
    loaiHienTai = loai;
    if (loai === 'Chi') {
        document.getElementById('btn-chi').classList.add('active-expense');
        document.getElementById('btn-thu').classList.remove('active-income');
        
        const btn = document.getElementById('btn-save');
        btn.className = 'btn-submit btn-expense';
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Lưu Khoản Chi';
    } else {
        document.getElementById('btn-thu').classList.add('active-income');
        document.getElementById('btn-chi').classList.remove('active-expense');
        
        const btn = document.getElementById('btn-save');
        btn.className = 'btn-submit btn-income';
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Lưu Khoản Thu';
    }
    taiDanhMuc(loai);
}

// 3. Tải danh mục từ API
async function taiDanhMuc(loai) {
    try {
        const res = await fetch(`http://localhost:3000/api/categories?userId=${idUser}&type=${loai}`);
        const data = await res.json();
        const select = document.getElementById('category');
        select.innerHTML = ''; 
        
        if (data.success && data.data.length > 0) {
            data.data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.MaDanhMuc;
                option.text = item.TenDanhMuc;
                select.appendChild(option);
            });
        } else {
            select.innerHTML = '<option>Chưa có danh mục</option>';
        }
    } catch (err) { console.error(err); }
}

// 4. Lưu giao dịch
async function luuGiaoDich() {
    const tien = document.getElementById('amount').value;
    const danhMuc = document.getElementById('category').value;
    const ngay = document.getElementById('date').value;
    const ghiChu = document.getElementById('note').value;

    if (!tien || !danhMuc) { alert("Thiếu thông tin rồi!"); return; }

    try {
        const res = await fetch('http://localhost:3000/api/transaction/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                MaNguoiDung: idUser,
                MaDanhMuc: danhMuc,
                SoTien: tien,
                GhiChu: ghiChu,
                NgayGiaoDich: ngay
            })
        });

        const data = await res.json();
        if (data.success) {
            alert("Lưu thành công!");
            document.getElementById('amount').value = ''; 
            document.getElementById('note').value = '';   
        } else {
            alert("Lỗi: " + data.message);
        }
    } catch (err) { alert("Lỗi kết nối!"); }
}

// --- KHỞI CHẠY KHI TRANG TẢI XONG ---
document.addEventListener('DOMContentLoaded', () => {
    initPage();
    chuyenCheDo('Chi'); // Mặc định vào là tab Chi
});