// =========================================================
// CẤU HÌNH API
// =========================================================
const API_BASE = 'http://localhost:5000';

async function apiFetch(endpoint) {
  try {
    const res = await fetch(API_BASE + endpoint);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    notifyError('Lỗi kết nối backend: ' + e.message);
    return null;
  }
}

function notifyError(msg) {
  const el = document.getElementById('notif');
  el.textContent = '✕ ' + msg;
  el.style.borderColor = 'var(--accent2)';
  el.style.color = 'var(--accent2)';
  el.classList.add('show');
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => {
    el.classList.remove('show');
    el.style.borderColor = '';
    el.style.color = '';
  }, 3500);
}

// =========================================================
// DATA SIMULATION (fallback khi chưa có backend)
// =========================================================
const cities    = ['Hà Nội','TP.HCM','Đà Nẵng','Hải Phòng','Cần Thơ'];
const bangs     = ['Miền Bắc','Miền Nam','Miền Trung','Miền Bắc','Miền Nam'];
const items     = ['Áo sơ mi','Quần jeans','Giày thể thao','Túi xách','Mũ lưỡi trai','Kính mắt','Đồng hồ'];
const stores    = ['CH001','CH002','CH003','CH004','CH005','CH006'];
const storeCity = [0,0,1,1,2,3];

function rand(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function fmt(n){
  if (n === null || n === undefined) return '—';
  if (typeof n === 'number') return n.toLocaleString('vi-VN');
  return n;
}

const invData = cities.map((c,i)=>({
  city: c, bang: bangs[i],
  stock: rand(300,1200),
  stores: rand(2,5),
  items: rand(4,7)
}));

const orders = [];
for(let i=1;i<=20;i++){
  const ci = rand(0,4), ii = rand(0,6), qty = rand(1,50);
  orders.push({
    ma_don: `ORD${String(i).padStart(3,'0')}`,
    ten_kh: `KH_${String(rand(1,8)).padStart(2,'0')}`,
    loai_kh: rand(0,1)?'Du lịch':'Bưu điện',
    mat_hang: items[ii],
    city: cities[ci],
    qty, price: rand(50,500)*1000,
    quy: `Q${rand(1,4)}`, nam: rand(2022,2024)
  });
}

// =========================================================
// HELPER — Highlight SQL syntax
// =========================================================
function highlightSQL(sql) {
  if (!sql) return '';
  const keywords = ['SELECT','FROM','JOIN','WHERE','GROUP BY','ORDER BY',
                    'HAVING','ON','AS','AND','OR','IN','NOT','DISTINCT',
                    'SUM','AVG','COUNT','MAX','MIN','CASE','WHEN','THEN','ELSE','END',
                    'LEFT','RIGHT','INNER','OUTER','CREATE','INDEX'];
  let out = sql
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  keywords.forEach(kw => {
    const re = new RegExp(`\\b(${kw})\\b`, 'gi');
    out = out.replace(re, `<span class="sql-kw">$1</span>`);
  });
  out = out.replace(/'([^']*)'/g, `<span class="sql-str">'$1'</span>`);
  out = out.replace(/\b(\d+)\b/g, `<span class="sql-num">$1</span>`);
  out = out.replace(/--.*/g, m => `<span class="sql-comment">${m}</span>`);
  return `<span class="sql-label">SQL</span>` + out;
}

// =========================================================
// Helper — Render bảng kết quả từ array of objects
// =========================================================
function renderTable(containerId, data, title = '') {
  const el = document.getElementById(containerId);
  if (!data || data.length === 0) {
    el.innerHTML = `<div class="result-meta"><span class="result-count">0 dòng</span><span>Không có dữ liệu</span></div>`;
    return;
  }
  const keys = Object.keys(data[0]);
  const numericKeys = new Set(
    keys.filter(k => data.every(r => r[k] === null || typeof r[k] === 'number'))
  );

  let html = `<div class="result-meta">
    <span class="result-count">${data.length} dòng</span>
    ${title ? `<span>${title}</span>` : ''}
  </div>`;

  html += `<div class="tbl-wrap"><table><thead><tr>`;
  keys.forEach(k => { html += `<th>${k}</th>`; });
  html += `</tr></thead><tbody>`;

  data.forEach(row => {
    html += '<tr>';
    keys.forEach(k => {
      const v = row[k] ?? '—';
      const isNum = numericKeys.has(k) && typeof v === 'number';
      const isTag = k.toLowerCase().includes('ma_') || k.toLowerCase().includes('id');
      if (isTag && typeof v === 'string') {
        html += `<td class="tag">${v}</td>`;
      } else if (isNum) {
        html += `<td class="num">${fmt(v)}</td>`;
      } else {
        html += `<td>${v}</td>`;
      }
    });
    html += '</tr>';
  });

  html += `</tbody></table></div>`;
  el.innerHTML = html;
}

// =========================================================
// PANEL NAVIGATION
// =========================================================
const panels = document.querySelectorAll('.panel');
const navBtns = document.querySelectorAll('.nav-btn');

function showPanel(id){
  panels.forEach(p => p.classList.remove('active'));
  navBtns.forEach(b => b.classList.remove('active'));
  document.getElementById('panel-'+id).classList.add('active');
  event.currentTarget && event.currentTarget.classList.add('active');

  if(id==='inventory') initInventory();
  if(id==='orders')    initOrders();
  if(id==='metadata')  initMetadata();
  if(id==='reports')   selectReport(1);
}

// =========================================================
// HIERARCHY STATE
// =========================================================
let locLevel = 0, timeLevel = 0;

function setHier(dim, level){
  locLevel = level;
  document.querySelectorAll('#hier-location .hier-node').forEach((n,i)=>{
    n.classList.toggle('active', i===level);
  });
}
function setHierTime(level){
  timeLevel = level;
  document.querySelectorAll('#hier-time .hier-node').forEach((n,i)=>{
    n.classList.toggle('active', i===level);
  });
}

// =========================================================
// ROLL-UP  (giữ nguyên logic cũ, thêm gọi API)
// =========================================================
const locCols   = ['Ma_CH', 'Ten_TP', 'Bang', "'Tất cả' AS Pham_Vi"];
const locLabels = ['Cửa hàng','Thành phố','Bang','Tất cả'];
const timeCols  = ['t.Ngay','t.Thang','t.Quy','t.Nam'];
const timeLabels= ['Ngày','Tháng','Quý','Năm'];

const measureMap = {
  'SUM(f.So_Luong_Ton_Kho)': 'stock',
  'SUM(f.So_Luong_Dat)':     'ordered',
  'SUM(f.Tong_Tien)':        'revenue',
  'AVG(f.So_Luong_Ton_Kho)': 'avg'
};

async function runRollup(){
  const measureRaw = document.getElementById('ru-measure').value;
  const mh         = document.getElementById('ru-mh').value;
  const measure    = measureMap[measureRaw] || 'stock';

  const params = new URLSearchParams({ locLevel, timeLevel, measure, mh });
  const json   = await apiFetch(`/api/rollup/?${params}`);

  if (json) {
    // Hiển thị SQL thật từ backend
    document.getElementById('ru-sql').innerHTML = highlightSQL(json.sql);
    renderTable('ru-result', json.data,
      `Mức: ${locLabels[locLevel]} | Thời gian: ${timeLabels[timeLevel]}`);
    notify(`Roll-up thực thi — ${json.count} dòng`);
  } else {
    // Fallback dữ liệu giả
    _rollupFallback(measureRaw, mh);
  }
}

function _rollupFallback(measure, mh) {
  const locCol  = locCols[locLevel];
  const timeCol = timeCols[timeLevel];
  const mhCond  = mh
    ? `\n  <span class="sql-kw">AND</span> f.Ma_MH = <span class="sql-str">'${mh}'</span>`
    : '';
  const sql = `<span class="sql-label">SQL</span><span class="sql-kw">SELECT</span>
  ${locCol} <span class="sql-kw">AS</span> Dia_Diem,
  ${timeCol} <span class="sql-kw">AS</span> Thoi_Gian,
  <span class="sql-fn">${measure}</span> <span class="sql-kw">AS</span> So_Luong
<span class="sql-kw">FROM</span> Fact_Ton_Kho f
<span class="sql-kw">JOIN</span> Dim_Cua_Hang c <span class="sql-kw">ON</span> f.Ma_CH = c.Ma_CH
<span class="sql-kw">JOIN</span> Dim_Dia_Diem d <span class="sql-kw">ON</span> c.Ma_TP = d.Ma_TP
<span class="sql-kw">JOIN</span> Dim_Time t <span class="sql-kw">ON</span> f.Time_key = t.Time_key
<span class="sql-kw">JOIN</span> Dim_Mat_Hang m <span class="sql-kw">ON</span> f.Ma_MH = m.Ma_MH${mhCond}
<span class="sql-kw">GROUP BY</span> ${locCol}, ${timeCol}
<span class="sql-kw">ORDER BY</span> So_Luong <span class="sql-kw">DESC</span>`;
  document.getElementById('ru-sql').innerHTML = sql;

  let rows = [];
  if(locLevel===0) stores.forEach((s,i)=>rows.push({dim1:s,dim2:cities[storeCity[i]],val:rand(100,800)}));
  else if(locLevel===1) cities.forEach(c=>rows.push({dim1:c,dim2:'',val:rand(500,2000)}));
  else if(locLevel===2) ['Miền Bắc','Miền Nam','Miền Trung'].forEach(b=>rows.push({dim1:b,dim2:'',val:rand(1500,5000)}));
  else rows.push({dim1:'Tất cả',dim2:'',val:rand(8000,15000)});

  const tL = timeLabels[timeLevel], lL = locLabels[locLevel];
  let html = `<div class="result-meta"><span class="result-count">${rows.length} dòng</span><span>Mức: ${lL} | ${tL}</span></div>`;
  html += `<div class="tbl-wrap"><table><thead><tr><th>${lL}</th>${locLevel<2?'<th>Thành phố</th>':''}<th>Tổng</th></tr></thead><tbody>`;
  rows.forEach(r=>{
    html += `<tr><td>${r.dim1}</td>${locLevel<2?`<td>${r.dim2}</td>`:''}<td class="num">${fmt(r.val)}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  document.getElementById('ru-result').innerHTML = html;
  notify('Roll-up (dữ liệu mẫu) — ' + rows.length + ' dòng');
}

// =========================================================
// DRILL DOWN (thêm gọi API)
// =========================================================
let ddPath = [];

async function drillInto(city){
  ddPath = [city];

  document.getElementById('dd-breadcrumb').innerHTML =
    `<span style="color:var(--muted);cursor:pointer" onclick="resetDrill()">Tất cả</span>
     <span class="sep"> / </span><span>${city}</span>`;

  const json = await apiFetch(`/api/drilldown/city?city=${encodeURIComponent(city)}`);
  if (json) {
    document.getElementById('dd-sql').innerHTML = highlightSQL(json.sql);
    // Thêm nút drill xuống mặt hàng
    const dataWithBtn = json.data.map(r => ({ ...r, _action: r.Ma_CH }));
    let html = `<div class="result-meta"><span class="result-count">${json.data.length} cửa hàng</span><span>Thành phố: ${city}</span></div>`;
    html += `<div class="tbl-wrap"><table><thead><tr><th>Mã CH</th><th>Thành phố</th><th>SĐT</th><th>Tồn kho</th><th>Thao tác</th></tr></thead><tbody>`;
    json.data.forEach(r => {
      html += `<tr>
        <td class="tag">${r.Ma_CH}</td>
        <td>${r.Ten_TP}</td>
        <td style="font-family:var(--mono)">${r.SDT || '—'}</td>
        <td class="num">${fmt(r.Tong_Ton_Kho)}</td>
        <td><button class="btn btn-ghost" style="font-size:0.7rem;padding:2px 8px"
            onclick="drillItem('${r.Ma_CH}')">↓ Mặt hàng</button></td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
    document.getElementById('dd-result').innerHTML = html;
    notify(`Drill-down: ${city} → ${json.data.length} cửa hàng`);
  } else {
    _drillIntoFallback(city);
  }
}

async function drillItem(ch){
  ddPath.push(ch);
  const lastCity = ddPath[0];

  document.getElementById('dd-breadcrumb').innerHTML =
    `<span style="color:var(--muted);cursor:pointer" onclick="resetDrill()">Tất cả</span>
     <span class="sep"> / </span>
     <span style="color:var(--muted);cursor:pointer" onclick="drillInto('${lastCity}')">${lastCity}</span>
     <span class="sep"> / </span><span>${ch}</span>`;

  const json = await apiFetch(`/api/drilldown/store?ma_ch=${encodeURIComponent(ch)}`);
  if (json) {
    document.getElementById('dd-sql').innerHTML = highlightSQL(json.sql);
    renderTable('dd-result', json.data, `Cửa hàng: ${ch}`);
    notify(`Drill-down: ${ch} → ${json.data.length} mặt hàng`);
  } else {
    _drillItemFallback(ch, lastCity);
  }
}

function resetDrill(){
  ddPath = [];
  document.getElementById('dd-breadcrumb').innerHTML = '<span>Tất cả</span>';
  document.getElementById('dd-sql').innerHTML = '<span class="sql-comment">-- Click vào thành phố để khoan xuống cấp cửa hàng</span>';
  document.getElementById('dd-result').innerHTML = '';
}

// Fallback drill
function _drillIntoFallback(city){
  const storeCount = rand(2,4);
  let rows = [];
  for(let i=0;i<storeCount;i++){
    rows.push({ ma_ch:`CH${String(rand(1,20)).padStart(3,'0')}`, city,
      sdt:`0${rand(900,999)}.${rand(100,999)}.${rand(1000,9999)}`, stock:rand(100,600) });
  }
  let html = `<div class="result-meta"><span class="result-count">${rows.length} cửa hàng</span></div>`;
  html += `<div class="tbl-wrap"><table><thead><tr><th>Mã CH</th><th>Thành phố</th><th>SĐT</th><th>Tồn kho</th><th>Thao tác</th></tr></thead><tbody>`;
  rows.forEach(r=>{
    html += `<tr><td class="tag">${r.ma_ch}</td><td>${r.city}</td>
      <td style="font-family:var(--mono)">${r.sdt}</td>
      <td class="num">${fmt(r.stock)}</td>
      <td><button class="btn btn-ghost" style="font-size:0.7rem;padding:2px 8px"
          onclick="drillItem('${r.ma_ch}')">↓ Mặt hàng</button></td></tr>`;
  });
  html += `</tbody></table></div>`;
  document.getElementById('dd-result').innerHTML = html;
}
function _drillItemFallback(ch){
  let rows = [];
  for(let i=0;i<rand(3,5);i++){
    const ii=rand(0,6);
    rows.push({ma_mh:`MH${String(i+1).padStart(3,'0')}`,mo_ta:items[ii],qty:rand(10,200),gia:rand(50,500)*1000});
  }
  let html = `<div class="result-meta"><span class="result-count">${rows.length} mặt hàng</span></div>`;
  html += `<div class="tbl-wrap"><table><thead><tr><th>Mã MH</th><th>Mô tả</th><th>SL kho</th><th>Đơn giá</th></tr></thead><tbody>`;
  rows.forEach(r=>{
    html += `<tr><td class="tag">${r.ma_mh}</td><td>${r.mo_ta}</td><td class="num">${r.qty}</td><td class="num">${fmt(r.gia)}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  document.getElementById('dd-result').innerHTML = html;
}

// =========================================================
// SLICE & DICE (thêm gọi API)
// =========================================================
async function runSlice(){
  const city  = document.getElementById('sl-city').value;
  const quy   = document.getElementById('sl-quarter').value;
  const nam   = document.getElementById('sl-year').value;
  const kh    = document.getElementById('sl-kh').value;
  const mins  = document.getElementById('sl-minstock').value;

  const params = new URLSearchParams();
  if(city) params.append('city', city);
  if(quy)  params.append('quarter', quy);
  if(nam)  params.append('year', nam);
  if(kh)   params.append('loai_kh', kh);
  if(mins) params.append('min_stock', mins);

  const json = await apiFetch(`/api/slice/?${params}`);
  if (json) {
    document.getElementById('sl-sql').innerHTML = highlightSQL(json.sql);
    renderTable('sl-result', json.data, `${params.toString().split('&').length} điều kiện lọc`);
    notify(`Slice&Dice: ${json.count} dòng`);
  } else {
    _sliceFallback(city, quy, nam, kh);
  }
}

function _sliceFallback(city, quy, nam, kh) {
  let data = orders.filter(o=>{
    if(city && o.city!==city) return false;
    if(quy  && o.quy!==quy)   return false;
    if(nam  && o.nam!==parseInt(nam)) return false;
    if(kh   && o.loai_kh!==kh) return false;
    return true;
  });
  let html = `<div class="result-meta"><span class="result-count">${data.length} dòng</span></div>`;
  html += `<div class="tbl-wrap"><table><thead><tr><th>Thành phố</th><th>Quý</th><th>Năm</th><th>Loại KH</th><th>Mặt hàng</th><th>Doanh thu</th></tr></thead><tbody>`;
  data.slice(0,15).forEach(r=>{
    html += `<tr><td>${r.city}</td><td>${r.quy}</td><td class="num">${r.nam}</td>
      <td>${r.loai_kh}</td><td>${r.mat_hang}</td><td class="num">${fmt(r.price)}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  document.getElementById('sl-result').innerHTML = html;
}

function clearSlice(){
  ['sl-city','sl-quarter','sl-year','sl-kh'].forEach(id=>{ document.getElementById(id).value=''; });
  document.getElementById('sl-minstock').value = '';
  document.getElementById('sl-sql').innerHTML = '<span class="sql-comment">-- Điều kiện đã xóa</span>';
  document.getElementById('sl-result').innerHTML = '';
}

// =========================================================
// PIVOT — Gọi API thật
// =========================================================
const pvRowMap = { city:'city', item:'item', customer:'customer' };
const pvColMap = { quarter:'quarter', year:'year' };
const pvMsrMap = { revenue:'revenue', qty:'qty', stock:'stock' };

async function runPivot(){
  const rowDim  = document.getElementById('pv-row').value;
  const colDim  = document.getElementById('pv-col').value;
  const measure = document.getElementById('pv-measure').value;

  const row_dim = pvRowMap[rowDim]  || 'city';
  const col_dim = pvColMap[colDim]  || 'quarter';
  const msr     = pvMsrMap[measure] || 'revenue';

  const params = new URLSearchParams({ row_dim, col_dim, measure: msr });
  const json   = await apiFetch(`/api/pivot/?${params}`);

  if (json) {
    document.getElementById('pv-sql').innerHTML = highlightSQL(json.sql);
    _renderPivotTable(json);
    notify(`Pivot: ${json.rows.length} hàng × ${json.columns.length} cột`);
  } else {
    _pivotFallback(rowDim, colDim, measure);
  }
}

function _renderPivotTable(json) {
  const { columns, rows, col_totals } = json;
  const rowLabels = { city:'Thành phố', item:'Mặt hàng', customer:'Loại KH' };

  let html = `<div class="result-meta">
    <span class="result-count">${rows.length}×${columns.length}</span>
    <span>${rows.length} hàng — ${columns.join(', ')}</span>
  </div>`;

  html += `<div class="pivot-wrap"><table class="pivot-table"><thead><tr>
    <th class="pivot-corner">Nhãn</th>`;
  columns.forEach(c => { html += `<th class="pivot-col-h">${c}</th>`; });
  html += `</tr></thead><tbody>`;

  rows.forEach(row => {
    html += `<tr><td class="pivot-row-h">${row.Nhan || '—'}</td>`;
    columns.forEach(c => {
      const v = row[c] ?? 0;
      const cls = c === 'Tổng' ? 'pivot-val pivot-total' : 'pivot-val';
      html += `<td class="${cls}">${fmt(v)}</td>`;
    });
    html += `</tr>`;
  });

  // Dòng tổng cột
  html += `<tr><td class="pivot-row-h" style="color:var(--accent2)">Tổng</td>`;
  columns.forEach(c => {
    const v = col_totals[c] ?? 0;
    html += `<td class="pivot-val pivot-total">${fmt(v)}</td>`;
  });
  html += `</tr></tbody></table></div>`;

  document.getElementById('pv-result').innerHTML = html;
}

function _pivotFallback(rowDim, colDim, measure) {
  const rowLabels = {city:'Thành phố', item:'Mặt hàng', customer:'Loại KH'};
  const measureLabels = {revenue:'Doanh thu (triệu)', qty:'Số lượng', stock:'Tồn kho'};
  const rows = rowDim==='city' ? cities.slice(0,4)
             : rowDim==='item' ? items.slice(0,5)
             : ['Du lịch','Bưu điện'];
  const cols = colDim==='quarter' ? ['Q1','Q2','Q3','Q4'] : ['2022','2023','2024'];

  const data = {};
  rows.forEach(r=>{ data[r]={}; cols.forEach(c=>{ data[r][c]=rand(50,900); }); });

  let html = `<div class="result-meta"><span class="result-count">${rows.length}×${cols.length}</span>
    <span>${rowLabels[rowDim]} × ${colDim} — ${measureLabels[measure]}</span></div>`;
  html += `<div class="pivot-wrap"><table class="pivot-table"><thead><tr>
    <th class="pivot-corner">${rowLabels[rowDim]}</th>`;
  cols.forEach(c=>{ html+=`<th class="pivot-col-h">${c}</th>`; });
  html += `<th class="pivot-col-h" style="color:var(--accent2)">Tổng</th></tr></thead><tbody>`;
  rows.forEach(r=>{
    const rowTotal = cols.reduce((s,c)=>s+data[r][c],0);
    html += `<tr><td class="pivot-row-h">${r}</td>`;
    cols.forEach(c=>{ html+=`<td class="pivot-val">${fmt(data[r][c])}</td>`; });
    html += `<td class="pivot-val pivot-total">${fmt(rowTotal)}</td></tr>`;
  });
  html += `<tr><td class="pivot-row-h" style="color:var(--accent2)">Tổng</td>`;
  cols.forEach(c=>{
    const ct = rows.reduce((s,r)=>s+data[r][c],0);
    html+=`<td class="pivot-val pivot-total">${fmt(ct)}</td>`;
  });
  html += `<td class="pivot-val pivot-total">${fmt(rows.reduce((s,r)=>s+cols.reduce((ss,c)=>ss+data[r][c],0),0))}</td></tr>`;
  html += `</tbody></table></div>`;
  document.getElementById('pv-result').innerHTML = html;
  notify('Pivot (dữ liệu mẫu): ' + rows.length + ' hàng × ' + cols.length + ' cột');
}

// =========================================================
// 9 BÁO CÁO OLAP — Gọi API thật
// =========================================================

// Định nghĩa metadata cho mỗi báo cáo
const reportDefs = [
  {
    num: 1,
    title: 'Q1 — Cửa hàng & mặt hàng đang lưu kho',
    endpoint: '/api/reports/q1',
    params: [],
    buildParams: () => ({})
  },
  {
    num: 2,
    title: 'Q2 — Đơn đặt hàng & tên khách hàng',
    endpoint: '/api/reports/q2',
    params: [],
    buildParams: () => ({})
  },
  {
    num: 3,
    title: 'Q3 — Cửa hàng có bán mặt hàng đặt bởi khách hàng',
    endpoint: '/api/reports/q3',
    params: [{ id:'q3-kh', label:'Mã khách hàng', type:'text', placeholder:'VD: KH_01' }],
    buildParams: () => ({ ma_kh: document.getElementById('q3-kh')?.value || 'KH_01' })
  },
  {
    num: 4,
    title: 'Q4 — Văn phòng đại diện lưu kho trên mức cụ thể',
    endpoint: '/api/reports/q4',
    params: [{ id:'q4-min', label:'Số lượng tối thiểu', type:'number', placeholder:'VD: 100' }],
    buildParams: () => ({ min_qty: document.getElementById('q4-min')?.value || 100 })
  },
  {
    num: 5,
    title: 'Q5 — Mặt hàng trong đơn & cửa hàng có bán',
    endpoint: '/api/reports/q5',
    params: [{ id:'q5-don', label:'Mã đơn đặt hàng', type:'text', placeholder:'VD: ORD001' }],
    buildParams: () => ({ ma_don: document.getElementById('q5-don')?.value || 'ORD001' })
  },
  {
    num: 6,
    title: 'Q6 — Thành phố & bang của khách hàng',
    endpoint: '/api/reports/q6',
    params: [{ id:'q6-kh', label:'Mã khách hàng', type:'text', placeholder:'VD: KH_03' }],
    buildParams: () => ({ ma_kh: document.getElementById('q6-kh')?.value || 'KH_03' })
  },
  {
    num: 7,
    title: 'Q7 — Mức tồn kho mặt hàng tại thành phố',
    endpoint: '/api/reports/q7',
    params: [
      { id:'q7-mh',   label:'Mã mặt hàng', type:'text', placeholder:'VD: MH001' },
      { id:'q7-city', label:'Thành phố',    type:'text', placeholder:'VD: Hà Nội' }
    ],
    buildParams: () => ({
      ma_mh: document.getElementById('q7-mh')?.value   || 'MH001',
      city:  document.getElementById('q7-city')?.value || 'Hà Nội'
    })
  },
  {
    num: 8,
    title: 'Q8 — Chi tiết đầy đủ một đơn đặt hàng',
    endpoint: '/api/reports/q8',
    params: [{ id:'q8-don', label:'Mã đơn', type:'text', placeholder:'VD: ORD005' }],
    buildParams: () => ({ ma_don: document.getElementById('q8-don')?.value || 'ORD005' })
  },
  {
    num: 9,
    title: 'Q9 — Phân loại khách hàng (du lịch / bưu điện / cả hai)',
    endpoint: '/api/reports/q9',
    params: [],
    buildParams: () => ({})
  }
];

let currentReport = 0;

function selectReport(n){
  currentReport = n - 1;
  document.querySelectorAll('.report-card').forEach((c,i) =>
    c.classList.toggle('active', i === n-1)
  );

  const rpt = reportDefs[n-1];
  document.getElementById('rpt-title').textContent = rpt.title;

  // Build param inputs
  let ph = '';
  rpt.params.forEach(p => {
    ph += `<div class="ctrl-group">
      <label>${p.label}</label>
      <input type="${p.type}" id="${p.id}" placeholder="${p.placeholder}">
    </div>`;
  });
  ph += `<button class="btn btn-primary" onclick="runReport()">▶ Chạy báo cáo</button>`;
  document.getElementById('rpt-params').innerHTML = ph;

  // Hiển thị SQL preview (từ backend sẽ cập nhật sau khi chạy)
  document.getElementById('rpt-sql').innerHTML =
    `<span class="sql-comment">-- Nhấn "Chạy báo cáo" để thực thi và xem SQL thật</span>`;
  document.getElementById('rpt-result').innerHTML = '';
}

async function runReport(){
  const rpt    = reportDefs[currentReport];
  const params = rpt.buildParams();

  // Build query string
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([,v]) => v !== '' && v !== null))
  );

  const endpoint = `${rpt.endpoint}${qs.toString() ? '?' + qs : ''}`;
  const json     = await apiFetch(endpoint);

  if (json) {
    document.getElementById('rpt-sql').innerHTML = highlightSQL(json.sql);
    renderTable('rpt-result', json.data, rpt.title);
    notify(`Báo cáo Q${rpt.num} — ${json.count} dòng kết quả`);
  } else {
    // Fallback: hiển thị thông báo lỗi
    document.getElementById('rpt-result').innerHTML =
      `<div class="result-meta">
        <span style="color:var(--accent2)">⚠ Không thể kết nối backend. Kiểm tra server đang chạy tại ${API_BASE}</span>
      </div>`;
  }
}

// =========================================================
// INVENTORY PANEL
// =========================================================
function initInventory(){
  const sql = `<span class="sql-kw">SELECT</span>
  d.Ten_TP,
  <span class="sql-fn">COUNT</span>(<span class="sql-kw">DISTINCT</span> c.Ma_CH) <span class="sql-kw">AS</span> So_Cua_Hang,
  <span class="sql-fn">SUM</span>(f.So_Luong_Ton_Kho) <span class="sql-kw">AS</span> Tong_Ton_Kho
<span class="sql-kw">FROM</span> Dim_Dia_Diem d
<span class="sql-kw">JOIN</span> Dim_Cua_Hang c <span class="sql-kw">ON</span> c.Ma_TP = d.Ma_TP
<span class="sql-kw">JOIN</span> Fact_Ton_Kho f <span class="sql-kw">ON</span> f.Ma_CH = c.Ma_CH
<span class="sql-kw">GROUP BY</span> d.Ten_TP
<span class="sql-kw">ORDER BY</span> Tong_Ton_Kho <span class="sql-kw">DESC</span>`;
  document.getElementById('inv-sql').innerHTML = sql + `<span class="sql-label">SQL</span>`;

  const max = Math.max(...invData.map(r=>r.stock));
  const colors = ['var(--accent)','var(--accent3)','var(--accent2)','#a78bfa','#f59e0b'];
  let barHtml = '';
  invData.forEach((r,i)=>{
    const pct = Math.round(r.stock/max*100);
    barHtml += `<div class="bar-row">
      <div class="bar-label">${r.city}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${pct}%;background:${colors[i%5]}">
          <span class="bar-val">${fmt(r.stock)}</span>
        </div>
      </div>
    </div>`;
  });
  document.getElementById('inv-bar').innerHTML = barHtml;

  let tbl = `<div class="result-meta"><span class="result-count">${invData.length} thành phố</span></div>`;
  tbl += `<div class="tbl-wrap"><table><thead><tr><th>Thành phố</th><th>Bang</th><th>Cửa hàng</th><th>Mặt hàng</th><th>Tổng tồn kho</th></tr></thead><tbody>`;
  invData.forEach(r=>{
    tbl += `<tr><td>${r.city}</td><td>${r.bang}</td><td class="num">${r.stores}</td><td class="num">${r.items}</td><td class="num">${fmt(r.stock)}</td></tr>`;
  });
  tbl += `</tbody></table></div>`;
  document.getElementById('inv-result').innerHTML = tbl;
}

// =========================================================
// ORDERS PANEL
// =========================================================
function initOrders(){
  let tbl = `<div class="result-meta"><span class="result-count">${orders.length} đơn hàng</span></div>`;
  tbl += `<div class="tbl-wrap"><table><thead><tr><th>Mã đơn</th><th>Tên KH</th><th>Loại</th><th>Mặt hàng</th><th>Thành phố</th><th>SL</th><th>Doanh thu</th><th>Quý</th><th>Năm</th></tr></thead><tbody>`;
  orders.forEach(r=>{
    tbl += `<tr>
      <td class="tag">${r.ma_don}</td>
      <td>${r.ten_kh}</td>
      <td style="font-size:0.72rem">${r.loai_kh}</td>
      <td>${r.mat_hang}</td>
      <td>${r.city}</td>
      <td class="num">${r.qty}</td>
      <td class="num">${fmt(r.price)}</td>
      <td>${r.quy}</td>
      <td class="num">${r.nam}</td>
    </tr>`;
  });
  tbl += `</tbody></table></div>`;
  document.getElementById('orders-tab-table').innerHTML = tbl;

  const revenueByCity = {};
  cities.forEach(c=>{ revenueByCity[c]=0; });
  orders.forEach(o=>{ revenueByCity[o.city]=(revenueByCity[o.city]||0)+o.price; });
  const maxRev = Math.max(...Object.values(revenueByCity));
  const colors2 = ['var(--accent)','var(--accent3)','var(--accent2)','#a78bfa','#f59e0b'];
  let ch = `<div class="card"><div class="card-title">Doanh thu theo thành phố (VNĐ)</div><div class="bar-chart">`;
  cities.forEach((c,i)=>{
    const pct = Math.round(revenueByCity[c]/maxRev*100);
    ch += `<div class="bar-row">
      <div class="bar-label">${c}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${pct}%;background:${colors2[i]}">
          <span class="bar-val">${(revenueByCity[c]/1000000).toFixed(1)}M</span>
        </div>
      </div>
    </div>`;
  });
  ch += `</div></div>`;
  document.getElementById('orders-tab-chart').innerHTML = ch;
}

// =========================================================
// METADATA
// =========================================================
function initMetadata(){
  const sql = `<span class="sql-comment">-- Index tối ưu trên Fact_Ton_Kho</span>
<span class="sql-kw">CREATE INDEX</span> idx_fton_time <span class="sql-kw">ON</span> Fact_Ton_Kho(Time_key);
<span class="sql-kw">CREATE INDEX</span> idx_fton_ch <span class="sql-kw">ON</span> Fact_Ton_Kho(Ma_CH);
<span class="sql-kw">CREATE INDEX</span> idx_fton_mh <span class="sql-kw">ON</span> Fact_Ton_Kho(Ma_MH);
<span class="sql-kw">CREATE INDEX</span> idx_fton_composite <span class="sql-kw">ON</span> Fact_Ton_Kho(Time_key, Ma_CH, Ma_MH);

<span class="sql-comment">-- Index tối ưu trên Fact_Order</span>
<span class="sql-kw">CREATE INDEX</span> idx_ford_time <span class="sql-kw">ON</span> Fact_Order(Time_key);
<span class="sql-kw">CREATE INDEX</span> idx_ford_kh <span class="sql-kw">ON</span> Fact_Order(Ma_KH);
<span class="sql-kw">CREATE INDEX</span> idx_ford_mh <span class="sql-kw">ON</span> Fact_Order(Ma_MH);
<span class="sql-kw">CREATE INDEX</span> idx_ford_composite <span class="sql-kw">ON</span> Fact_Order(Time_key, Ma_KH, Ma_MH);

<span class="sql-comment">-- Index trên bảng Dimension</span>
<span class="sql-kw">CREATE INDEX</span> idx_ddiem_tp <span class="sql-kw">ON</span> Dim_Dia_Diem(Ten_TP);
<span class="sql-kw">CREATE INDEX</span> idx_ddiem_bang <span class="sql-kw">ON</span> Dim_Dia_Diem(Bang);
<span class="sql-kw">CREATE INDEX</span> idx_time_quy_nam <span class="sql-kw">ON</span> Dim_Time(Quy, Nam);
<span class="sql-kw">CREATE INDEX</span> idx_kh_loai <span class="sql-kw">ON</span> Dim_Khach_Hang(Loai_KH);`;
  document.getElementById('meta-sql').innerHTML = sql + `<span class="sql-label">DDL</span>`;
}

// =========================================================
// TABS
// =========================================================
function switchTab(panel, tab){
  const tabs  = document.querySelectorAll(`#panel-${panel} .tab-btn`);
  const panes = document.querySelectorAll(`#panel-${panel} .tab-panel`);
  tabs.forEach(t=>t.classList.remove('active'));
  panes.forEach(p=>p.classList.remove('active'));
  event.currentTarget.classList.add('active');
  document.getElementById(`${panel}-tab-${tab}`).classList.add('active');
}

// =========================================================
// NOTIFICATION
// =========================================================
let notifTimer;
function notify(msg){
  const el = document.getElementById('notif');
  el.textContent = '✓ ' + msg;
  el.style.borderColor = '';
  el.style.color = '';
  el.classList.add('show');
  clearTimeout(notifTimer);
  notifTimer = setTimeout(()=>el.classList.remove('show'), 2800);
}

// =========================================================
// INIT
// =========================================================
runRollup();
selectReport(1);