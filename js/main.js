let appInitialized = false;

// =====================
// AUTH GATE (Step 2)
// =====================

async function initAuthGate() {
  document.getElementById('loadingView').style.display = 'block';
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('appView').style.display = 'none';

  const {
    data: { user }
  } = await sb.auth.getUser();

  document.getElementById('loadingView').style.display = 'none';

  if (user) {
    showApp();
  } else {
    showLogin();
  }
}

function showApp() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('appView').style.display = 'block';

  sb.auth.getUser().then(({ data }) => {
    if (data?.user) {
      document.getElementById('userEmail').textContent = data.user.email;
      document.getElementById('userBar').style.display = 'inline-flex';
    }
  });

  if (!appInitialized) {
    appInitialized = true;
    loadAll();
  }
}


document.getElementById('loginBtn').onclick = async () => {
  const email = document.getElementById('loginEmail').value.trim();

  if (!email) {
    alert('Please enter your email');
    return;
  }

  const { error } = await sb.auth.signInWithOtp({ email });

  if (error) {
  alert(
    'Sign-in failed.\n\n' +
    error.message
  );
} else {
  alert(
    'Login link sent.\n\n' +
    'Please check your email to continue.'
  );
}
};

sb.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    showApp();
  } else {
    showLogin();
  }
});


monthPicker.value=new Date().toISOString().slice(0,7);
monthPicker.onchange = () => {
  const appVisible =
    document.getElementById('appView').style.display !== 'none';
  if (appVisible) loadAll();
};


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

deleteBtn.onclick = async () => {

  const ok = confirm(
  'Confirm deletion\n\n' +
  'This booking will be permanently removed.\n' +
  'This action cannot be undone.'
);

  if (!ok) return;

  await sb
    .from('bookings')
    .delete()
    .eq('id', currentId);

  closeModal();
  loadAll();
};


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


initAuthGate();

document.getElementById('logoutBtn').onclick = async () => {
  await sb.auth.signOut();
  appInitialized = false;
  showLogin();
};

