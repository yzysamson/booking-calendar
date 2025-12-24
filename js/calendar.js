function buildSelects(){
  roomInput.innerHTML='';
  ROOMS.forEach(r=>roomInput.innerHTML+=`<option value="${r.id}">${r.name}</option>`);
  sourceInput.innerHTML='';
  SOURCES.forEach(s=>sourceInput.innerHTML+=`<option>${s}</option>`);
}

function buildDays(){
  const [y,m]=monthPicker.value.split('-').map(Number);
  DAYS=[...Array(new Date(y,m,0).getDate())]
    .map((_,i)=>`${y}-${String(m).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`);
}

function render(){
  let html = '';

  /* Room + Days */
  const cols = `88px repeat(${DAYS.length},56px)`;

  /* ===== HEADER ===== */
  html += `
    <div class="header" style="grid-template-columns:${cols}">
      <div class="room corner">
        <span class="corner-date">Date</span>
        <span class="corner-room">Room</span>
      </div>
  `;

  DAYS.forEach(d=>{
    html += `<div class="cell">${d.slice(8)}</div>`;
  });
  html += `</div>`;

  /* ===== ROWS ===== */
  ROOMS.forEach(r=>{
    html += `
      <div class="row" style="grid-template-columns:${cols}">
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
        html += `
          <div class="cell"
               data-room="${r.name}"
               data-date="${d}"
               onclick="onCellClick(this)">
          </div>`;
        i++;
        continue;
      }

      const span =
        (new Date(b.check_out) - new Date(d)) / 86400000;

      html += `
        <div class="bar src-${norm(b.source)}"
             style="grid-column:span ${span}"
             onclick="openEdit(${b.id})">
          ${b.price || ''}
        </div>`;
      i += span;
    }

    html += `</div>`;
  });

  app.innerHTML = html;
}


function onCellClick(el){
  const room=el.dataset.room;
  const date=el.dataset.date;
  document.querySelectorAll('.cell.selecting').forEach(c=>c.classList.remove('selecting'));

  if(!selectState||selectState.room!==room||date<=selectState.checkin){
    selectState={room,checkin:date};
    el.classList.add('selecting');
    return;
  }
  openNew(room,selectState.checkin,date);
  selectState=null;
}

// ===== RENDER Y AXIS (ROOM COLUMN) =====
function renderYAxis(){
  const y = document.getElementById('y-rooms');
  if(!y) return;

  y.innerHTML = '';
  ROOMS.forEach(r=>{
    const div = document.createElement('div');
    div.className = 'y-room';
    div.textContent = r.name;
    y.appendChild(div);
  });
}
