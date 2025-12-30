console.log("done 48")

/* ===== LEGEND ===== */
function buildLegend(){
  legend.innerHTML = '';

  const all = document.createElement('div');
  all.className = 'legend-item active';
  all.textContent = 'All';
  all.onclick = () => {
    FILTER.clear();
    BOOKINGS.forEach(b => delete b.__hidden);
    render();
  };
  legend.appendChild(all);

  SOURCES.forEach(s => {
    const el = document.createElement('div');
    el.className = 'legend-item';
    el.innerHTML = `<span class="legend-color src-${norm(s)}"></span>${s}`;
    el.onclick = () => {
      FILTER.has(s) ? FILTER.delete(s) : FILTER.add(s);
      el.classList.toggle('active');
      render();
    };
    legend.appendChild(el);
  });
}

/* ===== DAYS ===== */
function buildDays(){
  const [y, m] = monthPicker.value.split('-').map(Number);
  DAYS = [...Array(new Date(y, m, 0).getDate())]
    .map((_, i) =>
      `${y}-${String(m).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`
    );
}

/* ===== CALENDAR RENDER ===== */
function render(){
  let html = '';
  const cols = `88px repeat(${DAYS.length},56px)`;

  html += `<div class="header" style="grid-template-columns:${cols}">
    <div class="room corner">
      <span class="corner-date">ROOM | DATE</span>
    </div>`;

  DAYS.forEach(d => html += `<div class="cell">${d.slice(8)}</div>`);
  html += `</div>`;

  ROOMS.forEach(r => {
    html += `<div class="row" style="grid-template-columns:${cols}">
      <div class="room">${r.name}</div>`;

    let i = 0;
    while (i < DAYS.length) {
      const d = DAYS[i];
      const b = BOOKINGS.find(x =>
        !x.__hidden &&
        x.room === r.name &&
        d >= x.check_in && d < x.check_out &&
        (FILTER.size === 0 || FILTER.has(x.source))
      );

      if (!b) {
        html += `<div class="cell"
          data-room="${r.name}"
          data-date="${d}"
          onclick="onCellClick(this,event)">
        </div>`;
        i++;
        continue;
      }

      const span = (new Date(b.check_out) - new Date(d)) / 86400000;
  html += `
  <div class="bar src-${norm(b.source)}"
       style="grid-column:span ${span}"
        data-booking-id="${b.id}"
       onpointerdown="onBarPointerDown(event, ${b.id})"
       onclick="openEdit(${b.id})">
    <span class="bar-price">${formatRM(b.price)}</span>
  </div>
`;

      i += span;
    }

    html += `</div>`;
  });

  app.innerHTML = html;
}

// js/calendar.js

function buildSelects(){
  // Room select
  roomInput.innerHTML = '';
  ROOMS.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = r.name;
    roomInput.appendChild(opt);
  });

  // Source select
  sourceInput.innerHTML = '';

  
  SOURCES.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    sourceInput.appendChild(opt);
  });
}

// js/calendar.js

function onCellClick(el, e){
  // 如果点的是 bar 或 bar 里面，直接 return
  if (e && e.target.closest('.bar')) return;
  const room = el.dataset.room;
  const date = el.dataset.date;

  // clear previous selecting
  document.querySelectorAll('.cell.selecting')
    .forEach(c => c.classList.remove('selecting'));

  // start selecting
  if (!selectState || selectState.room !== room || date <= selectState.checkin){
    selectState = { room, checkin: date };
    el.classList.add('selecting');
    return;
  }

  // end selecting → open modal
  openNew(room, selectState.checkin, date);
  selectState = null;
}

let DRAG_MODE = false;


render();


