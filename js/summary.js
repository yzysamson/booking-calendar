const summaryContent = document.getElementById('summaryContent');

function renderSummary(){
  if (!summaryContent) return;

  const [y, m] = monthPicker.value.split('-').map(Number);

  const byRoom = {};
  const bySource = {};

  BOOKINGS.forEach(b => {
    const d = new Date(b.check_in);
    if (d.getFullYear() !== y || d.getMonth() + 1 !== m) return;

    const price = Number(b.price || 0);

    byRoom[b.room] = byRoom[b.room] || { c: 0, s: 0 };
    byRoom[b.room].c++;
    byRoom[b.room].s += price;

    bySource[b.source] = bySource[b.source] || { c: 0, s: 0 };
    bySource[b.source].c++;
    bySource[b.source].s += price;
  });

  const roomSorted = Object.entries(byRoom)
    .sort((a,b) => b[1].s - a[1].s);

  const sourceSorted = Object.entries(bySource)
    .sort((a,b) => b[1].s - a[1].s);

  const roomTotal = roomSorted.reduce((t,[,v]) => t + v.s, 0);
  const sourceTotal = sourceSorted.reduce((t,[,v]) => t + v.s, 0);

  summaryContent.innerHTML = '';

  /* ===== By Room ===== */
  summaryContent.innerHTML += `
    <div class="summary-section">
      <div class="summary-header">
        <span>By Room</span>
        <span class="summary-total">${formatRM(roomTotal)}</span>
      </div>
  `;

  roomSorted.forEach(([r,v]) => {
    summaryContent.innerHTML += `
      <div class="summary-row">
        <div>${r} (${v.c})</div>
        <div>${formatRM(v.s)}</div>
      </div>
    `;
  });

  summaryContent.innerHTML += `</div>`;

  /* ===== By Source ===== */
  summaryContent.innerHTML += `
    <div class="summary-section">
      <div class="summary-header">
        <span>By Source</span>
        <span class="summary-total">${formatRM(sourceTotal)}</span>
      </div>
  `;

  sourceSorted.forEach(([s,v]) => {
    summaryContent.innerHTML += `
      <div class="summary-row">
        <div>${s} (${v.c})</div>
        <div>${formatRM(v.s)}</div>
      </div>
    `;
  });

  summaryContent.innerHTML += `</div>`;
}
