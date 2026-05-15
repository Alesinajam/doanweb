USE QuanLyChiTieuCN;
CREATE USER 'admin_web'@'localhost' IDENTIFIED BY '123456';
GRANT SELECT, INSERT, UPDATE, DELETE ON QuanLyChiTieuCN.* TO 'admin_web'@'localhost';
FLUSH PRIVILEGES;