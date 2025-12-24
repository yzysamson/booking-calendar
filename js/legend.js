function buildLegend(){
  legend.innerHTML='';
  const all=document.createElement('div');
  all.className='legend-item active';
  all.textContent='All';
  all.onclick=()=>{
    FILTER.clear();
    BOOKINGS.forEach(b=>delete b.__hidden);
    render();
  };
  legend.appendChild(all);

  SOURCES.forEach(s=>{
    const el=document.createElement('div');
    el.className='legend-item';
    el.innerHTML=`<span class="legend-color src-${norm(s)}"></span>${s}`;
    el.onclick=()=>{
      FILTER.has(s)?FILTER.delete(s):FILTER.add(s);
      el.classList.toggle('active');
      render();
    };
    legend.appendChild(el);
  });
}

function filterByRoom(room){
  FILTER.clear();
  BOOKINGS.forEach(b=>b.__hidden=b.room!==room);
  render();
}

function filterBySource(src){
  FILTER.clear();
  FILTER.add(src);
  render();
}
