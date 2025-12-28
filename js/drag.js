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


function lockScroll(){
  const content = document.querySelector('.content');
  content.style.overflow = 'hidden';
  content.style.touchAction = 'none';
}

function unlockScroll(){
  const content = document.querySelector('.content');
  content.style.overflow = '';
  content.style.touchAction = '';
}


// =====================
// ENTRY
// =====================
function onBarPointerDown(e, bookingId){
  const booking = BOOKINGS.find(b => b.id === bookingId);
  if (!booking) return;

  e.preventDefault();

  // ⭐⭐ 关键：告诉 Safari「这个手指是我的」
  e.target.setPointerCapture(e.pointerId);

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

  // ⭐⭐ 关键：锁滚动
  lockScroll(); 

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

  didDrag = true;
  // ⭐ iOS Safari 必须
  e.preventDefault();

  const dx = e.clientX - dragState.startX;
  const dy = e.clientY - dragState.startY;

  // ✅ 用 floor / ceil，避免来回跳
  dragState.dayShift =
    dx > 0
      ? Math.floor(dx / DAY_WIDTH)
      : Math.ceil(dx / DAY_WIDTH);

  dragState.roomShift =
    dy > 0
      ? Math.floor(dy / ROW_HEIGHT)
      : Math.ceil(dy / ROW_HEIGHT);

  updateDropIndicator();
}

// =====================
// DROP
// =====================
async function onPointerUp(e){
  if (!dragState) return;

  // ⭐ 吃掉后续 click（关键）
  e?.preventDefault();
  e?.stopPropagation();

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

  // ===== 1️⃣ 从 indicator 取最终结果 =====
  const {
    booking,
    targetDayIndex,
    targetRoomIndex
  } = dragState;

  // 安全检查（防御）
  if (
    targetDayIndex == null ||
    targetRoomIndex == null
  ){
    return false;
  }

  // ===== 2️⃣ 房间计算（Step 4）=====
  if (
    targetRoomIndex < 0 ||
    targetRoomIndex >= ROOMS.length
  ){
    return false;
  }

  const newRoom = ROOMS[targetRoomIndex];

  // ===== 3️⃣ 日期计算（Step 3）=====
  const baseDayIndex = DAYS.indexOf(booking.check_in);
  if (baseDayIndex === -1){
    return false;
  }

  const dayDelta = targetDayIndex - baseDayIndex;
  const dayMs = 86400000;

  const newCheckIn = new Date(
    new Date(booking.check_in).getTime() + dayDelta * dayMs
  );

  const newCheckOut = new Date(
    new Date(booking.check_out).getTime() + dayDelta * dayMs
  );

  // ===== 4️⃣ 当月限制 =====
  const baseDate = new Date(booking.check_in);

  if (
    !isSameMonth(newCheckIn, baseDate) ||
    !isSameMonth(newCheckOut, baseDate)
  ){
    alert('❌ Cannot drag booking across months');
    return false;
  }

  // ===== 5️⃣ 冲突检测（已排除自己）=====
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

  // ===== 6️⃣ 本地更新 =====
  Object.assign(booking, testBooking);

  // ===== 7️⃣ Supabase 同步（异步）=====
  syncBooking(booking);

  return true;
}

// =====================
// CONFLICT CHECK
// =====================
function hasConflict(test){
  return BOOKINGS.some(b => {

    // ⭐ 关键：忽略正在被拖动的 booking 自己
    if (b.id === test.id) return false;

    // 房间不同，不算冲突
    if (b.room !== test.room) return false;

    // 时间是否重叠
    return (
      test.check_in < b.check_out &&
      test.check_out > b.check_in
    );
  });
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
  unlockScroll();

  // ⭐ 延迟清掉，确保 click 事件已经被挡掉
  setTimeout(() => {
    didDrag = false;
  }, 0);
}

document.addEventListener('pointercancel', onPointerCancel);

function onPointerCancel(e){
  // iOS Safari 在横向滑动时会触发这个
  cleanup();
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
  document.getElementById('app').appendChild(dropIndicatorEl);
}

function updateDropIndicator(){
  if (!dropIndicatorEl || !dragState) return;

  const { booking, dayShift, roomShift } = dragState;
  const dayMs = 86400000;

  const appEl = document.getElementById('app');

  // ===== 房间 index =====
  const baseRoomIndex = ROOMS.findIndex(r => r.name === booking.room);
  const targetRoomIndex = baseRoomIndex + roomShift;

  const rows = appEl.querySelectorAll('.row');
  if (targetRoomIndex < 0 || targetRoomIndex >= rows.length){
    dropIndicatorEl.style.display = 'none';
    return;
  }

  const targetRowEl = rows[targetRoomIndex];
  const rowRect = targetRowEl.getBoundingClientRect();

  // ===== 日期 index =====
  const baseDayIndex = DAYS.indexOf(booking.check_in);
  const targetDayIndex = baseDayIndex + dayShift;

  const headerCells = appEl.querySelectorAll('.header .cell');
  if (targetDayIndex < 0 || targetDayIndex >= headerCells.length){
    dropIndicatorEl.style.display = 'none';
    return;
  }

  const targetDayCell = headerCells[targetDayIndex];
  const dayRect = targetDayCell.getBoundingClientRect();

  // ===== booking 长度 =====
  const spanDays =
    (new Date(booking.check_out) - new Date(booking.check_in)) / dayMs;

  // ===== 合法性判断 =====
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

  // ===== ⭐ 精准对齐到 grid（关键）=====
  dropIndicatorEl.style.display = 'block';

  const scrollEl = document.querySelector('.content');

dropIndicatorEl.style.left =
  (targetDayCell.offsetLeft - scrollEl.scrollLeft) + 'px';

dropIndicatorEl.style.top =
  (targetRowEl.offsetTop - scrollEl.scrollTop) + 'px';


  dropIndicatorEl.style.width =
    spanDays * DAY_WIDTH + 'px';

  dropIndicatorEl.style.height =
    ROW_HEIGHT + 'px';

  dropIndicatorEl.classList.toggle('invalid', !valid);

  // ===== indicator = 唯一真相 =====
  dragState.targetDayIndex = targetDayIndex;
  dragState.targetRoomIndex = targetRoomIndex;
}
