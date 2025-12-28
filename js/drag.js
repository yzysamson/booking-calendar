// js/drag.js
// ===================================================
// Programmatic Drag & Drop (Ghost + Conflict + Sync)
// ===================================================

let dragState = null;
let longPressTimer = null;
let ghostEl = null;

const DAY_WIDTH = 56;   // 与 calendar grid 保持一致
const ROW_HEIGHT = 34;
const LONG_PRESS_MS = 300;

// =====================
// ENTRY
// =====================
function onBarPointerDown(e, bookingId){
  const booking = BOOKINGS.find(b => b.id === bookingId);
  if (!booking) return;

  // 防止误触点击
  e.preventDefault();

  longPressTimer = setTimeout(() => {
    startDrag(e, booking);
  }, LONG_PRESS_MS);

  document.addEventListener('pointerup', cancelLongPress, { once: true });
}

function cancelLongPress(){
  clearTimeout(longPressTimer);
  longPressTimer = null;
}

// =====================
// DRAG START
// =====================
function startDrag(e, booking){
  dragState = {
    booking,
    startX: e.clientX,
    startY: e.clientY,
    dayShift: 0,
    roomShift: 0
  };

  createGhost(e, booking);

  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
}

// =====================
// MOVE
// =====================
function onPointerMove(e){
  if (!dragState) return;

  const dx = e.clientX - dragState.startX;
  const dy = e.clientY - dragState.startY;

  dragState.dayShift = Math.round(dx / DAY_WIDTH);
  dragState.roomShift = Math.round(dy / ROW_HEIGHT);

  updateGhostPosition();
}

// =====================
// DROP
// =====================
async function onPointerUp(){
  if (!dragState) return;

  cleanupGhost();

  const ok = applyDragResult();
  cleanup();

  if (ok){
    render(); // 用你原本的 render
  }
}

// =====================
// APPLY RESULT
// =====================
function applyDragResult(){
  const { booking, dayShift, roomShift } = dragState;
  if (!dayShift && !roomShift) return false;

  const roomIndex = ROOMS.findIndex(r => r.name === booking.room);
  const newRoomIndex = roomIndex + roomShift;

  if (newRoomIndex < 0 || newRoomIndex >= ROOMS.length){
    return false;
  }

  const dayMs = 86400000;
  const newCheckIn = new Date(new Date(booking.check_in).getTime() + dayShift * dayMs);
  const newCheckOut = new Date(new Date(booking.check_out).getTime() + dayShift * dayMs);

  const newRoom = ROOMS[newRoomIndex];

const newBooking = {
  ...booking,
  room_id: newRoom.id,          // ✅ 用 room_id
  room: newRoom.name,           // UI 用（不进 DB）
  check_in: toISODate(newCheckIn),
  check_out: toISODate(newCheckOut)
};


  // 2️⃣ 冲突检测
  if (hasConflict(newBooking)){
    alert('❌ Booking conflict detected');
    return false;
  }

  // 3️⃣ 本地更新
  Object.assign(booking, newBooking);

  // 3️⃣ Supabase sync（非阻塞）
  syncBooking(booking);

  return true;
}

// =====================
// CONFLICT CHECK
// =====================
function hasConflict(test){
  return BOOKINGS.some(b =>
    b.id !== test.id &&
    b.room === test.room &&
    test.check_in < b.check_out &&
    test.check_out > b.check_in
  );
}

// =====================
// SUPABASE UPDATE
// =====================
async function syncBooking(b){
  try {
    await sb
      .from('bookings')
      .update({   
        room_id: b.room_id,
        check_in: b.check_in,
        check_out: b.check_out
      })
      .eq('id', b.id);
  } catch (err){
    console.error('Supabase update failed', err);
  }
}

// =====================
// GHOST BAR
// =====================
function createGhost(e, booking){
  ghostEl = document.createElement('div');
  ghostEl.className = 'bar';
  ghostEl.style.position = 'fixed';
  ghostEl.style.pointerEvents = 'none';
  ghostEl.style.opacity = '0.6';
  ghostEl.style.zIndex = '9999';
  ghostEl.textContent = formatRM(booking.price);

  document.body.appendChild(ghostEl);
  updateGhostPosition(e);
}

function updateGhostPosition(){
  if (!ghostEl || !dragState) return;

  ghostEl.style.left = dragState.startX + dragState.dayShift * DAY_WIDTH + 'px';
  ghostEl.style.top  = dragState.startY + dragState.roomShift * ROW_HEIGHT + 'px';
}

function cleanupGhost(){
  if (ghostEl){
    ghostEl.remove();
    ghostEl = null;
  }
}

// =====================
// CLEANUP
// =====================
function cleanup(){
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerUp);
  dragState = null;
}

function toISODate(d){
  return d.toISOString().slice(0, 10);
}
