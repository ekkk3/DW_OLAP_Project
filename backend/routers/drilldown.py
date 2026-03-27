from fastapi import APIRouter, Query
from db import execute_query

router = APIRouter()

@router.get("/city")
def drill_city(city: str = Query(...)):
    query = """
        SELECT
            c.Ma_CH, d.Ten_TP, c.SDT,
            SUM(f.So_Luong_Ton_Kho) AS Tong_Ton_Kho
        FROM Fact_Ton_Kho f
        JOIN Dim_Cua_Hang c ON f.Ma_CH = c.Ma_CH
        JOIN Dim_Dia_Diem d ON c.Ma_TP = d.Ma_TP
        WHERE d.Ten_TP = ?
        GROUP BY c.Ma_CH, d.Ten_TP, c.SDT
        ORDER BY Tong_Ton_Kho DESC
    """
    data = execute_query(query, (city,))
    return { "data": data, "sql": query }

@router.get("/store")
def drill_store(ma_ch: str = Query(...)):
    query = """
        SELECT
            m.Ma_MH, m.Mo_Ta,
            f.So_Luong_Ton_Kho, m.Gia
        FROM Fact_Ton_Kho f
        JOIN Dim_Mat_Hang m ON f.Ma_MH = m.Ma_MH
        WHERE f.Ma_CH = ?
        ORDER BY f.So_Luong_Ton_Kho DESC
    """
    data = execute_query(query, (ma_ch,))
    return { "data": data, "sql": query }