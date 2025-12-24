/* =======================
   UTIL
======================= */
function norm(s){
  return s.toLowerCase().replace(/[^a-z]/g,'');
}

/* =======================
   SUPABASE
======================= */
const sb = supabase.createClient(
  'https://pwscsukxfnbzjciuhtwl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3c2NzdWt4Zm5iempjaXVodHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MzU1MDQsImV4cCI6MjA4MjExMTUwNH0.YQEXs1S3wprPMOarCL_DLXDtsSgY6I7TFM4bp_gLkW8'
);

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

let FILTER = new Set();
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
  ROOMS = (await sb.from('rooms').select('*').order('id')).data || [];
  BOOKINGS = (await sb.from('booking_view').select('*')).data || [];
  BOOKINGS.forEach(b => delete b.__hidden);

  buildLegend();
  buildDays();
  buildSelects();

  render();
  renderSummary();
}

/* =======================
   LEGEND
======================= */
function buildLegend(){
  legend.innerHTML = '';

  const all = document.createElement('div');
  all.className = 'legend-item active';
  all.textContent = 'All';

  all.onclick = () => {
    FILTER.clear();
    BOOKINGS.forEach(b => delete b.__hidden);
    document.querySelectorAll('.legend-item')
      .forEach(i => i.classList.remove('active'));
    all.classList.add('active');
    render();
  };

  legend.appendChild(all);

  SOURCES.forEach(src => {
    const el = document.createElement('div');
    el.className = 'legend-item';

    el.innerHTML = `
      <span class="legend-color src-${norm(src)}"></span>
      ${src}
    `;

    el.onclick = () => {
      if(FILTER.has(src)){
        FILTER.delete(src);
        el.classList.remove('active');
      }else{
        FILTER.add(src);
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
    roomInput.innerHTML += `<option value="${r.id}">${r.name}</option>`;
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
  DAYS = [...Array(new Date(y,m,0).getDate())]
    .map((_,i)=>`${y}-${String(m).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`);
}

/* =======================
   RENDER
======================= */
function render(){
  let html = '';
  const cols = `88px repeat(${DAYS.length},56px)`;

  /* HEADER */
  html += `
    <div class="header" style="grid-template-columns:${cols}">
      <div class="room corner">
        <span class="corner-room">Room</span>
        <span class="corner-date">Date</span>
      </div>
  `;
  DAYS.forEach(d => html += `<div class="cell">${d.slice(8)}</div>`);
  html += `</div>`;

  /* ROWS */
  ROOMS.forEach(r=>{
    html += `<div class="row" style="grid-template-columns:${cols}">
      <div class="room">${r.name}</div>
    `;

    let i = 0;
    while(i < DAYS.length){
      const d = DAYS[i];
      const b = BOOKINGS.find(x =>
        !x.__hidden &&
        x.room === r.name &&
        d >= x.check_in &&
        d < x.check_out &&
        (FILTER.size === 0 || FILTER.has(x.source))
      );

      if(!b){
        html += `<div class="cell" data-room="${r.name}" data-date="${d}"></div>`;
        i++;
        continue;
      }

      const span = (new Date(b.check_out) - new Date(d)) / 86400000;
      html += `
        <div class="bar src-${norm(b.source)}"
             style="grid-column:span ${span}"
             onclick="openEdit(${b.id})">
          ${b.price || ''}
        </div>
      `;
      i += span;
    }

    html += `</div>`;
  });

  app.innerHTML = html;
}

/* =======================
   CLICK (EVENT DELEGATE)
======================= */
app.addEventListener('click', e=>{
  const cell = e.target.closest('.cell');
  if(!cell) return;
  onCellClick(cell);
});

function onCellClick(el){
  const room = el.dataset.room;
  const date = el.dataset.date;

  if(!selectState || selectState.room !== room || date <= selectState.checkin){
    selectState = { room, checkin: date };
    return;
  }

  openNew(room, selectState.checkin, date);
  selectState = null;
}

/* =======================
   MODAL
======================= */
function openNew(room,ci,co){
  modalTitle.textContent = 'New Booking';
  editing = null;

  roomInput.value = ROOMS.find(r=>r.name===room).id;
  checkinInput.value = ci;
  checkoutInput.value = co;
  priceInput.value = '';
  remarkInput.value = '';
  deleteBtn.style.display = 'none';

  modal.style.display = 'block';
}

function openEdit(id){
  editing = BOOKINGS.find(b=>b.id===id);
  modalTitle.textContent = 'Edit Booking';

  roomInput.value = editing.room_id;
  checkinInput.value = editing.check_in;
  checkoutInput.value = editing.check_out;
  sourceInput.value = editing.source;
  priceInput.value = editing.price || '';
  remarkInput.value = editing.remark || '';
  deleteBtn.style.display = 'block';

  modal.style.display = 'block';
}

function closeModal(){
  modal.style.display = 'none';
}

/* =======================
   SAVE / DELETE
======================= */
saveBtn.onclick = async ()=>{
  const payload = {
    room_id: +roomInput.value,
    check_in: checkinInput.value,
    check_out: checkoutInput.value,
    source: sourceInput.value,
    price: Number(priceInput.value),
    remark: remarkInput.value || null
  };

  editing
    ? await sb.from('bookings').update(payload).eq('id', editing.id)
    : await sb.from('bookings').insert(payload);

  closeModal();
  loadAll();
};

deleteBtn.onclick = async ()=>{
  await sb.from('bookings').delete().eq('id', editing.id);
  closeModal();
  loadAll();
};
