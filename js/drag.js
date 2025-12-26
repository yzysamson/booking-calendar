/* ================= DRAG & DROP (LONG PRESS) ================= */

let pressTimer = null;
let isDragging = false;
let activeBar = null;
let ghost = null;

const LONG_PRESS_MS = 300;

/* ===== bind after render ===== */
function bindDrag(){
  document.querySelectorAll('.bar').forEach(bar => {
    bar.addEventListener('touchstart', onPressStart, { passive:false });
    bar.addEventListener('mousedown', onPressStart);

    bar.addEventListener('touchend', onPressEnd);
    bar.addEventListener('mouseup', onPressEnd);
  });
}

/* ===== press start ===== */
function onPressStart(e){
  activeBar = e.currentTarget;
  isDragging = false;

  pressTimer = setTimeout(() => {
    isDragging = true;
    startDrag(activeBar, e);

    // ✅ 只有真正 drag 时才阻止默认
    e.preventDefault();
  }, LONG_PRESS_MS);
}


/* ===== press end ===== */
function onPressEnd(e){
  clearTimeout(pressTimer);

  if(!isDragging && activeBar){
    openEdit(Number(activeBar.dataset.id));
  }

  activeBar = null;
}

/* ===== start dragging ===== */
function startDrag(bar, e){
  isDragging = true;

  ghost = bar.cloneNode(true);
  ghost.style.position = 'fixed';
  ghost.style.zIndex = 9999;
  ghost.style.pointerEvents = 'none';
  ghost.style.opacity = '0.85';
  ghost.style.width = bar.offsetWidth + 'px';

  document.body.appendChild(ghost);

  moveGhost(e);

  document.addEventListener('touchmove', onMove, { passive:false });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchend', onDrop);
  document.addEventListener('mouseup', onDrop);
}

/* ===== move ===== */
function moveGhost(e){
  const p = e.touches ? e.touches[0] : e;
  ghost.style.left = p.clientX - 30 + 'px';
  ghost.style.top  = p.clientY - 20 + 'px';
}

function onMove(e){
  e.preventDefault();
  moveGhost(e);
}

/* ===== drop (暂时不改数据) ===== */
function onDrop(){
  document.removeEventListener('touchmove', onMove);
  document.removeEventListener('mousemove', onMove);

  if(ghost) ghost.remove();
  ghost = null;
  isDragging = false;
}
