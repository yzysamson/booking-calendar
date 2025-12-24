function renderSummary(){
  const [y,m]=monthPicker.value.split('-').map(Number);
  let byRoom={},bySource={};

  BOOKINGS.forEach(b=>{
    const d=new Date(b.check_in);
    if(d.getFullYear()!==y||d.getMonth()+1!==m) return;

    byRoom[b.room] ||= {c:0,s:0};
    byRoom[b.room].c++;
    byRoom[b.room].s+=Number(b.price||0);

    bySource[b.source] ||= {c:0,s:0};
    bySource[b.source].c++;
    bySource[b.source].s+=Number(b.price||0);
  });

  summary.innerHTML='<div class="summary-title">By Room</div>';
  Object.keys(byRoom).forEach(r=>{
    summary.innerHTML+=`
      <div class="summary-row" onclick="filterByRoom('${r}')">
        <div>${r} (${byRoom[r].c})</div>
        <div>RM ${byRoom[r].s}</div>
      </div>`;
  });

  summary.innerHTML+='<div class="summary-title">By Source</div>';
  Object.keys(bySource).forEach(s=>{
    summary.innerHTML+=`
      <div class="summary-row" onclick="filterBySource('${s}')">
        <div>${s} (${bySource[s].c})</div>
        <div>RM ${bySource[s].s}</div>
      </div>`;
  });
}
