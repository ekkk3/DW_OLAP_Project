from fastapi import APIRouter, Query
from db import execute_query

router = APIRouter()

LOC_COLS = {
    0: "c.Ma_CH",
    1: "d.Ten_TP",
    2: "d.Bang",
    3: "'Tất cả' AS Pham_Vi"
}
TIME_COLS = {
    0: "t.Ngay",
    1: "t.Thang",
    2: "t.Quy",
    3: "t.Nam"
}
MEASURES = {
    "stock":   "SUM(f.So_Luong_Ton_Kho)",
    "ordered": "SUM(fo.So_Luong_Dat)",
    "revenue": "SUM(fo.Tong_Tien)",
    "avg":     "AVG(f.So_Luong_Ton_Kho)"
}

@router.get("/")
def rollup(
    locLevel:  int = Query(0),
    timeLevel: int = Query(0),
    measure:   str = Query("stock"),
    mh:        str = Query("")
):
    loc_col     = LOC_COLS.get(locLevel,  "c.Ma_CH")
    time_col    = TIME_COLS.get(timeLevel,"t.Ngay")
    measure_sql = MEASURES.get(measure,   "SUM(f.So_Luong_Ton_Kho)")
    where       = "WHERE f.Ma_MH = ?" if mh else ""

    query = f"""
        SELECT
            {loc_col}    AS Dia_Diem,
            {time_col}   AS Thoi_Gian,
            {measure_sql} AS So_Luong
        FROM Fact_Ton_Kho f
        JOIN Dim_Cua_Hang c ON f.Ma_CH    = c.Ma_CH
        JOIN Dim_Dia_Diem d ON c.Ma_TP    = d.Ma_TP
        JOIN Dim_Time     t ON f.Time_key = t.Time_key
        JOIN Dim_Mat_Hang m ON f.Ma_MH    = m.Ma_MH
        {where}
        GROUP BY {loc_col}, {time_col}
        ORDER BY So_Luong DESC
    """
    params = (mh,) if mh else None
    data   = execute_query(query, params)
    return { "data": data, "sql": query, "count": len(data) }