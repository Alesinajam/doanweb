const express = require('express');
const mysql = require('mysql2/promise'); // Dùng bản /promise để chạy được async/await mượt mà
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Cấu hình kết nối MySQL động (Lấy từ biến môi trường Railway hoặc chạy Local)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'admin_web',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'QuanLyChiTieuCN',
    port: parseInt(process.env.DB_PORT) || 3306, // Cổng mặc định của MySQL là 3306
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 2. API Đăng Nhập
app.post('/api/login', async (req, res) => {
    try {
        const { TenDangNhap, MatKhau } = req.body;

        // Trong MySQL, ta dùng dấu "?" để truyền tham số an toàn (tránh SQL Injection)
        const [rows] = await pool.query(
            'SELECT * FROM NGUOIDUNG WHERE TenDangNhap = ? AND MatKhau = ?',
            [TenDangNhap, MatKhau]
        );

        if (rows.length > 0) {
            res.json({ 
                success: true, 
                message: 'Đăng nhập thành công', 
                data: rows[0] // rows[0] tương đương với recordset[0] bên SQL Server
            });
        } else {
            res.json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 3. API Lấy thông tin Dashboard (Tổng Thu, Tổng Chi, Số Dư)
app.get('/api/dashboard', async (req, res) => {
    try {
        const maNguoiDung = req.query.id; 

        if (!maNguoiDung) {
            return res.status(400).json({ success: false, message: 'Thiếu ID người dùng' });
        }

        // Thay đổi chữ N'Thu' thành 'Thu' vì MySQL không cần tiền tố N cho chuỗi Unicode nếu DB đã cấu hình UTF8
        const sqlQuery = `
            SELECT 
                SUM(CASE WHEN d.LoaiGiaoDich = 'Thu' THEN g.SoTien ELSE 0 END) AS TongThu,
                SUM(CASE WHEN d.LoaiGiaoDich = 'Chi' THEN g.SoTien ELSE 0 END) AS TongChi
            FROM GIAODICH g
            JOIN DANHMUC d ON g.MaDanhMuc = d.MaDanhMuc
            WHERE g.MaNguoiDung = ?
        `;

        const [rows] = await pool.query(sqlQuery, [maNguoiDung]);
        const data = rows[0];
        
        const soDu = (data.TongThu || 0) - (data.TongChi || 0);

        res.json({
            success: true,
            tongThu: data.TongThu || 0,
            tongChi: data.TongChi || 0,
            soDu: soDu
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi lấy dữ liệu dashboard' });
    }
});

// 4. API Lấy thông tin cá nhân (Profile)
app.get('/api/profile', async (req, res) => {
    try {
        const userId = req.query.id;
        if (!userId) return res.status(400).json({ success: false, message: 'Thiếu ID' });

        const [rows] = await pool.query(
            'SELECT TenDangNhap, HoTen, NgheNghiep FROM NGUOIDUNG WHERE MaNguoiDung = ?',
            [userId]
        );

        if (rows.length > 0) {
            res.json({ success: true, data: rows[0] });
        } else {
            res.json({ success: false, message: 'Không tìm thấy user' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 5. API Cập nhật thông tin cá nhân
app.post('/api/profile/update', async (req, res) => {
    try {
        const { MaNguoiDung, HoTen, NgheNghiep } = req.body;

        await pool.query(
            'UPDATE NGUOIDUNG SET HoTen = ?, NgheNghiep = ? WHERE MaNguoiDung = ?',
            [HoTen, NgheNghiep, MaNguoiDung]
        );

        res.json({ success: true, message: 'Cập nhật thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi cập nhật' });
    }
});

// 6. API Lấy danh sách danh mục (Để hiện lên Dropdown)
app.get('/api/categories', async (req, res) => {
    try {
        const { userId, type } = req.query; 
        
        const [rows] = await pool.query(
            'SELECT MaDanhMuc, TenDanhMuc FROM DANHMUC WHERE MaNguoiDung = ? AND LoaiGiaoDich = ?',
            [userId, type]
        );

        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh mục' });
    }
});

// 7. API Thêm giao dịch mới
app.post('/api/transaction/add', async (req, res) => {
    try {
        const { MaNguoiDung, MaDanhMuc, SoTien, GhiChu, NgayGiaoDich } = req.body;

        await pool.query(
            'INSERT INTO GIAODICH (MaNguoiDung, MaDanhMuc, SoTien, GhiChu, NgayGiaoDich) VALUES (?, ?, ?, ?, ?)',
            [MaNguoiDung, MaDanhMuc, SoTien, GhiChu, NgayGiaoDich]
        );

        res.json({ success: true, message: 'Đã lưu giao dịch!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi lưu giao dịch' });
    }
});

// 8. API Lấy lịch sử giao dịch
app.get('/api/transactions/history', async (req, res) => {
    try {
        const { userId, limit } = req.query; 
        const parsedLimit = parseInt(limit) || 1000;

        // Cú pháp LIMIT trong MySQL nằm ở cuối câu lệnh thay vì dùng TOP ở đầu như SQL Server
        let queryStr = `
            SELECT g.MaGiaoDich, g.SoTien, g.GhiChu, g.NgayGiaoDich, d.TenDanhMuc, d.LoaiGiaoDich 
            FROM GIAODICH g
            JOIN DANHMUC d ON g.MaDanhMuc = d.MaDanhMuc
            WHERE g.MaNguoiDung = ?
            ORDER BY g.NgayGiaoDich DESC, g.MaGiaoDich DESC
            LIMIT ?
        `;

        const [rows] = await pool.query(queryStr, [parseInt(userId), parsedLimit]);

        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi lấy lịch sử' });
    }
});

// 9. API Báo cáo: Biểu đồ tròn
app.get('/api/report/expense-by-category', async (req, res) => {
    try {
        const { userId, month, year } = req.query;

        const [rows] = await pool.query(`
            SELECT d.TenDanhMuc, SUM(g.SoTien) as TongTien
            FROM GIAODICH g
            JOIN DANHMUC d ON g.MaDanhMuc = d.MaDanhMuc
            WHERE g.MaNguoiDung = ? 
              AND d.LoaiGiaoDich = 'Chi'
              AND MONTH(g.NgayGiaoDich) = ? 
              AND YEAR(g.NgayGiaoDich) = ?
            GROUP BY d.TenDanhMuc
        `, [userId, month, year]);

        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi báo cáo' });
    }
});

// 10. API Báo cáo: So sánh Hạn Mức vs Thực Tế (Vẽ biểu đồ cột)
app.get('/api/report/budget-comparison', async (req, res) => {
    try {
        const { userId, month, year } = req.query;

        // Thay ISNULL bằng IFNULL vì MySQL sử dụng hàm IFNULL
        const query = `
            SELECT 
                d.TenDanhMuc, 
                h.SoTienHanMuc, 
                IFNULL(SUM(g.SoTien), 0) AS ThucTe
            FROM HANMUC h
            JOIN DANHMUC d ON h.MaDanhMuc = d.MaDanhMuc
            LEFT JOIN GIAODICH g ON h.MaDanhMuc = g.MaDanhMuc 
                                 AND MONTH(g.NgayGiaoDich) = ? 
                                 AND YEAR(g.NgayGiaoDich) = ?
            WHERE h.MaNguoiDung = ? 
              AND h.Thang = ? 
              AND h.Nam = ?
            GROUP BY d.TenDanhMuc, h.SoTienHanMuc
        `;

        const [rows] = await pool.query(query, [month, year, userId, month, year]);

        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi lấy hạn mức' });
    }
});

// 11. API Cài đặt Hạn Mức
app.post('/api/budget/set', async (req, res) => {
    try {
        const { MaNguoiDung, MaDanhMuc, SoTienHanMuc, Thang, Nam } = req.body;

        const [check] = await pool.query(
            `SELECT MaHanMuc FROM HANMUC WHERE MaNguoiDung = ? AND MaDanhMuc = ? AND Thang = ? AND Nam = ?`,
            [MaNguoiDung, MaDanhMuc, Thang, Nam]
        );

        if (check.length > 0) {
            await pool.query(
                `UPDATE HANMUC SET SoTienHanMuc = ? WHERE MaHanMuc = ?`,
                [SoTienHanMuc, check[0].MaHanMuc]
            );
        } else {
            await pool.query(
                `INSERT INTO HANMUC (MaNguoiDung, MaDanhMuc, SoTienHanMuc, Thang, Nam) VALUES (?, ?, ?, ?, ?)`,
                [MaNguoiDung, MaDanhMuc, SoTienHanMuc, Thang, Nam]
            );
        }

        res.json({ success: true, message: 'Đã lưu hạn mức!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi lưu hạn mức' });
    }
});

// 12. API Xóa giao dịch
app.delete('/api/transaction/delete', async (req, res) => {
    try {
        const { id } = req.body;

        await pool.query('DELETE FROM GIAODICH WHERE MaGiaoDich = ?', [id]);

        res.json({ success: true, message: 'Đã xóa thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi khi xóa' });
    }
});

// 13. API Đổi mật khẩu
app.post('/api/profile/change-password', async (req, res) => {
    try {
        const { MaNguoiDung, MatKhauCu, MatKhauMoi } = req.body;

        const [check] = await pool.query(
            'SELECT * FROM NGUOIDUNG WHERE MaNguoiDung = ? AND MatKhau = ?',
            [MaNguoiDung, MatKhauCu]
        );

        if (check.length === 0) {
            return res.json({ success: false, message: 'Mật khẩu cũ không đúng!' });
        }

        await pool.query(
            'UPDATE NGUOIDUNG SET MatKhau = ? WHERE MaNguoiDung = ?',
            [MatKhauMoi, MaNguoiDung]
        );

        res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi đổi mật khẩu' });
    }
});

// 14. API Đăng ký tài khoản mới (PHIÊN BẢN MYSQL)
app.post('/api/register', async (req, res) => {
    try {
        const { TenDangNhap, MatKhau, HoTen, NgheNghiep } = req.body;

        const [checkUser] = await pool.query(
            'SELECT * FROM NGUOIDUNG WHERE TenDangNhap = ?', 
            [TenDangNhap]
        );

        if (checkUser.length > 0) {
            return res.json({ success: false, message: 'Tên đăng nhập này đã có người dùng!' });
        }

        // Trong MySQL không dùng OUTPUT INSERTED, ta lấy ID vừa tạo thông qua thuộc tính insertId của kết quả trả về
        const [insertResult] = await pool.query(
            'INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, NgheNghiep) VALUES (?, ?, ?, ?)',
            [TenDangNhap, MatKhau, HoTen, NgheNghiep]
        );
        
        const newUserId = insertResult.insertId; 

        const queryDefaultCategories = `
            INSERT INTO DANHMUC (TenDanhMuc, LoaiGiaoDich, MaNguoiDung) VALUES 
            ('Ăn uống', 'Chi', ?),
            ('Di chuyển', 'Chi', ?),
            ('Tiền nhà', 'Chi', ?),
            ('Mua sắm', 'Chi', ?),
            ('Lương cứng', 'Thu', ?),
            ('Thưởng', 'Thu', ?),
            ('Khác', 'Thu', ?)
        `;

        await pool.query(queryDefaultCategories, [
            newUserId, newUserId, newUserId, newUserId, newUserId, newUserId, newUserId
        ]);

        res.json({ success: true, message: 'Đăng ký thành công! Đã tạo sẵn danh mục cho bạn.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi đăng ký' });
    }
});

// Cổng phát cho môi trường Production
const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
    console.log(`Server Backend đang chạy tại port: ${PORT}`);
});
