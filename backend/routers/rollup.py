from fastapi import APIRouter, Query
from db import execute_query

router = APIRouter()

LOC_COLS = {
    0: "c.Ma_CH",
    1: "d.Ten_TP",
    2: "d.Bang",
    3: "N'Tất cả'"
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
    
    # Sửa tên biến thành where_clause cho đồng nhất
    where_clause = "WHERE f.Ma_MH = ?" if mh else ""
    
    # SỬA LỖI GROUP BY TẠI ĐÂY:
    # Nếu locLevel là 3 (Tất cả), ta không đưa nó vào GROUP BY
    group_by_cols = []
    if locLevel != 3:
        group_by_cols.append(loc_col)
    
    # Thời gian luôn là cột thật nên luôn được đưa vào GROUP BY
    group_by_cols.append(time_col)
    
    # Nối các cột lại bằng dấu phẩy
    group_by_clause = ", ".join(group_by_cols)

    if measure in ["ordered", "revenue"]:
        query = f"""
            SELECT
                {loc_col}    AS Dia_Diem,
                {time_col}   AS Thoi_Gian,
                {measure_sql} AS So_Luong
            FROM Fact_Order fo
            JOIN Dim_Cua_Hang c ON fo.Ma_CH    = c.Ma_CH
            JOIN Dim_Dia_Diem d ON c.Ma_TP    = d.Ma_TP
            JOIN Dim_Time     t ON fo.Time_key = t.Time_key
            JOIN Dim_Mat_Hang m ON fo.Ma_MH    = m.Ma_MH
            {where_clause.replace('f.Ma_MH', 'fo.Ma_MH')}
            GROUP BY {group_by_clause}
            ORDER BY So_Luong DESC
        """
        params = (mh,) if mh else None
    else:
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
            {where_clause}
            GROUP BY {group_by_clause} 
            ORDER BY So_Luong DESC
        """
        params = (mh,) if mh else None
        
    data   = execute_query(query, params)
    return { "data": data, "sql": query.strip(), "count": len(data) }