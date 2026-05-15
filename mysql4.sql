USE QuanLyChiTieuCN;
INSERT INTO DANHMUC (TenDanhMuc, LoaiGiaoDich, MaNguoiDung) VALUES 
('Lương cứng', 'Thu', 1),
('Thưởng', 'Thu', 1),
('Ăn uống', 'Chi', 1),
('Tiền trọ', 'Chi', 1),
('Cafe', 'Chi', 1);
INSERT INTO GIAODICH (MaNguoiDung, MaDanhMuc, SoTien, GhiChu, NgayGiaoDich) VALUES
(1, 1, 10000000, 'Lương tháng 1', NOW()), -- Thu 10tr
(1, 3, 50000, 'Cơm tấm', NOW()),           -- Chi 50k
(1, 3, 45000, 'Phở bò', NOW()),            -- Chi 45k
(1, 4, 3000000, 'Đóng tiền nhà', NOW());   -- Chi 3tr