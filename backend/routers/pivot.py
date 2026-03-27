from fastapi import APIRouter, Query
from typing import Optional
from db import execute_query

router = APIRouter()

# ─── Cấu hình chiều hàng ───────────────────────────────────────────────────
ROW_CONFIG = {
    "city": {
        "col":   "d.Ten_TP",
        "joins": """
            JOIN Dim_Cua_Hang c ON fo.Ma_CH = c.Ma_CH
            JOIN Dim_Dia_Diem d ON c.Ma_TP  = d.Ma_TP
        """
    },
    "item": {
        "col":   "m.Mo_Ta",
        "joins": "JOIN Dim_Mat_Hang m ON fo.Ma_MH = m.Ma_MH"
    },
    "customer": {
        "col":   "kh.Loai_KH",
        "joins": "JOIN Dim_Khach_Hang kh ON fo.Ma_KH = kh.Ma_KH"
    }
}

# ─── Cấu hình cột (chiều cột) ──────────────────────────────────────────────
COL_CONFIG = {
    "quarter": {
        "field":  "t.Quy",
        "values": ["Q1", "Q2", "Q3", "Q4"]
    },
    "year": {
        "field":  "CAST(t.Nam AS VARCHAR)",
        "values": ["2022", "2023", "2024"]
    }
}

# ─── Measure ───────────────────────────────────────────────────────────────
MEASURE_CONFIG = {
    "revenue": "SUM(fo.Tong_Tien)",
    "qty":     "SUM(fo.So_Luong_Dat)",
    "stock":   "SUM(f.So_Luong_Ton_Kho)"
}


@router.get("/")
def pivot(
    row_dim:  str = Query("city",    description="Chiều hàng: city | item | customer"),
    col_dim:  str = Query("quarter", description="Chiều cột:  quarter | year"),
    measure:  str = Query("revenue", description="Độ đo:      revenue | qty | stock")
):
    """
    Trả về bảng pivot dạng:
    {
      "columns": ["Q1","Q2","Q3","Q4","Tổng"],
      "rows": [
        {"label": "Hà Nội", "Q1": 100, "Q2": 200, ..., "Tổng": 300},
        ...
      ],
      "col_totals": {"Q1": 500, ...},
      "grand_total": 1234,
      "sql": "..."
    }
    """
    row_cfg  = ROW_CONFIG.get(row_dim,  ROW_CONFIG["city"])
    col_cfg  = COL_CONFIG.get(col_dim,  COL_CONFIG["quarter"])
    msr_sql  = MEASURE_CONFIG.get(measure, MEASURE_CONFIG["revenue"])

    row_col  = row_cfg["col"]
    row_join = row_cfg["joins"]
    col_field = col_cfg["field"]
    col_vals  = col_cfg["values"]

    # Build CASE WHEN pivot columns
    pivot_cols_sql = ",\n            ".join([
        f"SUM(CASE WHEN {col_field} = '{v}' THEN {msr_sql.replace('SUM(','').replace(')','')} ELSE 0 END) AS [{v}]"
        for v in col_vals
    ])

    # Cần tách measure ra để dùng trong CASE WHEN
    # vd: SUM(fo.Tong_Tien) → fo.Tong_Tien
    inner_expr = msr_sql.replace("SUM(", "").replace("AVG(", "").rstrip(")")

    pivot_cols_sql = ",\n            ".join([
        f"SUM(CASE WHEN {col_field} = '{v}' THEN {inner_expr} ELSE 0 END) AS [{v}]"
        for v in col_vals
    ])

    total_sql = f"SUM({inner_expr}) AS [Tổng]"

    # Xác định FROM + JOIN
    if measure == "stock":
        from_clause = """
            FROM Fact_Ton_Kho f
            JOIN Fact_Order fo     ON fo.Ma_MH    = f.Ma_MH
            JOIN Dim_Time   t      ON f.Time_key  = t.Time_key
        """
    else:
        from_clause = """
            FROM Fact_Order fo
            JOIN Dim_Time   t      ON fo.Time_key = t.Time_key
        """

    query = f"""
        SELECT
            {row_col} AS Nhan,
            {pivot_cols_sql},
            {total_sql}
        {from_clause}
        JOIN Dim_Mat_Hang   m  ON fo.Ma_MH = m.Ma_MH
        JOIN Dim_Khach_Hang kh ON fo.Ma_KH = kh.Ma_KH
        JOIN Dim_Cua_Hang   c  ON fo.Ma_CH = c.Ma_CH
        JOIN Dim_Dia_Diem   d  ON c.Ma_TP  = d.Ma_TP
        GROUP BY {row_col}
        ORDER BY [Tổng] DESC
    """

    rows = execute_query(query)

    # Tính tổng cột
    col_totals = {v: sum(r.get(v, 0) or 0 for r in rows) for v in col_vals}
    col_totals["Tổng"] = sum(r.get("Tổng", 0) or 0 for r in rows)

    return {
        "columns":    col_vals + ["Tổng"],
        "rows":       rows,
        "col_totals": col_totals,
        "grand_total": col_totals["Tổng"],
        "sql":        query.strip()
    }