const summaryContent = document.getElementById('summaryContent');

function renderSummary(){
  if (!summaryContent) return;

  summaryContent.innerHTML = '';

  summaryContent.innerHTML += '<div class="summary-title">By Room</div>';
  Object.keys(byRoom).forEach(r => {
    summaryContent.innerHTML += `
      <div class="summary-row">
        <div>${r}</div>
        <div>RM ${byRoom[r].s}</div>
      </div>
    `;
  });

  summaryContent.innerHTML += '<div class="summary-title">By Source</div>';
  Object.keys(bySource).forEach(s => {
    summaryContent.innerHTML += `
      <div class="summary-row">
        <div>${s}</div>
        <div>RM ${bySource[s].s}</div>
      </div>
    `;
  });
}