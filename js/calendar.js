/* =======================
   UTIL
======================= */
function norm(s){
  return s.toLowerCase().replace(/[^a-z]/g,'');
}

/* =======================
   SUPABASE
======================= */
var sb = supabase.createClient(
  'https://pwscsukxfnbzjciuhtwl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3c2NzdWt4Zm5iempjaXVodHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MzU1MDQsImV4cCI6MjA4MjExMTUwNH0.YQEXs1S3wprPMOarCL_DLXDtsSgY6I7TFM4bp_gLkW8'
);

var SOURCES = [
  'Airbnb','Booking','Agoda','Trip','SLH',
  'Walk-in (Wayne)','Walk-in (Soo)'
];

/* =======================
   STATE
======================= */
var ROOMS = [];
var BOOKINGS = [];
var DAYS = [];

var FILTER = {};
var selectState = null;

/* =======================
   DOM
======================= */
var app = document.getElementById('app');
var legend = document.getElementById('legend');
var summary = document.getElementById('summary');
var modal = document.getElementById('modal');

var roomInput = document.getElementById('roomInput');
var checkinInput = document.getElementById('checkinInput');
var checkoutInput = document.getElementById('checkoutInput');
var sourceInput = document.getElementById('sourceInput');
var priceInput = document.getElementById('priceInput');
var remarkInput = document.getElementById('remarkInput');
var modalTitle = document.getElementById('modalTitle');
var monthPicker = document.getElementById('monthPicker');
var saveBtn = document.getElementById('saveBtn');
var deleteBtn = document.getElementById('deleteBtn');

/* =======================
   INIT
======================= */
monthPicker.value = new Date().toISOString().slice(0,7);
monthPicker.onchange = function(){
  loadAll();
};

loadAll();

/* =======================
   LOAD (SAFE)
======================= */
async function loadAll(){
  try{
    var r1 = await sb.from('rooms').select('*').order('id');
    var r2 = await sb.from('booking_view').select('*');

    ROOMS = r1.data || [];
    BOOKINGS = r2.data || [];
  }catch(e){
    return;
  }

  for(var i=0;i<BOOKINGS.length;i++){
    delete BOOKINGS[i].__hidden;
  }

  buildLegend();
  buildDays();
  buildSelects();
  render();
}

/* =======================
   LEGEND
======================= */
function buildLegend(){
  legend.innerHTML = '';
  FILTER = {};

  var all = document.createElement('div');
  all.className = 'legend-item active';
  all.innerHTML = 'All';
  all.onclick = function(){
    FILTER = {};
    render();
  };
  legend.appendChild(all);

  for(var i=0;i<SOURCES.length;i++){
    (function(src){
      var el = document.createElement('div');
      el.className = 'legend-item';
      el.innerHTML =
        '<span class="legend-color src-'+norm(src)+'"></span>' + src;

      el.onclick = function(){
        if(FILTER[src]){
          delete FILTER[src];
          el.classList.remove('active');
        }else{
          FILTER[src] = true;
          el.classList.add('active');
        }
        render();
      };
      legend.appendChild(el);
    })(SOURCES[i]);
  }
}

/* =======================
   SELECTS
======================= */
function buildSelects(){
  roomInput.innerHTML = '';
  for(var i=0;i<ROOMS.length;i++){
    roomInput.innerHTML +=
      '<option value="'+ROOMS[i].id+'">'+ROOMS[i].name+'</option>';
  }

  sourceInput.innerHTML = '';
  for(var j=0;j<SOURCES.length;j++){
    sourceInput.innerHTML += '<option>'+SOURCES[j]+'</option>';
  }
}

/* =======================
   DAYS
======================= */
function buildDays(){
  var parts = monthPicker.value.split('-');
  var y = Number(parts[0]);
  var m = Number(parts[1]);

  DAYS = [];
  var total = new Date(y,m,0).getDate();
  for(var i=1;i<=total;i++){
    DAYS.push(
      y + '-' +
      (m<10?'0'+m:m) + '-' +
      (i<10?'0'+i:i)
    );
  }
}

/* =======================
   RENDER (SAFE FOR iOS)
======================= */
function render(){
  var html = '';
  var cols = '88px repeat('+DAYS.length+',56px)';

  // HEADER
  html += '<div class="header" style="grid-template-columns:'+cols+'">';
  html += '<div class="room corner">' +
          '<span class="corner-room">Room</span>' +
          '<span class="corner-date">Date</span>' +
          '</div>';

  for(var d=0;d<DAYS.length;d++){
    html += '<div class="cell">'+DAYS[d].slice(8)+'</div>';
  }
  html += '</div>';

  // ROWS
  for(var r=0;r<ROOMS.length;r++){
    html += '<div class="row" style="grid-template-columns:'+cols+'">';
    html += '<div class="room">'+ROOMS[r].name+'</div>';

    var i=0;
    while(i<DAYS.length){
      var day = DAYS[i];
      var found = null;

      for(var b=0;b<BOOKINGS.length;b++){
        var bk = BOOKINGS[b];
        if(bk.room===ROOMS[r].name &&
           bk.check_in && bk.check_out &&
           day>=bk.check_in && day<bk.check_out &&
           (!Object.keys(FILTER).length || FILTER[bk.source])){
          found = bk;
          break;
        }
      }

      if(!found){
        html += '<div class="cell"></div>';
        i++;
      }else{
        // 🔥 iOS SAFE date diff
        var co = Date.parse(found.check_out);
        var ci = Date.parse(day);
        var span = Math.max(1, Math.round((co - ci) / 86400000));

        html += '<div class="bar src-'+norm(found.source)+
                '" style="grid-column:span '+span+'">'+
                (found.price||'')+'</div>';
        i += span;
      }
    }

    html += '</div>';
  }

  app.innerHTML = html;
}
