
// =========================================================
// DATA SIMULATION
// =========================================================
const cities = ['Hà Nội','TP.HCM','Đà Nẵng','Hải Phòng','Cần Thơ'];
const bangs  = ['Miền Bắc','Miền Nam','Miền Trung','Miền Bắc','Miền Nam'];
const items  = ['Áo sơ mi','Quần jeans','Giày thể thao','Túi xách','Mũ lưỡi trai','Kính mắt','Đồng hồ'];
const stores = ['CH001','CH002','CH003','CH004','CH005','CH006'];
const storeCity = [0,0,1,1,2,3];

function rand(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function fmt(n){ return n.toLocaleString('vi-VN'); }

// Inventory data
const invData = cities.map((c,i)=>({
  city: c, bang: bangs[i],
  stock: rand(300,1200),
  stores: rand(2,5),
  items: rand(4,7)
}));

// Order data
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
  if(id==='orders') initOrders();
  if(id==='metadata') initMetadata();
  if(id==='reports') selectReport(1);
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
// ROLL-UP
// =========================================================
const locCols = ['Ma_CH', 'Ten_TP', 'Bang', '\'Tất cả\' AS Pham_Vi'];
const locLabels = ['Cửa hàng','Thành phố','Bang','Tất cả'];
const timeCols = ['t.Ngay','t.Thang','t.Quy','t.Nam'];
const timeLabels = ['Ngày','Tháng','Quý','Năm'];

function runRollup(){
  const measure = document.getElementById('ru-measure').value;
  const mh = document.getElementById('ru-mh').value;
  const locCol = locCols[locLevel];
  const timeCol = timeCols[timeLevel];
  const mhCond = mh ? `\n  <span class="sql-kw">AND</span> f.Ma_MH = <span class="sql-str">'${mh}'</span>` : '';

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

  // Generate result data
  let rows = [];
  if(locLevel === 0){
    stores.forEach((s,i)=>{
      rows.push({ dim1: s, dim2: cities[storeCity[i]], val: rand(100,800) });
    });
  } else if(locLevel === 1){
    cities.forEach(c=>{ rows.push({ dim1: c, dim2:'', val: rand(500,2000) }); });
  } else if(locLevel === 2){
    ['Miền Bắc','Miền Nam','Miền Trung'].forEach(b=>{ rows.push({ dim1: b, dim2:'', val: rand(1500,5000) }); });
  } else {
    rows.push({ dim1:'Tất cả', dim2:'', val: rand(8000,15000) });
  }

  const timeLabel = timeLabels[timeLevel];
  const locLabel = locLabels[locLevel];

  let html = `<div class="result-meta"><span class="result-count">${rows.length} dòng</span><span>Mức địa điểm: ${locLabel} &nbsp;|&nbsp; Thời gian: ${timeLabel}</span></div>`;
  html += `<div class="tbl-wrap"><table><thead><tr><th>${locLabel}</th>${locLevel<2?`<th>Thành phố</th>`:''}<th>Tổng (${timeLabel})</th></tr></thead><tbody>`;
  rows.forEach(r=>{
    html += `<tr><td>${r.dim1}</td>${locLevel<2?`<td>${r.dim2}</td>`:''}<td class="num">${fmt(r.val)}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  document.getElementById('ru-result').innerHTML = html;
  notify('Roll-up thực thi thành công — ' + rows.length + ' dòng');
}

// =========================================================
// DRILL DOWN
// =========================================================
let ddPath = [];

function drillInto(city){
  ddPath = [city];
  const sql = `<span class="sql-label">SQL</span><span class="sql-kw">SELECT</span>
  c.Ma_CH, d.Ten_TP, c.SDT,
  <span class="sql-fn">SUM</span>(f.So_Luong_Ton_Kho) <span class="sql-kw">AS</span> Tong_Ton_Kho
<span class="sql-kw">FROM</span> Fact_Ton_Kho f
<span class="sql-kw">JOIN</span> Dim_Cua_Hang c <span class="sql-kw">ON</span> f.Ma_CH = c.Ma_CH
<span class="sql-kw">JOIN</span> Dim_Dia_Diem d <span class="sql-kw">ON</span> c.Ma_TP = d.Ma_TP
<span class="sql-kw">WHERE</span> d.Ten_TP = <span class="sql-str">'${city}'</span>
<span class="sql-kw">GROUP BY</span> c.Ma_CH, d.Ten_TP, c.SDT
<span class="sql-kw">ORDER BY</span> Tong_Ton_Kho <span class="sql-kw">DESC</span>`;
  document.getElementById('dd-sql').innerHTML = sql;

  // Update breadcrumb
  document.getElementById('dd-breadcrumb').innerHTML =
    `<span style="color:var(--muted);cursor:pointer" onclick="resetDrill()">Tất cả</span>
     <span class="sep"> / </span>
     <span>${city}</span>`;

  // Result
  const storeCount = rand(2,4);
  let rows = [];
  for(let i=0;i<storeCount;i++){
    rows.push({
      ma_ch: `CH${String(rand(1,20)).padStart(3,'0')}`,
      city, sdt: `0${rand(900,999)}.${rand(100,999)}.${rand(1000,9999)}`,
      stock: rand(100,600)
    });
  }

  let html = `<div class="result-meta"><span class="result-count">${rows.length} cửa hàng</span><span>Thành phố: ${city}</span></div>`;
  html += `<div class="tbl-wrap"><table><thead><tr><th>Mã CH</th><th>Thành phố</th><th>SĐT</th><th>Tồn kho</th><th>Thao tác</th></tr></thead><tbody>`;
  rows.forEach(r=>{
    html += `<tr>
      <td class="tag">${r.ma_ch}</td>
      <td>${r.city}</td>
      <td style="font-family:var(--mono)">${r.sdt}</td>
      <td class="num">${fmt(r.stock)}</td>
      <td><button class="btn btn-ghost" style="font-size:0.7rem;padding:2px 8px" onclick="drillItem('${r.ma_ch}')">↓ Mặt hàng</button></td>
    </tr>`;
  });
  html += `</tbody></table></div>`;
  document.getElementById('dd-result').innerHTML = html;
  notify('Drill-down: ' + city + ' → ' + storeCount + ' cửa hàng');
}

function drillItem(ch){
  ddPath.push(ch);
  const lastCity = ddPath[0];
  document.getElementById('dd-breadcrumb').innerHTML =
    `<span style="color:var(--muted);cursor:pointer" onclick="resetDrill()">Tất cả</span>
     <span class="sep"> / </span>
     <span style="color:var(--muted);cursor:pointer" onclick="drillInto('${lastCity}')">${lastCity}</span>
     <span class="sep"> / </span>
     <span>${ch}</span>`;

  let rows = [];
  for(let i=0;i<rand(3,5);i++){
    const ii = rand(0,6);
    rows.push({ ma_mh: `MH${String(i+1).padStart(3,'0')}`, mo_ta: items[ii], qty: rand(10,200), gia: rand(50,500)*1000 });
  }

  let html = `<div class="result-meta"><span class="result-count">${rows.length} mặt hàng</span><span>Cửa hàng: ${ch}</span></div>`;
  html += `<div class="tbl-wrap"><table><thead><tr><th>Mã MH</th><th>Mô tả</th><th>SL kho</th><th>Đơn giá</th></tr></thead><tbody>`;
  rows.forEach(r=>{
    html += `<tr><td class="tag">${r.ma_mh}</td><td>${r.mo_ta}</td><td class="num">${r.qty}</td><td class="num">${fmt(r.gia)}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  document.getElementById('dd-result').innerHTML = html;
  notify('Drill-down: ' + ch + ' → chi tiết mặt hàng');
}

function resetDrill(){
  ddPath = [];
  document.getElementById('dd-breadcrumb').innerHTML = '<span>Tất cả</span>';
  document.getElementById('dd-sql').innerHTML = '<span class="sql-comment">-- Click vào thành phố để khoan xuống cấp cửa hàng</span>';
  document.getElementById('dd-result').innerHTML = '';
}

// =========================================================
// SLICE & DICE
// =========================================================
function runSlice(){
  const city = document.getElementById('sl-city').value;
  const quy  = document.getElementById('sl-quarter').value;
  const nam  = document.getElementById('sl-year').value;
  const kh   = document.getElementById('sl-kh').value;
  const mins = document.getElementById('sl-minstock').value;

  const conditions = [];
  if(city) conditions.push(`d.Ten_TP = <span class="sql-str">'${city}'</span>`);
  if(quy)  conditions.push(`t.Quy = <span class="sql-str">'${quy}'</span>`);
  if(nam)  conditions.push(`t.Nam = <span class="sql-num">${nam}</span>`);
  if(kh)   conditions.push(`kh.Loai_KH = <span class="sql-str">'${kh}'</span>`);
  if(mins) conditions.push(`f.So_Luong_Ton_Kho > <span class="sql-num">${mins}</span>`);

  const whereClause = conditions.length
    ? `\n<span class="sql-kw">WHERE</span> ${conditions.join('\n  <span class="sql-kw">AND</span> ')}`
    : '';

  const sql = `<span class="sql-label">SQL</span><span class="sql-kw">SELECT</span>
  d.Ten_TP, t.Quy, t.Nam, kh.Loai_KH,
  <span class="sql-fn">SUM</span>(f.So_Luong_Ton_Kho) <span class="sql-kw">AS</span> Tong_Ton,
  <span class="sql-fn">SUM</span>(fo.Tong_Tien) <span class="sql-kw">AS</span> Doanh_Thu
<span class="sql-kw">FROM</span> Fact_Ton_Kho f
<span class="sql-kw">JOIN</span> Dim_Cua_Hang c <span class="sql-kw">ON</span> f.Ma_CH = c.Ma_CH
<span class="sql-kw">JOIN</span> Dim_Dia_Diem d <span class="sql-kw">ON</span> c.Ma_TP = d.Ma_TP
<span class="sql-kw">JOIN</span> Dim_Time t <span class="sql-kw">ON</span> f.Time_key = t.Time_key
<span class="sql-kw">JOIN</span> Fact_Order fo <span class="sql-kw">ON</span> fo.Ma_MH = f.Ma_MH
<span class="sql-kw">JOIN</span> Dim_Khach_Hang kh <span class="sql-kw">ON</span> fo.Ma_KH = kh.Ma_KH${whereClause}
<span class="sql-kw">GROUP BY</span> d.Ten_TP, t.Quy, t.Nam, kh.Loai_KH
<span class="sql-kw">ORDER BY</span> Doanh_Thu <span class="sql-kw">DESC</span>`;

  document.getElementById('sl-sql').innerHTML = sql;

  let data = orders.filter(o => {
    if(city && o.city !== city) return false;
    if(quy  && o.quy  !== quy)  return false;
    if(nam  && o.nam  !== parseInt(nam)) return false;
    if(kh   && o.loai_kh !== kh) return false;
    return true;
  });

  let html = `<div class="result-meta"><span class="result-count">${data.length} dòng</span><span>${conditions.length} điều kiện lọc</span></div>`;
  html += `<div class="tbl-wrap"><table><thead><tr><th>Thành phố</th><th>Quý</th><th>Năm</th><th>Loại KH</th><th>Mặt hàng</th><th>Doanh thu</th></tr></thead><tbody>`;
  data.slice(0,15).forEach(r=>{
    html += `<tr><td>${r.city}</td><td>${r.quy}</td><td class="num">${r.nam}</td><td>${r.loai_kh}</td><td>${r.mat_hang}</td><td class="num">${fmt(r.price)}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  document.getElementById('sl-result').innerHTML = html;
  notify(`Slice&Dice: ${data.length} dòng với ${conditions.length} điều kiện`);
}

function clearSlice(){
  ['sl-city','sl-quarter','sl-year','sl-kh'].forEach(id=>{ document.getElementById(id).value=''; });
  document.getElementById('sl-minstock').value = '';
  document.getElementById('sl-sql').innerHTML = '<span class="sql-comment">-- Điều kiện đã xóa</span>';
  document.getElementById('sl-result').innerHTML = '';
}

// =========================================================
// PIVOT
// =========================================================
function runPivot(){
  const rowDim = document.getElementById('pv-row').value;
  const colDim = document.getElementById('pv-col').value;
  const measure = document.getElementById('pv-measure').value;

  const rowLabels = {city:'Thành phố', item:'Mặt hàng', customer:'Loại KH'};
  const measureLabels = {revenue:'Doanh thu (triệu)', qty:'Số lượng', stock:'Tồn kho'};

  const rows = rowDim==='city' ? cities.slice(0,4)
             : rowDim==='item' ? items.slice(0,5)
             : ['Du lịch','Bưu điện'];

  const cols = colDim==='quarter' ? ['Q1','Q2','Q3','Q4'] : ['2022','2023','2024'];

  const sqlMeasure = measure==='revenue' ? 'SUM(fo.Tong_Tien)'
                   : measure==='qty' ? 'SUM(fo.So_Luong_Dat)'
                   : 'SUM(f.So_Luong_Ton_Kho)';

  const pivotCols = cols.map(c=>`<span class="sql-fn">SUM</span>(<span class="sql-kw">CASE WHEN</span> ${colDim==='quarter'?'t.Quy':'t.Nam'} = <span class="sql-str">'${c}'</span> <span class="sql-kw">THEN</span> ${sqlMeasure} <span class="sql-kw">ELSE</span> <span class="sql-num">0</span> <span class="sql-kw">END</span>) <span class="sql-kw">AS</span> [${c}]`).join(',\n  ');

  const sql = `<span class="sql-label">SQL PIVOT</span><span class="sql-kw">SELECT</span>
  ${rowDim==='city'?'d.Ten_TP': rowDim==='item'?'m.Mo_Ta':'kh.Loai_KH'} <span class="sql-kw">AS</span> ${rowLabels[rowDim]},
  ${pivotCols}
<span class="sql-kw">FROM</span> Fact_Order fo
<span class="sql-kw">JOIN</span> Dim_Time t <span class="sql-kw">ON</span> fo.Time_key = t.Time_key
<span class="sql-kw">JOIN</span> Dim_Mat_Hang m <span class="sql-kw">ON</span> fo.Ma_MH = m.Ma_MH
<span class="sql-kw">JOIN</span> Dim_Khach_Hang kh <span class="sql-kw">ON</span> fo.Ma_KH = kh.Ma_KH
<span class="sql-kw">JOIN</span> Dim_Cua_Hang c <span class="sql-kw">ON</span> fo.Ma_MH = c.Ma_CH
<span class="sql-kw">JOIN</span> Dim_Dia_Diem d <span class="sql-kw">ON</span> c.Ma_TP = d.Ma_TP
<span class="sql-kw">GROUP BY</span> ${rowDim==='city'?'d.Ten_TP': rowDim==='item'?'m.Mo_Ta':'kh.Loai_KH'}`;

  document.getElementById('pv-sql').innerHTML = sql;

  // Build pivot table
  const data = {};
  rows.forEach(r=>{ data[r]={}; cols.forEach(c=>{ data[r][c]=rand(50,900); }); });

  let html = `<div class="result-meta"><span class="result-count">${rows.length}×${cols.length}</span><span>${rowLabels[rowDim]} × ${colDim} — ${measureLabels[measure]}</span></div>`;
  html += `<div class="pivot-wrap"><table class="pivot-table"><thead><tr><th class="pivot-corner">${rowLabels[rowDim]}</th>`;
  cols.forEach(c=>{ html+=`<th class="pivot-col-h">${c}</th>`; });
  html += `<th class="pivot-col-h" style="color:var(--accent2)">Tổng</th></tr></thead><tbody>`;

  rows.forEach(r=>{
    const rowTotal = cols.reduce((s,c)=>s+data[r][c],0);
    html += `<tr><td class="pivot-row-h">${r}</td>`;
    cols.forEach(c=>{ html+=`<td class="pivot-val">${fmt(data[r][c])}</td>`; });
    html += `<td class="pivot-val pivot-total">${fmt(rowTotal)}</td></tr>`;
  });

  // Col totals
  html += `<tr><td class="pivot-row-h" style="color:var(--accent2)">Tổng</td>`;
  cols.forEach(c=>{
    const ct = rows.reduce((s,r)=>s+data[r][c],0);
    html += `<td class="pivot-val pivot-total">${fmt(ct)}</td>`;
  });
  const grand = rows.reduce((s,r)=>s+cols.reduce((ss,c)=>ss+data[r][c],0),0);
  html += `<td class="pivot-val pivot-total" style="background:rgba(255,107,53,0.1)">${fmt(grand)}</td></tr>`;
  html += `</tbody></table></div>`;

  document.getElementById('pv-result').innerHTML = html;
  notify('Pivot thực thi: ' + rows.length + ' hàng × ' + cols.length + ' cột');
}

// =========================================================
// 9 REPORTS
// =========================================================
const reportDefs = [
  {
    title: 'Q1 — Cửa hàng & mặt hàng đang lưu kho',
    params: [],
    sql: ()=>`<span class="sql-kw">SELECT</span>
  c.Ma_CH, d.Ten_TP, d.Bang, c.SDT,
  m.Mo_Ta, m.Kich_Co, m.Trong_Luong, m.Gia,
  ck.So_Luong_Ton_Kho
<span class="sql-kw">FROM</span> Dim_Cua_Hang c
<span class="sql-kw">JOIN</span> Dim_Dia_Diem d <span class="sql-kw">ON</span> c.Ma_TP = d.Ma_TP
<span class="sql-kw">JOIN</span> Mat_Hang_Luu_Tru ck <span class="sql-kw">ON</span> c.Ma_CH = ck.Ma_CH
<span class="sql-kw">JOIN</span> Dim_Mat_Hang m <span class="sql-kw">ON</span> ck.Ma_MH = m.Ma_MH
<span class="sql-kw">ORDER BY</span> d.Ten_TP, c.Ma_CH`,
    data: ()=>{
      const rows=[];
      for(let i=0;i<8;i++){
        const ci=rand(0,4), ii=rand(0,6);
        rows.push({ma_ch:`CH${String(rand(1,10)).padStart(3,'0')}`,city:cities[ci],bang:bangs[ci],sdt:`0${rand(900,999)}.${rand(100,999)}.${rand(1000,9999)}`,mo_ta:items[ii],kich_co:['S','M','L','XL'][rand(0,3)],trong_luong:`${rand(1,5)*100}g`,gia:fmt(rand(50,500)*1000),ton_kho:rand(10,200)});
      }
      return rows;
    },
    headers: ['Mã CH','Thành phố','Bang','SĐT','Mô tả','Kích cỡ','Trọng lượng','Giá','Tồn kho'],
    keys: ['ma_ch','city','bang','sdt','mo_ta','kich_co','trong_luong','gia','ton_kho']
  },
  {
    title: 'Q2 — Đơn đặt hàng & tên khách hàng',
    params: [],
    sql: ()=>`<span class="sql-kw">SELECT</span>
  o.Ma_Don, o.Ngay_Dat_Hang, kh.Ten_KH, kh.Loai_KH
<span class="sql-kw">FROM</span> Fact_Order o
<span class="sql-kw">JOIN</span> Dim_Khach_Hang kh <span class="sql-kw">ON</span> o.Ma_KH = kh.Ma_KH
<span class="sql-kw">ORDER BY</span> o.Ngay_Dat_Hang <span class="sql-kw">DESC</span>`,
    data: ()=> orders.slice(0,10).map(o=>({...o, ngay:`2024-${String(rand(1,12)).padStart(2,'0')}-${String(rand(1,28)).padStart(2,'0')}`})),
    headers: ['Mã đơn','Tên KH','Loại KH','Ngày đặt','Mặt hàng','Số lượng','Thành tiền'],
    keys: ['ma_don','ten_kh','loai_kh','ngay','mat_hang','qty','price']
  },
  {
    title: 'Q3 — Cửa hàng có bán mặt hàng được đặt bởi khách hàng',
    params: [{id:'q3-kh', label:'Mã khách hàng', type:'text', placeholder:'VD: KH_01'}],
    sql: (p)=>`<span class="sql-kw">SELECT DISTINCT</span>
  c.Ma_CH, d.Ten_TP, c.SDT, m.Mo_Ta
<span class="sql-kw">FROM</span> Fact_Order fo
<span class="sql-kw">JOIN</span> Dim_Khach_Hang kh <span class="sql-kw">ON</span> fo.Ma_KH = kh.Ma_KH
<span class="sql-kw">JOIN</span> Dim_Mat_Hang m <span class="sql-kw">ON</span> fo.Ma_MH = m.Ma_MH
<span class="sql-kw">JOIN</span> Mat_Hang_Luu_Tru ck <span class="sql-kw">ON</span> ck.Ma_MH = fo.Ma_MH
<span class="sql-kw">JOIN</span> Dim_Cua_Hang c <span class="sql-kw">ON</span> ck.Ma_CH = c.Ma_CH
<span class="sql-kw">JOIN</span> Dim_Dia_Diem d <span class="sql-kw">ON</span> c.Ma_TP = d.Ma_TP
<span class="sql-kw">WHERE</span> kh.Ma_KH = <span class="sql-str">'${p||'KH_01'}'</span>`,
    data: ()=>{const r=[];for(let i=0;i<5;i++){const ci=rand(0,4),ii=rand(0,6);r.push({ma_ch:`CH${String(rand(1,10)).padStart(3,'0')}`,city:cities[ci],sdt:`0${rand(900,999)}.xxx.xxxx`,mo_ta:items[ii]});}return r;},
    headers: ['Mã CH','Thành phố','SĐT','Mặt hàng'],
    keys: ['ma_ch','city','sdt','mo_ta']
  },
  {
    title: 'Q4 — Văn phòng đại diện lưu kho trên mức cụ thể',
    params: [{id:'q4-min', label:'Số lượng tối thiểu', type:'number', placeholder:'VD: 100'}],
    sql: (p)=>`<span class="sql-kw">SELECT</span>
  d.Ten_TP, d.Bang, d.Dia_Chi_VP,
  <span class="sql-fn">SUM</span>(ck.So_Luong_Ton_Kho) <span class="sql-kw">AS</span> Tong_Ton
<span class="sql-kw">FROM</span> Dim_Dia_Diem d
<span class="sql-kw">JOIN</span> Dim_Cua_Hang c <span class="sql-kw">ON</span> c.Ma_TP = d.Ma_TP
<span class="sql-kw">JOIN</span> Mat_Hang_Luu_Tru ck <span class="sql-kw">ON</span> ck.Ma_CH = c.Ma_CH
<span class="sql-kw">GROUP BY</span> d.Ten_TP, d.Bang, d.Dia_Chi_VP
<span class="sql-kw">HAVING</span> <span class="sql-fn">SUM</span>(ck.So_Luong_Ton_Kho) > <span class="sql-num">${p||100}</span>
<span class="sql-kw">ORDER BY</span> Tong_Ton <span class="sql-kw">DESC</span>`,
    data: ()=> cities.map((c,i)=>({city:c,bang:bangs[i],diachi:`${rand(1,200)} Đường ${rand(1,30)}, ${c}`,tong:rand(200,2000)})).filter(r=>r.tong>100),
    headers: ['Thành phố','Bang','Địa chỉ VP','Tổng tồn kho'],
    keys: ['city','bang','diachi','tong']
  },
  {
    title: 'Q5 — Mặt hàng trong đơn & cửa hàng có bán',
    params: [{id:'q5-don', label:'Mã đơn đặt hàng', type:'text', placeholder:'VD: ORD001'}],
    sql: (p)=>`<span class="sql-kw">SELECT</span>
  fo.Ma_Don, m.Mo_Ta, ck.Ma_CH,
  d.Ten_TP, fo.So_Luong_Dat
<span class="sql-kw">FROM</span> Fact_Order fo
<span class="sql-kw">JOIN</span> Dim_Mat_Hang m <span class="sql-kw">ON</span> fo.Ma_MH = m.Ma_MH
<span class="sql-kw">JOIN</span> Mat_Hang_Luu_Tru ck <span class="sql-kw">ON</span> ck.Ma_MH = fo.Ma_MH
<span class="sql-kw">JOIN</span> Dim_Cua_Hang c <span class="sql-kw">ON</span> ck.Ma_CH = c.Ma_CH
<span class="sql-kw">JOIN</span> Dim_Dia_Diem d <span class="sql-kw">ON</span> c.Ma_TP = d.Ma_TP
<span class="sql-kw">WHERE</span> fo.Ma_Don = <span class="sql-str">'${p||'ORD001'}'</span>`,
    data: ()=>{const r=[];for(let i=0;i<4;i++){const ii=rand(0,6),ci=rand(0,4);r.push({ma_don:'ORD001',mo_ta:items[ii],ma_ch:`CH${String(rand(1,6)).padStart(3,'0')}`,city:cities[ci],qty:rand(1,20)});}return r;},
    headers: ['Mã đơn','Mô tả MH','Mã CH','Thành phố','SL đặt'],
    keys: ['ma_don','mo_ta','ma_ch','city','qty']
  },
  {
    title: 'Q6 — Thành phố & bang của khách hàng',
    params: [{id:'q6-kh', label:'Mã khách hàng', type:'text', placeholder:'VD: KH_03'}],
    sql: (p)=>`<span class="sql-kw">SELECT</span>
  kh.Ma_KH, kh.Ten_KH, d.Ten_TP, d.Bang
<span class="sql-kw">FROM</span> Dim_Khach_Hang kh
<span class="sql-kw">JOIN</span> Dim_Dia_Diem d <span class="sql-kw">ON</span> kh.Ma_TP = d.Ma_TP
<span class="sql-kw">WHERE</span> kh.Ma_KH = <span class="sql-str">'${p||'KH_03'}'</span>`,
    data: ()=>{const ci=rand(0,4);return [{ma_kh:'KH_03',ten_kh:'Nguyễn Văn A',city:cities[ci],bang:bangs[ci]}];},
    headers: ['Mã KH','Tên KH','Thành phố','Bang'],
    keys: ['ma_kh','ten_kh','city','bang']
  },
  {
    title: 'Q7 — Mức tồn kho mặt hàng tại thành phố',
    params: [
      {id:'q7-mh', label:'Mã mặt hàng', type:'text', placeholder:'VD: MH001'},
      {id:'q7-city', label:'Thành phố', type:'text', placeholder:'VD: Hà Nội'}
    ],
    sql: (p)=>`<span class="sql-kw">SELECT</span>
  c.Ma_CH, d.Ten_TP, m.Mo_Ta,
  ck.So_Luong_Ton_Kho
<span class="sql-kw">FROM</span> Mat_Hang_Luu_Tru ck
<span class="sql-kw">JOIN</span> Dim_Cua_Hang c <span class="sql-kw">ON</span> ck.Ma_CH = c.Ma_CH
<span class="sql-kw">JOIN</span> Dim_Dia_Diem d <span class="sql-kw">ON</span> c.Ma_TP = d.Ma_TP
<span class="sql-kw">JOIN</span> Dim_Mat_Hang m <span class="sql-kw">ON</span> ck.Ma_MH = m.Ma_MH
<span class="sql-kw">WHERE</span> ck.Ma_MH = <span class="sql-str">'${p||'MH001'}'</span>
  <span class="sql-kw">AND</span> d.Ten_TP = <span class="sql-str">'Hà Nội'</span>`,
    data: ()=>{const r=[];for(let i=0;i<3;i++)r.push({ma_ch:`CH${String(i+1).padStart(3,'0')}`,city:'Hà Nội',mo_ta:'Áo sơ mi',ton_kho:rand(20,150)});return r;},
    headers: ['Mã CH','Thành phố','Mặt hàng','Tồn kho'],
    keys: ['ma_ch','city','mo_ta','ton_kho']
  },
  {
    title: 'Q8 — Chi tiết đầy đủ một đơn đặt hàng',
    params: [{id:'q8-don', label:'Mã đơn', type:'text', placeholder:'VD: ORD005'}],
    sql: (p)=>`<span class="sql-kw">SELECT</span>
  fo.Ma_Don, kh.Ten_KH, m.Mo_Ta,
  fo.So_Luong_Dat, fo.Tong_Tien,
  c.Ma_CH, d.Ten_TP
<span class="sql-kw">FROM</span> Fact_Order fo
<span class="sql-kw">JOIN</span> Dim_Khach_Hang kh <span class="sql-kw">ON</span> fo.Ma_KH = kh.Ma_KH
<span class="sql-kw">JOIN</span> Dim_Mat_Hang m <span class="sql-kw">ON</span> fo.Ma_MH = m.Ma_MH
<span class="sql-kw">JOIN</span> Dim_Cua_Hang c <span class="sql-kw">ON</span> fo.Ma_CH = c.Ma_CH
<span class="sql-kw">JOIN</span> Dim_Dia_Diem d <span class="sql-kw">ON</span> c.Ma_TP = d.Ma_TP
<span class="sql-kw">WHERE</span> fo.Ma_Don = <span class="sql-str">'${p||'ORD005'}'</span>`,
    data: ()=>{const r=[];const ci=rand(0,4);for(let i=0;i<rand(2,4);i++){const ii=rand(0,6);r.push({ma_don:'ORD005',ten_kh:'Trần Thị B',mo_ta:items[ii],qty:rand(1,20),tien:fmt(rand(50,500)*1000),ma_ch:`CH${String(rand(1,6)).padStart(3,'0')}`,city:cities[ci]});}return r;},
    headers: ['Mã đơn','Tên KH','Mặt hàng','SL','Thành tiền','Mã CH','Thành phố'],
    keys: ['ma_don','ten_kh','mo_ta','qty','tien','ma_ch','city']
  },
  {
    title: 'Q9 — Phân loại khách hàng (du lịch / bưu điện / cả hai)',
    params: [],
    sql: ()=>`<span class="sql-kw">SELECT</span>
  kh.Ma_KH, kh.Ten_KH,
  <span class="sql-kw">CASE</span>
    <span class="sql-kw">WHEN</span> kh.Ma_KH <span class="sql-kw">IN</span> (<span class="sql-kw">SELECT</span> Ma_KH <span class="sql-kw">FROM</span> Khach_Hang_Du_Lich)
         <span class="sql-kw">AND</span> kh.Ma_KH <span class="sql-kw">IN</span> (<span class="sql-kw">SELECT</span> Ma_KH <span class="sql-kw">FROM</span> Khach_Hang_Buu_Dien)
         <span class="sql-kw">THEN</span> <span class="sql-str">'Cả hai'</span>
    <span class="sql-kw">WHEN</span> kh.Ma_KH <span class="sql-kw">IN</span> (<span class="sql-kw">SELECT</span> Ma_KH <span class="sql-kw">FROM</span> Khach_Hang_Du_Lich)
         <span class="sql-kw">THEN</span> <span class="sql-str">'Du lịch'</span>
    <span class="sql-kw">ELSE</span> <span class="sql-str">'Bưu điện'</span>
  <span class="sql-kw">END</span> <span class="sql-kw">AS</span> Phan_Loai
<span class="sql-kw">FROM</span> Dim_Khach_Hang kh
<span class="sql-kw">ORDER BY</span> Phan_Loai, kh.Ten_KH`,
    data: ()=>{const types=['Du lịch','Bưu điện','Cả hai'];const r=[];for(let i=1;i<=10;i++)r.push({ma_kh:`KH_${String(i).padStart(2,'0')}`,ten_kh:`Khách hàng ${i}`,loai:types[rand(0,2)]});return r;},
    headers: ['Mã KH','Tên KH','Phân loại'],
    keys: ['ma_kh','ten_kh','loai']
  }
];

let currentReport = 0;

function selectReport(n){
  currentReport = n-1;
  document.querySelectorAll('.report-card').forEach((c,i)=>c.classList.toggle('active',i===n-1));
  const rpt = reportDefs[n-1];
  document.getElementById('rpt-title').textContent = rpt.title;

  // Build params
  let ph = '';
  rpt.params.forEach(p=>{
    ph += `<div class="ctrl-group"><label>${p.label}</label><input type="${p.type}" id="${p.id}" placeholder="${p.placeholder}"></div>`;
  });
  ph += `<button class="btn btn-primary" onclick="runReport()">▶ Chạy báo cáo</button>`;
  document.getElementById('rpt-params').innerHTML = ph;

  document.getElementById('rpt-sql').innerHTML = rpt.sql('') + `<span class="sql-label">SQL</span>`;
  document.getElementById('rpt-result').innerHTML = '';
}

function runReport(){
  const rpt = reportDefs[currentReport];
  const p = rpt.params.length ? document.getElementById(rpt.params[0].id).value : '';
  document.getElementById('rpt-sql').innerHTML = rpt.sql(p) + `<span class="sql-label">SQL</span>`;

  const data = rpt.data();
  let html = `<div class="result-meta"><span class="result-count">${data.length} dòng</span><span>${rpt.title}</span></div>`;
  html += `<div class="tbl-wrap"><table><thead><tr>`;
  rpt.headers.forEach(h=>{ html+=`<th>${h}</th>`; });
  html += `</tr></thead><tbody>`;
  data.forEach(r=>{
    html += '<tr>';
    rpt.keys.forEach(k=>{
      const v = r[k]!==undefined?r[k]:'—';
      const isNum = typeof v==='number';
      html += `<td${isNum?' class="num"':''}>${isNum?fmt(v):v}</td>`;
    });
    html += '</tr>';
  });
  html += `</tbody></table></div>`;
  document.getElementById('rpt-result').innerHTML = html;
  notify(`Báo cáo ${currentReport+1} — ${data.length} dòng kết quả`);
}

// =========================================================
// INVENTORY PANEL
// =========================================================
function initInventory(){
  const sql = `<span class="sql-kw">SELECT</span>
  d.Ten_TP,
  <span class="sql-fn">COUNT</span>(<span class="sql-kw">DISTINCT</span> c.Ma_CH) <span class="sql-kw">AS</span> So_Cua_Hang,
  <span class="sql-fn">SUM</span>(ck.So_Luong_Ton_Kho) <span class="sql-kw">AS</span> Tong_Ton_Kho
<span class="sql-kw">FROM</span> Dim_Dia_Diem d
<span class="sql-kw">JOIN</span> Dim_Cua_Hang c <span class="sql-kw">ON</span> c.Ma_TP = d.Ma_TP
<span class="sql-kw">JOIN</span> Mat_Hang_Luu_Tru ck <span class="sql-kw">ON</span> ck.Ma_CH = c.Ma_CH
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

  // Chart
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
  const tabs = document.querySelectorAll(`#panel-${panel} .tab-btn`);
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
  el.classList.add('show');
  clearTimeout(notifTimer);
  notifTimer = setTimeout(()=>el.classList.remove('show'), 2800);
}

// =========================================================
// INIT
// =========================================================
runRollup();
selectReport(1);
