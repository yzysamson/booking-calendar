function openNew(room,ci,co){
  modalTitle.textContent = 'New Booking';
  editing = null;

  roomInput.value = ROOMS.find(r=>r.name===room).id;
  checkinInput.value = ci;
  checkoutInput.value = co;
  priceInput.value = '';
  remarkInput.value = '';

  saveBtn.disabled = true;
  deleteBtn.style.display = 'none';

  modal.style.display = 'block';              // 🔥 必须
  document.body.classList.add('modal-open');  // 可选但推荐
}


function openEdit(id){
  editing = BOOKINGS.find(b=>b.id===id);

  modalTitle.textContent = 'Edit Booking';
  roomInput.value = editing.room_id;
  checkinInput.value = editing.check_in;
  checkoutInput.value = editing.check_out;
  sourceInput.value = editing.source;
  priceInput.value = editing.price || '';
  remarkInput.value = editing.remark || '';

  deleteBtn.style.display = 'block';
  validate();

  modal.style.display = 'block';              // 🔥 必须
  document.body.classList.add('modal-open');
}


function closeModal(){
  modal.style.display = 'none';
  document.body.classList.remove('modal-open');
}


function validate(){
  saveBtn.disabled=!(checkoutInput.value>checkinInput.value&&Number(priceInput.value)>0);
}

checkoutInput.onchange=validate;
priceInput.oninput=validate;

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
