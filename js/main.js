monthPicker.value=new Date().toISOString().slice(0,7);
monthPicker.onchange=loadAll;

saveBtn.onclick=async()=>{
  if(saveBtn.disabled) return;
  const payload={
    room_id:+roomInput.value,
    check_in:checkinInput.value,
    check_out:checkoutInput.value,
    source:sourceInput.value,
    price:Number(priceInput.value),
    remark:remarkInput.value||null
  };
  editing
    ? await sb.from('bookings').update(payload).eq('id',editing.id)
    : await sb.from('bookings').insert(payload);
  closeModal();loadAll();
};

deleteBtn.onclick=async()=>{
  await sb.from('bookings').delete().eq('id',editing.id);
  closeModal();loadAll();
};

loadAll();

const summarySheet = document.getElementById('summarySheet');
const summaryTrigger = document.getElementById('summaryTrigger');
const summaryBackdrop = document.getElementById('summaryBackdrop');
const summaryHandle = document.querySelector('.summary-handle');

function openSummary(){
  summarySheet.classList.add('show');
  summaryBackdrop.classList.add('show');
}

function closeSummary(){
  summarySheet.classList.remove('show');
  summaryBackdrop.classList.remove('show');
}

if (summaryTrigger) {
  summaryTrigger.onclick = openSummary;
}

if (summaryBackdrop) {
  summaryBackdrop.onclick = closeSummary;
}

if (summaryHandle) {
  summaryHandle.onclick = closeSummary;
}


