const summaryContent = document.getElementById('summaryContent');

function renderSummary(){
  if (!summaryContent) return;

  const [y, m] = monthPicker.value.split('-').map(Number);

  const byRoom = {};
  const bySource = {};
  let total = 0;

  BOOKINGS.forEach(b => {
    const d = new Date(b.check_in);
    if (d.getFullYear() !== y || d.getMonth() + 1 !== m) return;

    const price = Number(b.price || 0);
    total += price;

    // by room
    byRoom[b.room] = byRoom[b.room] || { c: 0, s: 0 };
    byRoom[b.room].c++;
    byRoom[b.room].s += price;

    // by source
    bySource[b.source] = bySource[b.source] || { c: 0, s: 0 };
    bySource[b.source].c++;
    bySource[b.source].s += price;
  });

  // ===== 排序（金额高 → 低）=====
  const roomSorted = Object.entries(byRoom)
    .sort((a,b) => b[1].s - a[1].s);

  const sourceSorted = Object.entries(bySource)
    .sort((a,b) => b[1].s - a[1].s);

  summaryContent.innerHTML = '';

  // ===== Total =====
  summaryContent.innerHTML += `
    <div class="summary-total">
      <span>Total</span>
      <span>${formatRM(total)}</span>
    </div>
  `;

  // ===== By Room =====
  summaryContent.innerHTML += '<div class="summary-title">By Room</div>';
  roomSorted.forEach(([r, v]) => {
    summaryContent.innerHTML += `
      <div class="summary-row">
        <div>${r} (${v.c})</div>
        <div>${formatRM(v.s)}</div>
      </div>
    `;
  });

  // ===== By Source =====
  summaryContent.innerHTML += '<div class="summary-title">By Source</div>';
  sourceSorted.forEach(([s, v]) => {
    summaryContent.innerHTML += `
      <div class="summary-row">
        <div>${s} (${v.c})</div>
        <div>${formatRM(v.s)}</div>
      </div>
    `;
  });
}
