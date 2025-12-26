console.log('drag.js DRAG-MODE loaded');

/* =====================
   DRAG MODE STATE
===================== */
let dragMode = {
  active: false,
  bookingId: null
};

let draggingBar = null;
let ghost = null;
let startX = 0;
let startY = 0;

/* =====================
   BIND AFTER RENDER
===================== */
function bindDrag() {
  document.querySelectorAll('.bar').forEach(bar => {

    /* ===== 普通点击 → Edit ===== */
    bar.addEventListener('click', e => {
      e.stopPropagation();
      if (!dragMode.active) {
        openEdit(Number(bar.dataset.id));
      }
    });

    /* ===== 长按 → Action Sheet ===== */
    bar.addEventListener('touchstart', e => {
      e.stopPropagation();
      const id = Number(bar.dataset.id);

      bar.__pressTimer = setTimeout(() => {
        openActionSheet(id);
      }, 500);
    }, { passive: true });

    bar.addEventListener('touchend', () => {
      clearTimeout(bar.__pressTimer);
    });

    /* ===== Desktop 右键也给菜单（可选） ===== */
    bar.addEventListener('contextmenu', e => {
      e.preventDefault();
      openActionSheet(Number(bar.dataset.id));
    });

    /* ===== Drag start（只在 dragMode） ===== */
    bar.addEventListener('mousedown', onDragStart);
    bar.addEventListener('touchstart', onDragStart, { passive:false });
  });
}

window.bindDrag = bindDrag;

/* =====================
   ACTION SHEET
===================== */
function openActionSheet(id) {
  dragMode.bookingId = id;

  document.getElementById('actionSheet').style.display = 'block';
  document.getElementById('sheetBackdrop').style.display = 'block';
}

function closeActionSheet() {
  dragMode.active = false;
  dragMode.bookingId = null;

  document.getElementById('actionSheet').style.display = 'none';
  document.getElementById('sheetBackdrop').style.display = 'none';
}

/* =====================
   ACTION BUTTONS
===================== */
document.getElementById('editBtn').onclick = () => {
  const id = dragMode.bookingId;
  closeActionSheet();
  openEdit(id);
};

document.getElementById('dragBtn').onclick = () => {
  dragMode.active = true;
  closeActionSheet();
  alert('Drag mode ON. Now drag the booking.');
};

/* =====================
   DRAG LOGIC (CLEAN)
===================== */
function onDragStart(e) {
  if (!dragMode.active) return;

  e.stopPropagation();
  e.preventDefault();

  draggingBar = e.currentTarget;

  const p = e.touches ? e.touches[0] : e;
  startX = p.clientX;
  startY = p.clientY;

  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('touchmove', onDragMove, { passive:false });
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchend', onDragEnd);
}

function onDragMove(e) {
  if (!draggingBar) return;

  const p = e.touches ? e.touches[0] : e;
  e.preventDefault();

  if (!ghost) {
    ghost = draggingBar.cloneNode(true);
    ghost.style.position = 'fixed';
    ghost.style.zIndex = 9999;
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '0.85';
    ghost.style.width = draggingBar.offsetWidth + 'px';
    document.body.appendChild(ghost);
  }

  ghost.style.left = p.clientX - 30 + 'px';
  ghost.style.top  = p.clientY - 20 + 'px';
}

function onDragEnd() {
  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('touchmove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
  document.removeEventListener('touchend', onDragEnd);

  if (ghost) {
    ghost.remove();
    ghost = null;
  }

  draggingBar = null;
  dragMode.active = false;
}
