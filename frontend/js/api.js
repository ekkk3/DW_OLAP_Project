// =========================================================
// QUẢN LÝ KẾT NỐI VỚI BACKEND (FASTAPI)
// =========================================================
const API_BASE_URL = "http://localhost:8000/api";

// Ví dụ hàm gọi API thật (sau này app.js sẽ gọi hàm này thay vì tự random dữ liệu)
async function fetchRollupData(measure, item, locLevel, timeLevel) {
  try {
    // Gọi xuống fastapi router: olap_router.py
    const response = await fetch(`${API_BASE_URL}/olap/rollup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ measure, item, locLevel, timeLevel })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu Rollup:", error);
    notify("Lỗi kết nối máy chủ!");
  }
}

// Tương tự cho fetchDrillDown(), fetchReport(reportId), v.v.