/* js/report.js */

const idUser = localStorage.getItem("user_id") || 1;
document.getElementById("user-name").innerText = localStorage.getItem("user_name");

let myChart = null;    // Biểu đồ tròn
let myBarChart = null; // Biểu đồ cột

// Mặc định chọn tháng hiện tại khi mở trang
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
document.getElementById('month-picker').value = `${yyyy}-${mm}`;

// 1. HÀM CHÍNH: TẢI BÁO CÁO
async function taiBaoCao() {
    const picker = document.getElementById('month-picker').value; 
    const [year, month] = picker.split('-');

    try {
        // A. Gọi API Biểu đồ tròn
        const res1 = await fetch(`http://localhost:3000/api/report/expense-by-category?userId=${idUser}&month=${month}&year=${year}`);
        const data1 = await res1.json();
        if(data1.success) veBieuDoTron(data1.data);

        // B. Gọi API Hạn mức
        const res2 = await fetch(`http://localhost:3000/api/report/budget-comparison?userId=${idUser}&month=${month}&year=${year}`);
        const data2 = await res2.json();
        if(data2.success) veBieuDoCot(data2.data);

    } catch (err) { console.error("Lỗi tải báo cáo:", err); }
}

// 2. VẼ BIỂU ĐỒ TRÒN
function veBieuDoTron(dulieu) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    const labels = dulieu.map(item => item.TenDanhMuc);
    const values = dulieu.map(item => item.TongTien);

    if (myChart) myChart.destroy(); // Xóa cũ

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let value = context.raw;
                            let total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            let percentage = ((value / total) * 100).toFixed(1) + '%';
                            return `${context.label}: ${value.toLocaleString('vi-VN')} đ (${percentage})`;
                        }
                    }
                }
            }
        }
    });
}

// 3. VẼ BIỂU ĐỒ CỘT
function veBieuDoCot(dulieu) {
    const ctx = document.getElementById('barChart').getContext('2d');
    const labels = dulieu.map(item => item.TenDanhMuc);
    const dataHanMuc = dulieu.map(item => item.SoTienHanMuc);
    const dataThucTe = dulieu.map(item => item.ThucTe);

    if (myBarChart) myBarChart.destroy(); // Xóa cũ

    myBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Thực tế đã tiêu',
                    data: dataThucTe,
                    backgroundColor: '#e74a3b',
                    borderRadius: 5,
                },
                {
                    label: 'Hạn mức cho phép',
                    data: dataHanMuc,
                    backgroundColor: '#e0e0e0',
                    borderRadius: 5,
                    barPercentage: 0.9, 
                    categoryPercentage: 0.8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

// 4. LOGIC MODAL (CÀI HẠN MỨC)
async function moModal() {
    document.getElementById('budgetModal').style.display = 'flex';
    try {
        const res = await fetch(`http://localhost:3000/api/categories?userId=${idUser}&type=Chi`);
        const data = await res.json();
        const select = document.getElementById('budget-category');
        select.innerHTML = '';
        if(data.success) {
            data.data.forEach(item => {
                let opt = document.createElement('option');
                opt.value = item.MaDanhMuc;
                opt.text = item.TenDanhMuc;
                select.appendChild(opt);
            });
        }
    } catch(err) { console.error(err); }
}

function dongModal() {
    document.getElementById('budgetModal').style.display = 'none';
}

async function luuHanMuc() {
    const danhMuc = document.getElementById('budget-category').value;
    const tien = document.getElementById('budget-amount').value;
    const picker = document.getElementById('month-picker').value; 
    const [year, month] = picker.split('-');

    if(!tien) { alert("Nhập tiền đi bạn!"); return; }

    try {
        const res = await fetch('http://localhost:3000/api/budget/set', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                MaNguoiDung: idUser,
                MaDanhMuc: danhMuc,
                SoTienHanMuc: tien,
                Thang: month,
                Nam: year
            })
        });

        const data = await res.json();
        if(data.success) {
            alert("Đã lưu thành công!");
            dongModal();
            taiBaoCao();
        } else {
            alert("Lỗi: " + data.message);
        }
    } catch(err) { alert("Lỗi kết nối!"); }
}

// --- KHỞI CHẠY ---
document.addEventListener('DOMContentLoaded', () => {
    taiBaoCao();
});