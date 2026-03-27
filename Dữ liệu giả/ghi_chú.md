Dưới đây là hướng dẫn tạo một cái database chứa sẵn dữ liệu giả để gọi API thành công.

### Phần 1: Cài đặt SQL Server & Công cụ quản lý (SSMS)

# Bước 1: Tải và cài đặt SQL Server (Bản Developer)
Bản Developer hoàn toàn miễn phí và có đầy đủ mọi tính năng như bản Enterprise cao cấp nhất (chỉ giới hạn không được dùng cho mục đích thương mại).
Truy cập trang chủ Microsoft: Tìm kiếm "Download SQL Server 2022 Developer".
Tải file cài đặt về và chạy.
Chọn kiểu cài đặt Basic.
Cứ bấm "Accept" và "Install", sau đó đợi máy tự động tải và cài đặt (mất khoảng 5-10 phút).
Khi cài xong, ĐỪNG TẮT vội. Hãy nhìn xuống dưới cùng có nút Install SSMS. Bấm vào đó!

# Bước 2: Cài đặt SQL Server Management Studio (SSMS)
SSMS là phần mềm có giao diện đồ họa giúp bạn xem bảng, xem cột, viết lệnh SQL dễ dàng thay vì phải gõ lệnh mù mờ trên màn hình đen.
Nút ở Bước 1 sẽ dẫn bạn đến trang tải SSMS. Nhấn tải bản mới nhất (Free Download for SQL Server Management Studio).
Tải xong thì cài đặt như phần mềm bình thường (Cứ Next -> Install).

### Phần 2: Cấu hình tài khoản đăng nhập (Cực kỳ quan trọng cho file .env)
- Theo mặc định, SQL Server chỉ cho phép đăng nhập bằng tài khoản Windows của bạn. Nhưng trong ứng dụng (file .env của thư mục Backend), chúng ta cấu hình dùng tài khoản sa (System Administrator) và mật khẩu để kết nối cho ổn định.

- Mở phần mềm SQL Server Management Studio (SSMS) vừa cài.

- Ở cửa sổ kết nối hiện ra:
- Server name: Chọn tên máy tính của bạn (hoặc gõ localhost hoặc .).
- Authentication: Chọn Windows Authentication.
Bấm Connect.
- Ở cột bên trái (Object Explorer), click chuột phải vào tên Server trên cùng -> Chọn Properties.
Chọn tab Security (bên trái) -> Ở mục Server authentication, chọn SQL Server and Windows Authentication mode -> Bấm OK.
- Vẫn ở cột bên trái, mở rộng thư mục Security -> Logins.
- Click chuột phải vào tài khoản sa -> Chọn Properties.
- Đặt mật khẩu cho tài khoản sa (Ví dụ: 123456) và bỏ tích ô Enforce password policy để đỡ lằng nhằng.
Chuyển sang tab Status (bên trái) -> Mục Login chọn Enabled -> Bấm OK.
- Cuối cùng: Click chuột phải vào tên Server trên cùng (chỗ bước 3) -> Chọn Restart để SQL Server nhận cấu hình mới.
(Lưu ý: Mật khẩu bạn vừa đặt chính là giá trị DB_PASSWORD trong file .env của Backend nhé).

### Phần 3: Tạo Mock Database & Đổ dữ liệu giả
- Bây giờ bạn sẽ tạo các bảng giống y hệt lược đồ hình sao (Star Schema) của nhóm bạn, và nhét vào đó một vài dòng dữ liệu để API của bạn gắp lên được.
Trong SSMS, click chuột phải vào mục Databases -> Chọn New Database...
- Đặt tên là DW_OLAP_DB và bấm OK.
Nhấn nút New Query (ở thanh công cụ phía trên).
- Copy toàn bộ đoạn code SQLMẫu dưới đây dán vào và nhấn nút Execute (hoặc phím F5)
