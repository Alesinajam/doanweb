USE QuanLyChiTieuCN;
SELECT MaNguoiDung INTO @UserID FROM NGUOIDUNG WHERE TenDangNhap = 'truongnhom' LIMIT 1;
INSERT INTO DANHMUC (TenDanhMuc, LoaiGiaoDich, MaNguoiDung) 
SELECT 'Ăn uống', 'Chi', @UserID WHERE @UserID IS NOT NULL UNION ALL
SELECT 'Di chuyển (Xăng/Xe)', 'Chi', @UserID WHERE @UserID IS NOT NULL UNION ALL
SELECT 'Tiền nhà/Điện nước', 'Chi', @UserID WHERE @UserID IS NOT NULL UNION ALL
SELECT 'Mua sắm', 'Chi', @UserID WHERE @UserID IS NOT NULL UNION ALL
SELECT 'Giải trí', 'Chi', @UserID WHERE @UserID IS NOT NULL UNION ALL
SELECT 'Lương cứng', 'Thu', @UserID WHERE @UserID IS NOT NULL UNION ALL
SELECT 'Tiền thưởng', 'Thu', @UserID WHERE @UserID IS NOT NULL UNION ALL
SELECT 'Làm thêm (Freelance)', 'Thu', @UserID WHERE @UserID IS NOT NULL UNION ALL
SELECT 'Được tặng', 'Thu', @UserID WHERE @UserID IS NOT NULL;

-- Kiểm tra kết quả
SELECT 'Đã thêm danh mục thành công cho user truongnhom' AS Message WHERE @UserID IS NOT NULL;