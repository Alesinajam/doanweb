const express = require('express');
const sql = require('mssql'); // Đã sửa từ mysql2 thành mssql để khớp với cú pháp code của bạn
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Cấu hình kết nối Database động (Chạy mượt ở cả Local lẫn Cloud)
const config = {
    user: process.env.DB_USER || 'admin_web',
    password: process.env.DB_PASSWORD || '123456',
    server: process.env.DB_HOST || 'localhost', 
    database: process.env.DB_NAME || 'QuanLyChiTieuCN',
    port: parseInt(process.env.DB_PORT) || 1433,        
    options: {
        encrypt: process.env.NODE_ENV === 'production', // Tự động mã hóa bảo mật khi lên production
        trustServerCertificate: true
    }
};

// 2. API Đăng Nhập
app.post('/api/login', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        const { TenDangNhap, MatKhau } = req.body;

        const result = await pool.request()
            .input('user', sql.NVarChar, TenDangNhap)
            .input('pass', sql.NVarChar, MatKhau)
            .query('SELECT * FROM NGUOIDUNG WHERE TenDangNhap = @user AND MatKhau = @pass');

        if (result.recordset.length > 0) {
            res.json({ 
                success: true, 
                message: 'Đăng nhập thành công', 
                data: result.recordset[0]
            });
        } else {
            res.json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 3. API Lấy thông tin Dashboard
app.get('/api/dashboard', async (req, res) => {
    try {
        const maNguoiDung = req.query.id; 
        if (!maNguoiDung) {
            return res.status(400).json({ success: false, message: 'Thiếu ID người dùng' });
        }

        let pool = await sql.connect(config);
        const sqlQuery = `
            SELECT 
                SUM(CASE WHEN d.LoaiGiaoDich = N'Thu' THEN g.SoTien ELSE 0 END) AS TongThu,
                SUM(CASE WHEN d.LoaiGiaoDich = N'Chi' THEN g.SoTien ELSE 0 END) AS TongChi
            FROM GIAODICH g
            JOIN DANHMUC d ON g.MaDanhMuc = d.MaDanhMuc
            WHERE g.MaNguoiDung = @userId
        `;

        const result = await pool.request()
            .input('userId', sql.Int, maNguoiDung)
            .query(sqlQuery);

        const data = result.recordset[0];
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

        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, userId)
            .query('SELECT TenDangNhap, HoTen, NgheNghiep FROM NGUOIDUNG WHERE MaNguoiDung = @id');

        if (result.recordset.length > 0) {
            res.json({ success: true, data: result.recordset[0] });
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
        let pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, MaNguoiDung)
            .input('hoten', sql.NVarChar, HoTen)
            .input('nghenghiep', sql.NVarChar, NgheNghiep)
            .query('UPDATE NGUOIDUNG SET HoTen = @hoten, NgheNghiep = @nghenghiep WHERE MaNguoiDung = @id');

        res.json({ success: true, message: 'Cập nhật thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi cập nhật' });
    }
});

// 6. API Lấy danh sách danh mục
app.get('/api/categories', async (req, res) => {
    try {
        const { userId, type } = req.query; 
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .input('type', sql.NVarChar, type)
            .query('SELECT MaDanhMuc, TenDanhMuc FROM DANHMUC WHERE MaNguoiDung = @uid AND LoaiGiaoDich = @type');

        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh mục' });
    }
});

// 7. API Thêm giao dịch mới
app.post('/api/transaction/add', async (req, res) => {
    try {
        const { MaNguoiDung, MaDanhMuc, SoTien, GhiChu, NgayGiaoDich } = req.body;
        let pool = await sql.connect(config);
        await pool.request()
            .input('uid', sql.Int, MaNguoiDung)
            .input('catId', sql.Int, MaDanhMuc)
            .input('amount', sql.Decimal, SoTien)
            .input('note', sql.NVarChar, GhiChu)
            .input('date', sql.Date, NgayGiaoDich)
            .query(`
                INSERT INTO GIAODICH (MaNguoiDung, MaDanhMuc, SoTien, GhiChu, NgayGiaoDich)
                VALUES (@uid, @catId, @amount, @note, @date)
            `);

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
        let pool = await sql.connect(config);
        
        let queryStr = `
            SELECT TOP ${limit || 1000} 
                g.MaGiaoDich, g.SoTien, g.GhiChu, g.NgayGiaoDich, 
                d.TenDanhMuc, d.LoaiGiaoDich 
            FROM GIAODICH g
            JOIN DANHMUC d ON g.MaDanhMuc = d.MaDanhMuc
            WHERE g.MaNguoiDung = @uid
            ORDER BY g.NgayGiaoDich DESC, g.MaGiaoDich DESC
        `;

        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .query(queryStr);

        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi lấy lịch sử' });
    }
});

// 9. API Báo cáo: Biểu đồ tròn
app.get('/api/report/expense-by-category', async (req, res) => {
    try {
        const { userId, month, year } = req.query;
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .input('month', sql.Int, month)
            .input('year', sql.Int, year)
            .query(`
                SELECT d.TenDanhMuc, SUM(g.SoTien) as TongTien
                FROM GIAODICH g
                JOIN DANHMUC d ON g.MaDanhMuc = d.MaDanhMuc
                WHERE g.MaNguoiDung = @uid 
                  AND d.LoaiGiaoDich = 'Chi'
                  AND MONTH(g.NgayGiaoDich) = @month 
                  AND YEAR(g.NgayGiaoDich) = @year
                GROUP BY d.TenDanhMuc
            `);

        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi báo cáo' });
    }
});

// 10. API Báo cáo: Biểu đồ cột
app.get('/api/report/budget-comparison', async (req, res) => {
    try {
        const { userId, month, year } = req.query;
        let pool = await sql.connect(config);
        const query = `
            SELECT 
                d.TenDanhMuc, 
                h.SoTienHanMuc, 
                ISNULL(SUM(g.SoTien), 0) AS ThucTe
            FROM HANMUC h
            JOIN DANHMUC d ON h.MaDanhMuc = d.MaDanhMuc
            LEFT JOIN GIAODICH g ON h.MaDanhMuc = g.MaDanhMuc 
                                 AND MONTH(g.NgayGiaoDich) = @month 
                                 AND YEAR(g.NgayGiaoDich) = @year
            WHERE h.MaNguoiDung = @uid 
              AND h.Thang = @month 
              AND h.Nam = @year
            GROUP BY d.TenDanhMuc, h.SoTienHanMuc
        `;

        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .input('month', sql.Int, month)
            .input('year', sql.Int, year)
            .query(query);

        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi lấy hạn mức' });
    }
});

// 11. API Cài đặt Hạn Mức
app.post('/api/budget/set', async (req, res) => {
    try {
        const { MaNguoiDung, MaDanhMuc, SoTienHanMuc, Thang, Nam } = req.body;
        let pool = await sql.connect(config);
        
        const check = await pool.request()
            .input('uid', sql.Int, MaNguoiDung)
            .input('catId', sql.Int, MaDanhMuc)
            .input('month', sql.Int, Thang)
            .input('year', sql.Int, Nam)
            .query(`SELECT MaHanMuc FROM HANMUC WHERE MaNguoiDung = @uid AND MaDanhMuc = @catId AND Thang = @month AND Nam = @year`);

        if (check.recordset.length > 0) {
            await pool.request()
                .input('amount', sql.Decimal, SoTienHanMuc)
                .input('id', sql.Int, check.recordset[0].MaHanMuc)
                .query(`UPDATE HANMUC SET SoTienHanMuc = @amount WHERE MaHanMuc = @id`);
        } else {
            await pool.request()
                .input('uid', sql.Int, MaNguoiDung)
                .input('catId', sql.Int, MaDanhMuc)
                .input('amount', sql.Decimal, SoTienHanMuc)
                .input('month', sql.Int, Thang)
                .input('year', sql.Int, Nam)
                .query(`INSERT INTO HANMUC (MaNguoiDung, MaDanhMuc, SoTienHanMuc, Thang, Nam) VALUES (@uid, @catId, @amount, @month, @year)`);
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
        let pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM GIAODICH WHERE MaGiaoDich = @id');

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
        let pool = await sql.connect(config);

        const check = await pool.request()
            .input('uid', sql.Int, MaNguoiDung)
            .input('oldPass', sql.NVarChar, MatKhauCu)
            .query('SELECT * FROM NGUOIDUNG WHERE MaNguoiDung = @uid AND MatKhau = @oldPass');

        if (check.recordset.length === 0) {
            return res.json({ success: false, message: 'Mật khẩu cũ không đúng!' });
        }

        await pool.request()
            .input('uid', sql.Int, MaNguoiDung)
            .input('newPass', sql.NVarChar, MatKhauMoi)
            .query('UPDATE NGUOIDUNG SET MatKhau = @newPass WHERE MaNguoiDung = @uid');

        res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi đổi mật khẩu' });
    }
});

// 14. API Đăng ký tài khoản mới
app.post('/api/register', async (req, res) => {
    try {
        const { TenDangNhap, MatKhau, HoTen, NgheNghiep } = req.body;
        let pool = await sql.connect(config);

        const checkUser = await pool.request()
            .input('user', sql.NVarChar, TenDangNhap)
            .query('SELECT * FROM NGUOIDUNG WHERE TenDangNhap = @user');

        if (checkUser.recordset.length > 0) {
            return res.json({ success: false, message: 'Tên đăng nhập này đã có người dùng!' });
        }

        const insertResult = await pool.request()
            .input('user', sql.NVarChar, TenDangNhap)
            .input('pass', sql.NVarChar, MatKhau)
            .input('name', sql.NVarChar, HoTen)
            .input('job', sql.NVarChar, NgheNghiep)
            .query(`
                INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, NgheNghiep)
                OUTPUT INSERTED.MaNguoiDung 
                VALUES (@user, @pass, @name, @job)
            `);
        
        const newUserId = insertResult.recordset[0].MaNguoiDung;

        const queryDefaultCategories = `
            INSERT INTO DANHMUC (TenDanhMuc, LoaiGiaoDich, MaNguoiDung) VALUES 
            (N'Ăn uống', 'Chi', @newId),
            (N'Di chuyển', 'Chi', @newId),
            (N'Tiền nhà', 'Chi', @newId),
            (N'Mua sắm', 'Chi', @newId),
            (N'Lương cứng', 'Thu', @newId),
            (N'Thưởng', 'Thu', @newId),
            (N'Khác', 'Thu', @newId)
        `;

        await pool.request()
            .input('newId', sql.Int, newUserId)
            .query(queryDefaultCategories);

        res.json({ success: true, message: 'Đăng ký thành công! Đã tạo sẵn danh mục cho bạn.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi đăng ký' });
    }
});

// Cổng phát động cho môi trường Production
const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
    console.log(`Server Backend đang chạy tại port: ${PORT}`);
});
