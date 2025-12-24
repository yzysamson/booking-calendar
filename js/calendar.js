/* =======================
   UTIL
======================= */
function norm(s){
  return s.toLowerCase().replace(/[^a-z]/g,'');
}

/* =======================
   CONSTANTS
======================= */
const SOURCES = [
  'Airbnb','Booking','Agoda','Trip','SLH',
  'Walk-in (Wayne)','Walk-in (Soo)'
];

/* =======================
   STATE
======================= */
let ROOMS = [];
let BOOKINGS = [];
let DAYS = [];

let FILTER = {};
let selectState = null;
let editing = null;

/* =======================
   DOM
======================= */
const app = document.getElementById('app');
const legend = document.getElementById('legend');
const summary = document.getElementById('summary');
const modal = document.getElementById('modal');

const roomInput = document.getElementById('roomInput');
const checkinInput = document.getElementById('checkinInput');
const checkoutInput = document.getElementById('checkoutInput');
const sourceInput = document.getElementById('sourceInput');
const priceInput = document.getElementById('priceInput');
const remarkInput = document.getElementById('remarkInput');
const modalTitle = document.getElementById('modalTitle');
const monthPicker = document.getElementById('monthPicker');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');

/* =======================
   INIT
======================= */
monthPicker.value = new Date().toISOString().slice(0,7);
monthPicker.onchange = loadAll;
loadAll();

/* =======================
   LOAD
======================= */
async function loadAll(){
  const r1 = await sb.from('rooms').select('*').order('id');
  const r2 = await sb.from('booking_view').select('*');

  ROOMS = r1.data || [];
  BOOKINGS = r2.data || [];

  BOOKINGS.forEach(b => delete b.__hidden);

  buildLegend();
  buildDays();
  buildSelects();
  render();
}

/* =======================
   LEGEND
======================= */
function buildLegend(){
  legend.innerHTML = '';
  FILTER = {};

  const all = document.createElement('div');
  all.className = 'legend-item active';
  all.textContent = 'All';
  all.onclick = ()=>{
    FILTER = {};
    render();
  };
  legend.appendChild(all);

  SOURCES.forEach(src=>{
    const el = document.createElement('div');
    el.className = 'legend-item';
    el.innerHTML =
      `<span class="legend-color src-${norm(src)}"></span>${src}`;

    el.onclick = ()=>{
      if(FILTER[src]){
        delete FILTER[src];
        el.classList.remove('active');
      }else{
        FILTER[src] = true;
        el.classList.add('active');
      }
      render();
    };
    legend.appendChild(el);
  });
}

/* =======================
   SELECTS
======================= */
function buildSelects(){
  roomInput.innerHTML = '';
  ROOMS.forEach(r=>{
    roomInput.innerHTML +=
      `<option value="${r.id}">${r.name}</option>`;
  });

  sourceInput.innerHTML = '';
  SOURCES.forEach(s=>{
    sourceInput.innerHTML += `<option>${s}</option>`;
  });
}

/* =======================
   DAYS
======================= */
function buildDays(){
  const [y,m] = monthPicker.value.split('-').map(Number);
  DAYS = [];
  const total = new Date(y,m,0).getDate();
  for(let i=1;i<=total;i++){
    DAYS.push(
      `${y}-${String(m).padStart(2,'0')}-${String(i).padStart(2,'0')}`
    );
  }
}

/* =======================
   RENDER (iOS SAFE)
======================= */
function render(){
  let html = '';
  const cols = `88px repeat(${DAYS.length},56px)`;

  html += `
    <div class="header" style="grid-template-columns:${cols}">
      <div class="room corner">
        <span class="corner-room">Room</span>
        <span class="corner-date">Date</span>
      </div>
  `;
  DAYS.forEach(d=>html+=`<div class="cell">${d.slice(8)}</div>`);
  html += `</div>`;

  ROOMS.forEach(r=>{
    html += `<div class="row" style="grid-template-columns:${cols}">
      <div class="room">${r.name}</div>`;

    let i=0;
    while(i<DAYS.length){
      const day = DAYS[i];
      let found = null;

      for(const b of BOOKINGS){
        if(b.room===r.name &&
           b.check_in && b.check_out &&
           day>=b.check_in && day<b.check_out &&
           (!Object.keys(FILTER).length || FILTER[b.source])){
          found = b;
          break;
        }
      }

      if(!found){
        html += `<div class="cell"></div>`;
        i++;
      }else{
        const span = Math.max(
          1,
          Math.round(
            (Date.parse(found.check_out)-Date.parse(day))/86400000
          )
        );
        html += `
          <div class="bar src-${norm(found.source)}"
               style="grid-column:span ${span}">
            ${found.price||''}
          </div>`;
        i+=span;
      }
    }

    html += `</div>`;
  });

  app.innerHTML = html;
}
