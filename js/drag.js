// js/drag.js
// ===================================================
// Programmatic Drag & Drop (Ghost + Conflict + Sync)
// ===================================================

let dragState = null;
let longPressTimer = null;
let ghostEl = null;
let dropIndicatorEl = null;



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


function startDrag(e, booking){
  // 🔒 保证 e 是事件
  if (!e || !booking) return;

  // ✅ 稳定拿到 bar DOM（不依赖 e.target）
  const barEl = document.querySelector(
    `.bar[data-booking-id="${booking.id}"]`
  );
  if (!barEl) return;   // ✅ 现在合法了（在 function 内）

  const barRect = barEl.getBoundingClientRect();

  dragState = {
    booking,
    startX: e.clientX,
    startY: e.clientY,
    dayShift: 0,
    roomShift: 0
  };

  createGhost(booking);
  updateGhostPosition();

  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);

  createDropIndicator();
updateDropIndicator();

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
  updateDropIndicator();
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
  const { booking, dayShift, roomShift} = dragState;

  if (!dayShift && !roomShift) return false;

  // ===== 房间计算 =====
  const roomIndex = ROOMS.findIndex(r => r.name === booking.room);
  const newRoomIndex = roomIndex + roomShift;

  if (newRoomIndex < 0 || newRoomIndex >= ROOMS.length){
    return false;
  }

  // ===== 日期计算（全部先算完）=====
  const dayMs = 86400000;

  const newCheckIn = new Date(
    new Date(booking.check_in).getTime()
  );

  const newCheckOut = new Date(
    new Date(booking.check_out).getTime()
  );

  // ===== 当月限制（现在用，已初始化）=====
  const baseDate = new Date(booking.check_in);

  if (
    !isSameMonth(newCheckIn, baseDate) ||
    !isSameMonth(newCheckOut, baseDate)
  ){
    alert('❌ Cannot drag booking across months');
    return false;
  }

  // ===== 冲突检测 =====
  const newRoom = ROOMS[newRoomIndex];

  const testBooking = {
    ...booking,
    room_id: newRoom.id,
    room: newRoom.name,
    check_in: toISODate(newCheckIn),
    check_out: toISODate(newCheckOut)
  };

  if (hasConflict(testBooking)){
    alert('❌ Booking conflict detected');
    return false;
  }

  // ===== 本地更新 =====
  Object.assign(booking, testBooking);

  // ===== Supabase 同步（异步，不阻塞 UI）=====
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
function createGhost(booking){
  ghostEl = document.createElement('div');
  ghostEl.className = 'bar';
  ghostEl.style.position = 'fixed';
  ghostEl.style.pointerEvents = 'none';
  ghostEl.style.opacity = '0.6';
  ghostEl.style.zIndex = '9999';
  ghostEl.textContent = formatRM(booking.price);

  document.body.appendChild(ghostEl);
}

function updateGhostPosition(){
  if (!ghostEl || !dragState) return;

  ghostEl.style.left =
    dragState.startX + dragState.dayShift * DAY_WIDTH + 'px';

  ghostEl.style.top =
    dragState.startY + dragState.roomShift * ROW_HEIGHT + 'px';
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

  cleanupDropIndicator();

}

function toISODate(d){
  return d.toISOString().slice(0, 10);
}

function isSameMonth(d1, d2){
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth()
  );
}

function isCrossMonth(baseDate, newCheckIn, newCheckOut){
  return (
    newCheckIn.getFullYear() !== baseDate.getFullYear() ||
    newCheckIn.getMonth() !== baseDate.getMonth() ||
    newCheckOut.getFullYear() !== baseDate.getFullYear() ||
    newCheckOut.getMonth() !== baseDate.getMonth()
  );
}

function createDropIndicator(){
  dropIndicatorEl = document.createElement('div');
  dropIndicatorEl.className = 'drop-indicator';
  document.body.appendChild(dropIndicatorEl);
}

function updateDropIndicator(){
  if (!dropIndicatorEl || !dragState) return;

  const { booking, dayShift, roomShift } = dragState;
  const dayMs = 86400000;

  // 目标房间
  const roomIndex = ROOMS.findIndex(r => r.name === booking.room);
  const targetRoom = ROOMS[roomIndex + roomShift];

  if (!targetRoom){
    dropIndicatorEl.style.display = 'none';
    return;
  }

  // 目标日期
  const newCheckIn = new Date(
    new Date(booking.check_in).getTime() + dayShift * dayMs
  );
  const newCheckOut = new Date(
    new Date(booking.check_out).getTime() + dayShift * dayMs
  );

  // booking 长度（天）
  const spanDays =
    (new Date(booking.check_out) - new Date(booking.check_in)) / dayMs;

  // === 合法性判断 ===
  const crossMonth = isCrossMonth(
    new Date(booking.check_in),
    newCheckIn,
    newCheckOut
  );

  const conflict = hasConflict({
    ...booking,
    room: targetRoom.name,
    check_in: toISODate(newCheckIn),
    check_out: toISODate(newCheckOut)
  });

  const valid = !crossMonth && !conflict;

  // === 定位（与 ghost 同一套坐标系）===
  dropIndicatorEl.style.display = 'block';

  dropIndicatorEl.style.left =
  dragState.startX + dragState.dayShift * DAY_WIDTH + 'px';

dropIndicatorEl.style.top =
  dragState.startY + dragState.roomShift * ROW_HEIGHT + 'px';

  dropIndicatorEl.style.width =
    spanDays * DAY_WIDTH + 'px';

  dropIndicatorEl.style.height =
    ROW_HEIGHT + 'px';

  dropIndicatorEl.classList.toggle('invalid', !valid);
}

function cleanupDropIndicator(){
  if (dropIndicatorEl){
    dropIndicatorEl.remove();
    dropIndicatorEl = null;
  }
}
