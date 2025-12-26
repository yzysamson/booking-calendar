const summaryContent = document.getElementById('summaryContent');

function renderSummary(){
  if (!summaryContent) return;

  const [y, m] = monthPicker.value.split('-').map(Number);

  const byRoom = {};
  const bySource = {};

  BOOKINGS.forEach(b => {
    const d = new Date(b.check_in);
    if (d.getFullYear() !== y || d.getMonth() + 1 !== m) return;

    // by room
    byRoom[b.room] = byRoom[b.room] || { c: 0, s: 0 };
    byRoom[b.room].c++;
    byRoom[b.room].s += Number(b.price || 0);

    // by source
    bySource[b.source] = bySource[b.source] || { c: 0, s: 0 };
    bySource[b.source].c++;
    bySource[b.source].s += Number(b.price || 0);
  });

  summaryContent.innerHTML = '';

  summaryContent.innerHTML += '<div class="summary-title">By Room</div>';
  Object.keys(byRoom).forEach(r => {
    summaryContent.innerHTML += `
      <div class="summary-row">
        <div>${r} (${byRoom[r].c})</div>
        <div>RM ${byRoom[r].s}</div>
      </div>
    `;
  });

  summaryContent.innerHTML += '<div class="summary-title">By Source</div>';
  Object.keys(bySource).forEach(s => {
    summaryContent.innerHTML += `
      <div class="summary-row">
        <div>${s} (${bySource[s].c})</div>
        <div>RM ${bySource[s].s}</div>
      </div>
    `;
  });
}
