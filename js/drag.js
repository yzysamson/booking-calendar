console.log('drag.js BASELINE');

let draggingBar = null;
let ghost = null;
let pressTimer = null;
const LONG_PRESS = 350;

/* ===== bind after render ===== */
function bindDrag(){
  document.querySelectorAll('.bar').forEach(bar => {

    // 防止 cell 抢事件
    bar.addEventListener('click', e => {
      e.stopPropagation();
      openEdit(Number(bar.dataset.id));
    });

    bar.addEventListener('touchstart', onStart, { passive:false });
    bar.addEventListener('mousedown', onStart);
  });
}

window.bindDrag = bindDrag;

/* ===== start ===== */
function onStart(e){
  e.stopPropagation();

  draggingBar = e.currentTarget;

  pressTimer = setTimeout(() => {
    startDrag(e);
  }, LONG_PRESS);
}

/* ===== drag start ===== */
function startDrag(e){
  if(!draggingBar) return;

  ghost = draggingBar.cloneNode(true);
  ghost.style.position = 'fixed';
  ghost.style.zIndex = 9999;
  ghost.style.pointerEvents = 'none';
  ghost.style.opacity = '0.85';
  ghost.style.width = draggingBar.offsetWidth + 'px';

  document.body.appendChild(ghost);
  moveGhost(e);

  document.addEventListener('touchmove', onMove, { passive:false });
  document.addEventListener('mousemove', onMove);

  document.addEventListener('touchend', endDrag);
  document.addEventListener('mouseup', endDrag);
}

/* ===== move ===== */
function onMove(e){
  e.preventDefault();
  moveGhost(e);
}

function moveGhost(e){
  const p = e.touches ? e.touches[0] : e;
  ghost.style.left = p.clientX - 30 + 'px';
  ghost.style.top  = p.clientY - 20 + 'px';
}

/* ===== end ===== */
function endDrag(){
  clearTimeout(pressTimer);

  document.removeEventListener('touchmove', onMove);
  document.removeEventListener('mousemove', onMove);

  document.removeEventListener('touchend', endDrag);
  document.removeEventListener('mouseup', endDrag);

  if(ghost){
    ghost.remove();
    ghost = null;
  }

  draggingBar = null;
}
