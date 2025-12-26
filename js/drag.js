/* ================= DRAG & CLICK (MINIMAL SAFE) ================= */

console.log('drag.js LOADED 3');

let pressTimer = null;
let isDragging = false;
let activeBar = null;
let ghost = null;

const LONG_PRESS_MS = 350;

/* ===== bind after render ===== */
function bindDrag(){
  document.querySelectorAll('.bar').forEach(bar => {

    // mobile
    bar.addEventListener('touchstart', onPressStart, { passive:false });
    bar.addEventListener('touchend', onPressEnd);

    // desktop
    bar.addEventListener('mousedown', onPressStart);
    bar.addEventListener('mouseup', onPressEnd);
  });
}

/* ===== press start ===== */
function onPressStart(e){
  activeBar = e.currentTarget;
  isDragging = false;

  // 不阻止默认，不 stopPropagation
  pressTimer = setTimeout(() => {
    isDragging = true;
    startDrag(activeBar, e);
  }, LONG_PRESS_MS);
}

/* ===== press end ===== */
function onPressEnd(e){
  clearTimeout(pressTimer);

  // 👉 短点：edit
  if(!isDragging && activeBar){
    openEdit(Number(activeBar.dataset.id));
  }

  // 👉 如果刚拖完，清理
  cleanup();
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
}

/* ===== move ===== */
function onMove(e){
  if(!isDragging) return;

  e.preventDefault(); // 只在拖动时阻止滚动
  moveGhost(e);
}

function moveGhost(e){
  const p = e.touches ? e.touches[0] : e;
  ghost.style.left = p.clientX - 30 + 'px';
  ghost.style.top  = p.clientY - 20 + 'px';
}

/* ===== cleanup ===== */
function cleanup(){
  document.removeEventListener('touchmove', onMove);
  document.removeEventListener('mousemove', onMove);

  if(ghost){
    ghost.remove();
    ghost = null;
  }

  isDragging = false;
  activeBar = null;
}

window.bindDrag = bindDrag;