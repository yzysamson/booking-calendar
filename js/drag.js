// js/drag.js
// ===================================================
// Programmatic Drag & Drop (Ghost + Conflict + Sync)
// ===================================================

let didDrag = false;
let dragState = null;
let longPressTimer = null;
let dropIndicatorEl = null;
const ROOM_COL_WIDTH = 88;   // 和 CSS 的 .room width 一致
const HEADER_HEIGHT = 34;   // header 那一行的高度


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
  if (!e || !booking) return;

  dragState = {
    booking,
    startX: e.clientX,
    startY: e.clientY,
    dayShift: 0,
    roomShift: 0
  };

  createDropIndicator();
  updateDropIndicator();

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

  if (Math.abs(dx) > 3 || Math.abs(dy) > 3){
    didDrag = true;   // ⭐ 关键
  }

  dragState.dayShift = Math.round(dx / DAY_WIDTH);
  dragState.roomShift = Math.round(dy / ROW_HEIGHT);

  updateDropIndicator();
}

// =====================
// DROP
// =====================
async function onPointerUp(){
  if (!dragState) return;

  const ok = applyDragResult();

  if (ok && dropIndicatorEl){
    dropIndicatorEl.classList.add('success');
    setTimeout(() => {
      cleanup();
      render();
    }, 180);
  } else {
    cleanup();
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
  new Date(booking.check_in).getTime() + dayShift * dayMs
);

const newCheckOut = new Date(
  new Date(booking.check_out).getTime() + dayShift * dayMs
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
// CLEANUP
// =====================
function cleanup(){
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerUp);
  dragState = null;

  cleanupDropIndicator();

  // ⭐ 延迟清掉，确保 click 事件已经被挡掉
  setTimeout(() => {
    didDrag = false;
  }, 0);
}


function cleanupDropIndicator(){
  if (dropIndicatorEl){
    dropIndicatorEl.remove();
    dropIndicatorEl = null;
  }
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

  // ===== 目标 room =====
  const baseRoomIndex = ROOMS.findIndex(r => r.name === booking.room);
  const targetRoomIndex = baseRoomIndex + roomShift;
  const rows = document.querySelectorAll('#app .row');

  if (targetRoomIndex < 0 || targetRoomIndex >= rows.length){
    dropIndicatorEl.style.display = 'none';
    return;
  }

  const targetRowEl = rows[targetRoomIndex];
  const rowRect = targetRowEl.getBoundingClientRect();

  // ===== booking 起始 day index =====
  const baseDayIndex = DAYS.indexOf(booking.check_in);
  const targetDayIndex = baseDayIndex + dayShift;

  if (targetDayIndex < 0 || targetDayIndex >= DAYS.length){
    dropIndicatorEl.style.display = 'none';
    return;
  }

  // header 里的 day cell（第 targetDayIndex 个）
  const headerCells = document.querySelectorAll('#app .header .cell');
  const targetDayCell = headerCells[targetDayIndex];
  const dayRect = targetDayCell.getBoundingClientRect();

  // ===== booking 长度 =====
  const spanDays =
    (new Date(booking.check_out) - new Date(booking.check_in)) / dayMs;

  // ===== 合法性 =====
  const newCheckIn = new Date(
    new Date(booking.check_in).getTime() + dayShift * dayMs
  );
  const newCheckOut = new Date(
    new Date(booking.check_out).getTime() + dayShift * dayMs
  );

  const crossMonth = isCrossMonth(
    new Date(booking.check_in),
    newCheckIn,
    newCheckOut
  );

  const conflict = hasConflict({
    ...booking,
    room: ROOMS[targetRoomIndex].name,
    check_in: toISODate(newCheckIn),
    check_out: toISODate(newCheckOut)
  });

  const valid = !crossMonth && !conflict;

  // ===== 精准定位（核心）=====
  dropIndicatorEl.style.display = 'block';
  dropIndicatorEl.style.left = dayRect.left + 'px';
  dropIndicatorEl.style.top = rowRect.top + 'px';
  dropIndicatorEl.style.width = spanDays * DAY_WIDTH + 'px';
  dropIndicatorEl.style.height = ROW_HEIGHT + 'px';

  dropIndicatorEl.classList.toggle('invalid', !valid);
}

