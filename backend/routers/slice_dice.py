from fastapi import APIRouter, Query
from db import execute_query
from typing import Optional

router = APIRouter()

@router.get("/")
def slice_dice(
    city:     Optional[str] = Query(None),
    quarter:  Optional[str] = Query(None),
    year:     Optional[int] = Query(None),
    loai_kh:  Optional[str] = Query(None),
    min_stock:Optional[int] = Query(None)
):
    conditions = []
    params     = []

    if city:      conditions.append("d.Ten_TP = ?");         params.append(city)
    if quarter:   conditions.append("t.Quy = ?");            params.append(quarter)
    if year:      conditions.append("t.Nam = ?");            params.append(year)
    if loai_kh:   conditions.append("kh.Loai_KH = ?");       params.append(loai_kh)
    if min_stock: conditions.append("f.So_Luong_Ton_Kho > ?");params.append(min_stock)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    query = f"""
        SELECT
            d.Ten_TP, t.Quy, t.Nam, kh.Loai_KH,
            SUM(f.So_Luong_Ton_Kho) AS Tong_Ton,
            SUM(fo.Tong_Tien)       AS Doanh_Thu
        FROM Fact_Ton_Kho f
        JOIN Dim_Cua_Hang   c  ON f.Ma_CH    = c.Ma_CH
        JOIN Dim_Dia_Diem   d  ON c.Ma_TP    = d.Ma_TP
        JOIN Dim_Time       t  ON f.Time_key = t.Time_key
        JOIN Fact_Order     fo ON fo.Ma_MH   = f.Ma_MH
        JOIN Dim_Khach_Hang kh ON fo.Ma_KH   = kh.Ma_KH
        {where}
        GROUP BY d.Ten_TP, t.Quy, t.Nam, kh.Loai_KH
        ORDER BY Doanh_Thu DESC
    """
    data = execute_query(query, tuple(params) if params else None)
    return { "data": data, "sql": query, "count": len(data) }