/* js/transactions.js */

const idUser = localStorage.getItem("user_id") || 1;
const jobUser = localStorage.getItem("user_job");
document.getElementById("user-name").innerText = localStorage.getItem("user_name");

// 1. Tải danh sách giao dịch
async function loadHistory() {
    // Đổi avatar cho đồng bộ trước
    const imgEl = document.querySelector('.avatar-circle img');
    if (imgEl && jobUser) {
        if (jobUser === 'Sinh Viên') imgEl.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135755.png';
        else if (jobUser === 'Nhân viên văn phòng') imgEl.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        else if (jobUser === 'Freelancer') imgEl.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png';
        else if (jobUser === 'Nội trợ') imgEl.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135823.png';
    }

    try {
        const res = await fetch(`http://localhost:3000/api/transactions/history?userId=${idUser}`);
        const data = await res.json();
        
        const tbody = document.getElementById('table-body');
        tbody.innerHTML = ''; 

        if (data.success && data.data.length > 0) {
            data.data.forEach(item => {
                const tr = document.createElement('tr');
                
                const date = new Date(item.NgayGiaoDich).toLocaleDateString('vi-VN');
                const money = item.SoTien.toLocaleString('vi-VN') + ' đ';
                const badgeClass = item.LoaiGiaoDich === 'Thu' ? 'badge-income' : 'badge-expense';
                const sign = item.LoaiGiaoDich === 'Thu' ? '+' : '-';
                const color = item.LoaiGiaoDich === 'Thu' ? '#1cc88a' : '#e74a3b';

                tr.innerHTML = `
                    <td>${date}</td>
                    <td style="font-weight:bold;">${item.TenDanhMuc}</td>
                    <td style="color:#666;">${item.GhiChu || '-'}</td>
                    <td><span class="badge ${badgeClass}">${item.LoaiGiaoDich}</span></td>
                    <td style="color:${color}; font-weight:bold;">${sign} ${money}</td>
                    <td style="text-align: center;">
                        <button class="btn-delete" onclick="xoaGiaoDich(${item.MaGiaoDich})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Chưa có dữ liệu nào!</td></tr>';
        }
    } catch (err) { console.error(err); }
}

// 2. Xóa giao dịch
async function xoaGiaoDich(maGD) {
    if (confirm("Bạn có chắc chắn muốn xóa dòng này không?")) {
        try {
            const res = await fetch('http://localhost:3000/api/transaction/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: maGD })
            });

            const data = await res.json();
            if (data.success) {
                alert("Đã xóa thành công!");
                loadHistory(); 
            } else {
                alert("Lỗi: " + data.message);
            }
        } catch (err) { alert("Lỗi kết nối server!"); }
    }
}

// --- KHỞI CHẠY ---
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});