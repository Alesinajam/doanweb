/* js/dashboard.js */

// --- CẤU HÌNH CHUNG ---
const idUser = localStorage.getItem("user_id") || 1;
const tenUser = localStorage.getItem("user_name") || "Bạn";
const jobUser = localStorage.getItem("user_job");

// 1. Hiển thị thông tin User trên Header (Tên + Avatar theo nghề)
function initHeader() {
    document.getElementById("welcome-message").innerHTML = `Xin chào, <b>${tenUser}</b>`;
    
    // Logic đổi avatar
    const imgEl = document.querySelector('.avatar-circle img');
    if (jobUser === 'Sinh Viên') imgEl.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135755.png';
    else if (jobUser === 'Nhân viên văn phòng') imgEl.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    else if (jobUser === 'Freelancer') imgEl.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png';
    else if (jobUser === 'Nội trợ') imgEl.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135823.png';
}

// 2. Tải số liệu thống kê (3 ô màu)
async function loadStats() {
    try {
        const res = await fetch(`http://localhost:3000/api/dashboard?id=${idUser}`);
        const data = await res.json();

        if (data.success) {
            document.querySelector('.card-green p').innerText = data.tongThu.toLocaleString('vi-VN') + ' đ';
            document.querySelector('.card-red p').innerText = data.tongChi.toLocaleString('vi-VN') + ' đ';
            
            const elSoDu = document.querySelector('.card-blue p');
            elSoDu.innerText = data.soDu.toLocaleString('vi-VN') + ' đ';
            elSoDu.style.color = data.soDu < 0 ? 'red' : '#4e73df';
        }
    } catch (err) { console.error("Lỗi stats:", err); }
}

// 3. Tải 5 giao dịch gần nhất (Giao diện Chat Bubble)
async function loadRecent() {
    try {
        const res = await fetch(`http://localhost:3000/api/transactions/history?userId=${idUser}&limit=5`);
        const data = await res.json();
        
        const container = document.querySelector('.recent-transactions');
        
        if (data.success && data.data.length > 0) {
            container.innerHTML = '<h4><i class="fa-solid fa-clock-rotate-left"></i> Vừa mới nhập</h4>';
            
            // Tạo khung chứa danh sách (class chat-list từ style_chat.css)
            let divList = document.createElement('div');
            divList.className = 'chat-list';
            divList.style.flex = "1"; 
            divList.style.width = "100%";

            data.data.forEach(item => {
                let isThu = item.LoaiGiaoDich === 'Thu';
                let sign = isThu ? '+' : '-';
                let icon = isThu ? '<i class="fa-solid fa-arrow-down"></i>' : '<i class="fa-solid fa-cart-shopping"></i>';
                
                let itemDiv = document.createElement('div');
                itemDiv.className = `chat-item ${isThu ? 'income' : 'expense'}`;

                itemDiv.innerHTML = `
                    <div style="display:flex; align-items:center;">
                        <div class="chat-icon-box">${icon}</div>
                        <div class="chat-info">
                            <span class="chat-title">${item.TenDanhMuc}</span>
                            <span class="chat-date">${new Date(item.NgayGiaoDich).toLocaleDateString('vi-VN')}</span>
                        </div>
                    </div>
                    <div class="chat-amount">
                        ${sign} ${item.SoTien.toLocaleString('vi-VN')} đ
                    </div>
                `;
                divList.appendChild(itemDiv);
            });
            container.appendChild(divList);
        } else {
            container.innerHTML = '<h4><i class="fa-solid fa-clock-rotate-left"></i> Vừa mới nhập</h4><p style="margin-top:20px; color:#888;">Chưa có giao dịch...</p>';
        }
    } catch (err) { console.error("Lỗi recent:", err); }
}

// 4. Vẽ biểu đồ (Dữ liệu thật)
async function loadChartData() {
    const ctx = document.getElementById('myPieChart').getContext('2d');
    const today = new Date();
    const month = today.getMonth() + 1; 
    const year = today.getFullYear();

    try {
        const res = await fetch(`http://localhost:3000/api/report/expense-by-category?userId=${idUser}&month=${month}&year=${year}`);
        const data = await res.json();

        let labels = ['Chưa có dữ liệu'];
        let values = [1]; 
        let colors = ['#e0e0e0'];

        if (data.success && data.data.length > 0) {
            labels = data.data.map(item => item.TenDanhMuc);
            values = data.data.map(item => item.TongTien);
            colors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'];
        }

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { 
                    legend: { position: 'right' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if(data.data.length === 0) return "Chưa tiêu gì cả";
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
    } catch (err) { console.error("Lỗi chart:", err); }
}

// --- KHỞI CHẠY KHI DOM ĐÃ SẴN SÀNG ---
document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    loadStats();
    loadRecent();
    loadChartData();
});