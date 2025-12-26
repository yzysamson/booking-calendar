
console.log("done 8")

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
       data-id="${b.id}"
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

document.addEventListener('DOMContentLoaded', () => {
  const dragBtn = document.getElementById('lpDrag');
  if (!dragBtn) {
    console.warn('lpDrag not found');
    return;
  }

  dragBtn.onclick = () => {
    alert('Drag clicked for booking ID: ' + longPressBookingId);
    closeLongPressMenu();
  };
});


render();
bindDragMode();


// ===== MORE MENU =====
document.getElementById('moreBtn').onclick = () => {
  document.getElementById('moreMenu').style.display = 'block';
};

document.getElementById('dragAction').onclick = () => {
  DRAG_MODE = true;
  document.getElementById('moreMenu').style.display = 'none';
  closeModal(); // 关闭 edit 弹窗
  alert('Drag mode enabled. Drag the booking.');
};

// 点空白关闭菜单（可选但推荐）
document.addEventListener('click', e => {
  if (!e.target.closest('#moreMenu') && !e.target.closest('#moreBtn')) {
    document.getElementById('moreMenu').style.display = 'none';
  }
});

function bindDragMode() {
  document.querySelectorAll('.bar').forEach(bar => {

    bar.onmousedown = e => {
      if (!DRAG_MODE) return;
      e.preventDefault();
      startDrag(bar, e);
    };

    bar.ontouchstart = e => {
      if (!DRAG_MODE) return;
      e.preventDefault();
      startDrag(bar, e.touches[0]);
    };
  });
}

let ghost = null;

function startDrag(bar, e) {
  ghost = bar.cloneNode(true);
  ghost.style.position = 'fixed';
  ghost.style.pointerEvents = 'none';
  ghost.style.opacity = '0.8';
  ghost.style.zIndex = 9999;
  ghost.style.width = bar.offsetWidth + 'px';
  document.body.appendChild(ghost);

  moveGhost(e);

  document.onmousemove = ev => moveGhost(ev);
  document.ontouchmove = ev => moveGhost(ev.touches[0]);

  document.onmouseup = endDrag;
  document.ontouchend = endDrag;
}

function moveGhost(e) {
  ghost.style.left = e.clientX - 30 + 'px';
  ghost.style.top  = e.clientY - 20 + 'px';
}

function endDrag() {
  document.onmousemove = null;
  document.ontouchmove = null;
  document.onmouseup = null;
  document.ontouchend = null;

  if (ghost) ghost.remove();
  ghost = null;

  DRAG_MODE = false; // ⭐️ 拖完自动退出
}
