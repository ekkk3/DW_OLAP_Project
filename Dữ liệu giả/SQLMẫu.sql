USE DW_OLAP_DB;
GO

-- Xóa bảng nếu đã tồn tại (đảm bảo chạy lại nhiều lần không lỗi)
IF OBJECT_ID('Dim_Dia_Diem', 'U') IS NOT NULL DROP TABLE Dim_Dia_Diem;
IF OBJECT_ID('Dim_Cua_Hang', 'U') IS NOT NULL DROP TABLE Dim_Cua_Hang;
IF OBJECT_ID('Dim_Time', 'U') IS NOT NULL DROP TABLE Dim_Time;
IF OBJECT_ID('Dim_Mat_Hang', 'U') IS NOT NULL DROP TABLE Dim_Mat_Hang;
IF OBJECT_ID('Dim_Khach_Hang', 'U') IS NOT NULL DROP TABLE Dim_Khach_Hang;
IF OBJECT_ID('Khach_Hang_Du_Lich', 'U') IS NOT NULL DROP TABLE Khach_Hang_Du_Lich;
IF OBJECT_ID('Khach_Hang_Buu_Dien', 'U') IS NOT NULL DROP TABLE Khach_Hang_Buu_Dien;
IF OBJECT_ID('Fact_Ton_Kho', 'U') IS NOT NULL DROP TABLE Fact_Ton_Kho;
IF OBJECT_ID('Fact_Order', 'U') IS NOT NULL DROP TABLE Fact_Order;
IF OBJECT_ID('Mat_Hang_Luu_Tru', 'U') IS NOT NULL DROP TABLE Mat_Hang_Luu_Tru;
GO

-- 1. TẠO CÁC BẢNG DIMENSION
CREATE TABLE Dim_Dia_Diem (
    Ma_TP VARCHAR(50) PRIMARY KEY,
    Ten_TP NVARCHAR(100),
    Bang NVARCHAR(100),
    Dia_Chi_VP NVARCHAR(200)
);

CREATE TABLE Dim_Cua_Hang (
    Ma_CH VARCHAR(50) PRIMARY KEY,
    Ma_TP VARCHAR(50),
    SDT VARCHAR(20)
);

CREATE TABLE Dim_Time (
    Time_key INT PRIMARY KEY,
    Ngay INT, Thang INT, Quy VARCHAR(10), Nam INT
);

CREATE TABLE Dim_Mat_Hang (
    Ma_MH VARCHAR(50) PRIMARY KEY,
    Mo_Ta NVARCHAR(100),
    Kich_Co VARCHAR(20),
    Trong_Luong NVARCHAR(50),
    Gia INT
);

CREATE TABLE Dim_Khach_Hang (
    Ma_KH VARCHAR(50) PRIMARY KEY,
    Ten_KH NVARCHAR(100),
    Ma_TP VARCHAR(50),
    Loai_KH NVARCHAR(50)
);

CREATE TABLE Khach_Hang_Du_Lich (Ma_KH VARCHAR(50) PRIMARY KEY);
CREATE TABLE Khach_Hang_Buu_Dien (Ma_KH VARCHAR(50) PRIMARY KEY);

-- 2. TẠO CÁC BẢNG FACT
CREATE TABLE Fact_Ton_Kho (
    Time_key INT,
    Ma_CH VARCHAR(50),
    Ma_MH VARCHAR(50),
    So_Luong_Ton_Kho INT
);

CREATE TABLE Fact_Order (
    Ma_Don VARCHAR(50),
    Time_key INT,
    Ma_KH VARCHAR(50),
    Ma_MH VARCHAR(50),
    So_Luong_Dat INT,
    Tong_Tien INT,
    Ngay_Dat_Hang VARCHAR(20), -- thêm ngay từ đầu
    Ma_CH VARCHAR(50)          -- thêm ngay từ đầu
);

-- 3. CHÈN DỮ LIỆU GIẢ
INSERT INTO Dim_Dia_Diem VALUES 
('TP01', N'Hà Nội', N'Miền Bắc', N'123 Cầu Giấy'),
('TP02', N'TP.HCM', N'Miền Nam', N'456 Lê Lợi');

INSERT INTO Dim_Cua_Hang VALUES 
('CH01', 'TP01', '0912345678'),
('CH02', 'TP02', '0987654321');

INSERT INTO Dim_Time VALUES 
(20240101, 1, 1, 'Q1', 2024),
(20240401, 1, 4, 'Q2', 2024);

INSERT INTO Dim_Mat_Hang VALUES 
('MH01', N'Áo sơ mi', 'M', '200g', 250000),
('MH02', N'Quần Jeans', 'L', '500g', 450000);

INSERT INTO Dim_Khach_Hang VALUES 
('KH01', N'Nguyễn Văn A', 'TP01', N'Du lịch'),
('KH02', N'Trần Thị B', 'TP02', N'Bưu điện');

INSERT INTO Khach_Hang_Du_Lich VALUES ('KH01');
INSERT INTO Khach_Hang_Buu_Dien VALUES ('KH02');

INSERT INTO Fact_Ton_Kho VALUES 
(20240101, 'CH01', 'MH01', 500),
(20240101, 'CH02', 'MH02', 300);

INSERT INTO Fact_Order VALUES 
('ORD001', 20240101, 'KH01', 'MH01', 2, 500000, '2024-01-01', 'CH01'),
('ORD002', 20240401, 'KH02', 'MH02', 1, 450000, '2024-04-01', 'CH02');

-- 4. Bổ sung bảng Mat_Hang_Luu_Tru
CREATE TABLE Mat_Hang_Luu_Tru (
    Ma_CH VARCHAR(50),
    Ma_MH VARCHAR(50),
    So_Luong_Ton_Kho INT
);

INSERT INTO Mat_Hang_Luu_Tru VALUES 
('CH01', 'MH01', 500), 
('CH02', 'MH02', 300);