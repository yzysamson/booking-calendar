monthPicker.value=new Date().toISOString().slice(0,7);
monthPicker.onchange=loadAll;
loadAll();
