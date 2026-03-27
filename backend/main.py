from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import rollup, drilldown, slice_dice, pivot, reports

app = FastAPI(title="OLAP Dashboard API")

# Cho phép frontend gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các router
app.include_router(rollup.router,    prefix="/api/rollup",    tags=["Roll-up"])
app.include_router(drilldown.router, prefix="/api/drilldown", tags=["Drill-down"])
app.include_router(slice_dice.router,prefix="/api/slice",     tags=["Slice & Dice"])
app.include_router(pivot.router,     prefix="/api/pivot",     tags=["Pivot"])
app.include_router(reports.router,   prefix="/api/reports",   tags=["Reports"])

# Serve file frontend
app.mount("/", StaticFiles(directory="..", html=True), name="static")