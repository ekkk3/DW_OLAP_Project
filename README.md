
# 🛒 Kho Dữ Liệu & Hệ Thống Phân Tích OLAP (Đơn Đặt Hàng)

Xây dựng Kho dữ liệu (Data Warehouse) và Hệ thống Phân tích trực tuyến (OLAP) cho doanh nghiệp bán lẻ và quản lý đơn đặt hàng
Hệ thống cho phép trích xuất dữ liệu từ các CSDL phân tán, tích hợp vào Kho dữ liệu trung tâm, và cung cấp giao diện Web Dashboard trực quan để thực hiện các phép toán phân tích đa chiều.


## 🚀 Các Tính Năng Chính

Hệ thống cung cấp Dashboard Web tương tác với các tính năng:
1. **Phép toán OLAP cơ bản**:
    * `Roll-up` (Cuộn lên): Tổng hợp dữ liệu lên mức cao hơn (VD: Cửa hàng -> Thành phố).
    * `Drill-down` (Khoan xuống): Đi sâu vào chi tiết dữ liệu.
    * `Slice & Dice` (Chiếu chọn): Lọc dữ liệu đa chiều (Theo Quý, Thành phố, Loại KH...).
    * `Pivot` (Xoay bảng): Thay đổi góc nhìn dữ liệu (Chuyển hàng thành cột).
2. **Hệ thống 9 Báo Cáo Nghiệp Vụ**:
Đáp ứng trực tiếp các truy vấn phức tạp từ Cửa hàng, Hàng lưu kho, Đơn đặt hàng đến Phân loại khách hàng.

## 🛠 Công Nghệ Sử Dụng

* **Database**: MS SQL Server.
* **Backend API**: Python, FastAPI, `pyodbc`, `uvicorn`.
* **Frontend**: HTML5, CSS3, Vanilla JavaScript (Fetch API).

## 📁 Cấu Trúc Dự Án

DW_OLAP_Project/
│
├── backend/                     # API Server giao tiếp với Database
│   ├── main.py                  # File khởi chạy FastAPI
│   ├── db.py                    # Cấu hình kết nối SQL Server (pyodbc)
│   ├── .env                     # Biến môi trường (thông tin DB)
│   ├── requirements.txt         # Danh sách thư viện Python
│   └── routers/                 # Các API Endpoints
│       ├── rollup.py
│       ├── drilldown.py
│       ├── slice_dice.py
│       ├── pivot.py
│       └── reports.py
│
├── frontend/                    # Giao diện Web Dashboard
│   ├── index.html               # Trang chủ Dashboard
│   ├── css/
│   │   └── style.css            # Định dạng giao diện
│   └── js/
│       └── app.js               # Logic điều khiển Web & Gọi API
│
└── database/                    # Script SQL 
    ├── 01_idb_schema.sql        # Tạo CSDL tích hợp
    ├── 02_dw_schema.sql         # Tạo lược đồ hình sao (Fact, Dim)
    ├── 03_etl_scripts.sql       # Lệnh đổ dữ liệu
    └── 04_metadata_index.sql    # Index và tối ưu

⚙️ Hướng Dẫn Cài Đặt & Chạy Dự Án
# Cài đặt ODBC Driver cho SQL Server
Đầu tiên cần cài driver này vào máy (chỉ cần làm 1 lần):
Windows: Tải và cài tại đây:
https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server
Chọn ODBC Driver 17 for SQL Server → cài như phần mềm bình thường.
Sau đó kiểm tra đã cài chưa:
bash# Windows - mở ODBC Data Sources (64-bit)
# Hoặc chạy lệnh này trong Python
python -c "import pyodbc; print(pyodbc.drivers())"
# Phải thấy 'ODBC Driver 17 for SQL Server' trong danh sách

### Bước 1: Khởi tạo Cơ sở dữ liệu
Mở SQL Server Management Studio (SSMS).

Chạy lần lượt các script trong thư mục database/ để tạo bảng và nạp dữ liệu mẫu.

Đảm bảo SQL Server đang chạy và cho phép kết nối qua ODBC.

### Bước 2: Cài đặt Backend (FastAPI)
Mở Terminal, di chuyển vào thư mục backend:

cd backend
Cài đặt các thư viện Python:


pip install -r requirements.txt


Tạo file .env trong thư mục backend và điền thông tin kết nối SQL Server của bạn:

DB_DRIVER=ODBC Driver 17 for SQL Server
DB_SERVER=localhost
DB_DATABASE=Ten_Kho_Du_Lieu_Cua_Ban
DB_USER=sa
DB_PASSWORD=Mat_Khau_Cua_Ban

Khởi chạy Server:

uvicorn main:app --reload --port 5000
API sẽ chạy tại: http://localhost:5000. Bạn có thể truy cập http://localhost:5000/docs để test API qua Swagger UI.

### Bước 3: Chạy Frontend Dashboard
Trình duyệt web hiện đại có chặn gọi API nếu mở file HTML trực tiếp (lỗi CORS). Do đó, hãy chạy frontend qua một Local Server.

Nếu dùng VS Code, cài extension Live Server.

Click chuột phải vào file frontend/index.html -> Chọn "Open with Live Server".

Trải nghiệm hệ thống OLAP trên trình duyệt!

Dự án phục vụ mục đích học tập môn Kho Dữ Liệu.


***

