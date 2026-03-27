from fastapi import APIRouter, Query
from typing import Optional
from db import execute_query

router = APIRouter()


# ══════════════════════════════════════════════════════════════
# Q1 — Cửa hàng & mặt hàng đang lưu kho
# ══════════════════════════════════════════════════════════════
@router.get("/q1")
def report_q1():
    """
    Tìm tất cả cửa hàng cùng với thành phố, bang, SĐT,
    mô tả, kích cỡ, trọng lượng, đơn giá của mặt hàng đang lưu kho.
    """
    query = """
        SELECT
            c.Ma_CH,
            d.Ten_TP,
            d.Bang,
            c.SDT,
            m.Mo_Ta,
            m.Kich_Co,
            m.Trong_Luong,
            m.Gia,
            f.So_Luong_Ton_Kho
        FROM Fact_Ton_Kho f
        JOIN Dim_Cua_Hang c  ON f.Ma_CH = c.Ma_CH
        JOIN Dim_Dia_Diem d  ON c.Ma_TP = d.Ma_TP
        JOIN Dim_Mat_Hang m  ON f.Ma_MH = m.Ma_MH
        ORDER BY d.Ten_TP, c.Ma_CH
    """
    data = execute_query(query)
    return {"data": data, "sql": query.strip(), "count": len(data)}


# ══════════════════════════════════════════════════════════════
# Q2 — Đơn đặt hàng & tên khách hàng
# ══════════════════════════════════════════════════════════════
@router.get("/q2")
def report_q2():
    """
    Tìm tất cả đơn đặt hàng với tên khách hàng và ngày đặt.
    """
    query = """
        SELECT
            fo.Ma_Don,
            fo.Ngay_Dat_Hang,
            kh.Ten_KH,
            kh.Loai_KH,
            m.Mo_Ta         AS Mat_Hang,
            fo.So_Luong_Dat,
            fo.Tong_Tien
        FROM Fact_Order fo
        JOIN Dim_Khach_Hang kh ON fo.Ma_KH = kh.Ma_KH
        JOIN Dim_Mat_Hang   m  ON fo.Ma_MH = m.Ma_MH
        ORDER BY fo.Ngay_Dat_Hang DESC
    """
    data = execute_query(query)
    return {"data": data, "sql": query.strip(), "count": len(data)}


# ══════════════════════════════════════════════════════════════
# Q3 — Cửa hàng có bán mặt hàng được đặt bởi khách hàng
# ══════════════════════════════════════════════════════════════
@router.get("/q3")
def report_q3(ma_kh: str = Query(..., description="Mã khách hàng, VD: KH_01")):
    """
    Tìm tất cả cửa hàng (tên TP, SĐT) có bán mặt hàng
    được đặt bởi khách hàng có mã cho trước.
    """
    query = """
        SELECT DISTINCT
            c.Ma_CH,
            d.Ten_TP,
            c.SDT,
            m.Mo_Ta AS Mat_Hang
        FROM Fact_Order fo
        JOIN Dim_Khach_Hang kh ON fo.Ma_KH  = kh.Ma_KH
        JOIN Dim_Mat_Hang   m  ON fo.Ma_MH  = m.Ma_MH
        JOIN Fact_Ton_Kho   f  ON f.Ma_MH   = fo.Ma_MH
        JOIN Dim_Cua_Hang   c  ON f.Ma_CH   = c.Ma_CH
        JOIN Dim_Dia_Diem   d  ON c.Ma_TP   = d.Ma_TP
        WHERE kh.Ma_KH = ?
        ORDER BY d.Ten_TP
    """
    data = execute_query(query, (ma_kh,))
    return {"data": data, "sql": query.strip(), "count": len(data)}


# ══════════════════════════════════════════════════════════════
# Q4 — Văn phòng đại diện lưu kho trên mức cụ thể
# ══════════════════════════════════════════════════════════════
@router.get("/q4")
def report_q4(min_qty: int = Query(100, description="Số lượng tồn kho tối thiểu")):
    """
    Tìm địa chỉ văn phòng đại diện (tên TP, bang) của tất cả
    cửa hàng lưu kho một mặt hàng với số lượng trên mức cho trước.
    """
    query = """
        SELECT
            d.Ten_TP,
            d.Bang,
            d.Dia_Chi_VP,
            SUM(f.So_Luong_Ton_Kho) AS Tong_Ton
        FROM Dim_Dia_Diem d
        JOIN Dim_Cua_Hang c  ON c.Ma_TP = d.Ma_TP
        JOIN Fact_Ton_Kho f  ON f.Ma_CH = c.Ma_CH
        GROUP BY d.Ten_TP, d.Bang, d.Dia_Chi_VP
        HAVING SUM(f.So_Luong_Ton_Kho) > ?
        ORDER BY Tong_Ton DESC
    """
    data = execute_query(query, (min_qty,))
    return {"data": data, "sql": query.strip(), "count": len(data)}


# ══════════════════════════════════════════════════════════════
# Q5 — Mặt hàng trong đơn & cửa hàng có bán
# ══════════════════════════════════════════════════════════════
@router.get("/q5")
def report_q5(ma_don: str = Query(..., description="Mã đơn đặt hàng, VD: ORD001")):
    """
    Với mỗi đơn đặt hàng, liệt kê mặt hàng được đặt cùng
    mô tả, mã cửa hàng, tên thành phố, số lượng đặt.
    """
    query = """
        SELECT
            fo.Ma_Don,
            m.Mo_Ta         AS Mat_Hang,
            f.Ma_CH,
            d.Ten_TP,
            fo.So_Luong_Dat
        FROM Fact_Order fo
        JOIN Dim_Mat_Hang m  ON fo.Ma_MH = m.Ma_MH
        JOIN Fact_Ton_Kho f  ON f.Ma_MH  = fo.Ma_MH
        JOIN Dim_Cua_Hang c  ON f.Ma_CH  = c.Ma_CH
        JOIN Dim_Dia_Diem d  ON c.Ma_TP  = d.Ma_TP
        WHERE fo.Ma_Don = ?
        ORDER BY d.Ten_TP
    """
    data = execute_query(query, (ma_don,))
    return {"data": data, "sql": query.strip(), "count": len(data)}


# ══════════════════════════════════════════════════════════════
# Q6 — Thành phố & bang của khách hàng
# ══════════════════════════════════════════════════════════════
@router.get("/q6")
def report_q6(ma_kh: str = Query(..., description="Mã khách hàng, VD: KH_03")):
    """
    Tìm thành phố và bang mà một khách hàng sinh sống.
    """
    query = """
        SELECT
            kh.Ma_KH,
            kh.Ten_KH,
            d.Ten_TP,
            d.Bang
        FROM Dim_Khach_Hang kh
        JOIN Dim_Dia_Diem   d  ON kh.Ma_TP = d.Ma_TP
        WHERE kh.Ma_KH = ?
    """
    data = execute_query(query, (ma_kh,))
    return {"data": data, "sql": query.strip(), "count": len(data)}


# ══════════════════════════════════════════════════════════════
# Q7 — Mức tồn kho mặt hàng tại thành phố
# ══════════════════════════════════════════════════════════════
@router.get("/q7")
def report_q7(
    ma_mh: str = Query(..., description="Mã mặt hàng, VD: MH001"),
    city:  str = Query(..., description="Tên thành phố, VD: Hà Nội")
):
    """
    Tìm mức độ tồn kho của một mặt hàng cụ thể
    tại tất cả các cửa hàng trong một thành phố.
    """
    query = """
        SELECT
            c.Ma_CH,
            d.Ten_TP,
            m.Mo_Ta         AS Mat_Hang,
            f.So_Luong_Ton_Kho
        FROM Fact_Ton_Kho f
        JOIN Dim_Cua_Hang c  ON f.Ma_CH = c.Ma_CH
        JOIN Dim_Dia_Diem d  ON c.Ma_TP = d.Ma_TP
        JOIN Dim_Mat_Hang m  ON f.Ma_MH = m.Ma_MH
        WHERE f.Ma_MH  = ?
          AND d.Ten_TP = ?
        ORDER BY f.So_Luong_Ton_Kho DESC
    """
    data = execute_query(query, (ma_mh, city))
    return {"data": data, "sql": query.strip(), "count": len(data)}


# ══════════════════════════════════════════════════════════════
# Q8 — Chi tiết đầy đủ một đơn đặt hàng
# ══════════════════════════════════════════════════════════════
@router.get("/q8")
def report_q8(ma_don: str = Query(..., description="Mã đơn, VD: ORD005")):
    """
    Tìm các mặt hàng, số lượng đặt, khách hàng,
    cửa hàng và thành phố của một đơn đặt hàng.
    """
    query = """
        SELECT
            fo.Ma_Don,
            kh.Ten_KH,
            kh.Loai_KH,
            m.Mo_Ta         AS Mat_Hang,
            fo.So_Luong_Dat,
            fo.Tong_Tien,
            c.Ma_CH,
            d.Ten_TP
        FROM Fact_Order fo
        JOIN Dim_Khach_Hang kh ON fo.Ma_KH = kh.Ma_KH
        JOIN Dim_Mat_Hang   m  ON fo.Ma_MH = m.Ma_MH
        JOIN Dim_Cua_Hang   c  ON fo.Ma_CH = c.Ma_CH
        JOIN Dim_Dia_Diem   d  ON c.Ma_TP  = d.Ma_TP
        WHERE fo.Ma_Don = ?
    """
    data = execute_query(query, (ma_don,))
    return {"data": data, "sql": query.strip(), "count": len(data)}


# ══════════════════════════════════════════════════════════════
# Q9 — Phân loại khách hàng (du lịch / bưu điện / cả hai)
# ══════════════════════════════════════════════════════════════
@router.get("/q9")
def report_q9():
    """
    Tìm khách hàng du lịch, khách hàng bưu điện
    và khách hàng thuộc cả hai loại.
    """
    query = """
        SELECT
            kh.Ma_KH,
            kh.Ten_KH,
            CASE
                WHEN kh.Ma_KH IN (SELECT Ma_KH FROM Khach_Hang_Du_Lich)
                 AND kh.Ma_KH IN (SELECT Ma_KH FROM Khach_Hang_Buu_Dien)
                THEN N'Cả hai'
                WHEN kh.Ma_KH IN (SELECT Ma_KH FROM Khach_Hang_Du_Lich)
                THEN N'Du lịch'
                ELSE N'Bưu điện'
            END AS Phan_Loai
        FROM Dim_Khach_Hang kh
        ORDER BY Phan_Loai, kh.Ten_KH
    """
    data = execute_query(query)
    return {"data": data, "sql": query.strip(), "count": len(data)}