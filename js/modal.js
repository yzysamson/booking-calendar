function openNew(room,ci,co){
  modalTitle.textContent='New Booking';
  editing=null;
  roomInput.value=ROOMS.find(r=>r.name===room).id;
  checkinInput.value=ci;
  checkoutInput.value=co;
  priceInput.value='';
  remarkInput.value='';
  saveBtn.textContent = 'Save';
  saveBtn.disabled=true;
  deleteBtn.style.display='none';
  modal.style.display='block';
}

function openEdit(id){
  if (didDrag) return;
  editing=BOOKINGS.find(b=>b.id===id);
  modalTitle.textContent='Edit Booking';
  roomInput.value=editing.room_id;
  checkinInput.value=editing.check_in;
  checkoutInput.value=editing.check_out;
  sourceInput.value=editing.source;
  priceInput.value=editing.price||'';
  remarkInput.value=editing.remark||'';
  saveBtn.textContent = 'Update';
  deleteBtn.style.display='block';
  validate();
  modal.style.display='block';
  // ===== bind Drag button AFTER modal opened =====
const dragBtn = document.getElementById('lpDrag');
if (dragBtn) {
  dragBtn.onclick = () => {
    DRAG_MODE = true;
    closeModal();   // 关掉 Edit 弹窗
    alert('Drag mode enabled. Drag the booking.');
  };
}

}

function closeModal(){modal.style.display='none'}

function validate(){
  saveBtn.disabled = !(checkoutInput.value>checkinInput.value && Number(priceInput.value)>0);
}

checkoutInput.onchange=validate;
priceInput.oninput=validate;
