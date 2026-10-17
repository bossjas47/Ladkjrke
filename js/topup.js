import { db, auth } from "../firebase-config.js";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * TACTICAL STORE — Topup & Wallet Controller (js/topup.js)
 * The browser only files a pending top-up request. An admin checks the payment and credits the
 * wallet (see approveTopup in admin.js); firestore.rules block any client write to users/*.
 */

let currentUser = null;
let currentAmount = 500;
let currentBonus = 25;
let currentMethod = 'promptpay';
let systemSettings = null;
let unsubWallet = null;
let unsubHistory = null;
let historyList = [];
const esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const TOPUP_STATUS = {
  pending: ['รอตรวจสอบ', 'text-launchOrange'],
  completed: ['เติมแล้ว', 'text-appleBlue'],
  rejected: ['ไม่อนุมัติ', 'text-slate']
};

document.addEventListener('DOMContentLoaded', () => {
  initAuthListener();
  initSettingsListener();
  updateTopupCalculations();
});

// ==========================================
// 1. AUTH & LIVE WALLET LISTENER
// ==========================================
function initAuthListener() {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const loggedOut = document.getElementById('auth-logged-out');
    const loggedIn = document.getElementById('auth-logged-in');
    const nameEl = document.getElementById('user-display-name');

    if (user) {
      if (loggedOut) loggedOut.classList.add('hidden');
      if (loggedIn) loggedIn.classList.remove('hidden');
      const name = user.displayName || user.email?.split('@')[0] || 'Agent';
      if (nameEl) nameEl.innerText = name;
      
      // Live listener on user wallet doc
      listenUserWallet(user.uid);
      listenTopupHistory(user.uid);
    } else {
      if (loggedIn) loggedIn.classList.add('hidden');
      if (loggedOut) loggedOut.classList.remove('hidden');
      if (unsubWallet) unsubWallet();
      if (unsubHistory) unsubHistory();
      unsubWallet = unsubHistory = null;
      historyList = [];
      updateWalletUI(0);
      renderTopupHistory();
    }
  });
}

function listenUserWallet(uid) {
  if (unsubWallet) unsubWallet();
  unsubWallet = onSnapshot(doc(db, "users", uid), (snap) => {
    updateWalletUI(snap.exists() ? (parseFloat(snap.data().walletBalance) || 0) : 0);
  }, (err) => {
    console.warn("Wallet listener:", err);
    updateWalletUI(0);
  });
}

function listenTopupHistory(uid) {
  if (unsubHistory) unsubHistory();
  unsubHistory = onSnapshot(query(collection(db, "topup_transactions"), where("uid", "==", uid)), (snap) => {
    historyList = snap.docs.map(d => d.data());
    historyList.sort((a, b) => (b.createdAt?.toMillis?.() || Date.now()) - (a.createdAt?.toMillis?.() || Date.now()));
    renderTopupHistory();
  }, (err) => console.warn("Topup history:", err));
}

function updateWalletUI(amount) {
  const heroBal = document.getElementById('hero-wallet-balance');
  const navBal = document.getElementById('nav-wallet-balance');
  const formatted = `฿${amount.toFixed(2)}`;
  if (heroBal) heroBal.innerText = formatted;
  if (navBal) navBal.innerText = formatted;
}

// ==========================================
// 2. SETTINGS LISTENER (API KEYS & CONFIG)
// ==========================================
function initSettingsListener() {
  onSnapshot(doc(db, "system", "settings"), (snap) => {
    systemSettings = snap.exists() ? snap.data() : null;
    updateTopupCalculations();
  }, (e) => console.warn("Settings listener error:", e));
}

// ==========================================
// 3. PACKAGE PRESETS & PAYMENT SWITCHER
// ==========================================
function selectTopupAmount(amt, bonus = 0) {
  currentAmount = amt;
  currentBonus = bonus;
  const customInput = document.getElementById('custom-amount-input');
  if (customInput) customInput.value = '';

  // Highlight card
  document.querySelectorAll('.topup-pack-card').forEach(card => {
    const cardAmt = parseInt(card.getAttribute('data-amt'), 10);
    if (cardAmt === amt) {
      card.className = 'topup-pack-card apple-card p-4 text-left border-2 border-pricingBlue shadow-sm transition-all rounded-2xl relative bg-gallery';
    } else {
      card.className = 'topup-pack-card apple-card p-4 text-left hover:border-pricingBlue transition-all rounded-2xl relative border border-hairline bg-gallery';
    }
  });

  updateTopupCalculations();
}

function handleCustomAmount(val) {
  let num = parseFloat(val);
  if (isNaN(num) || num < 20) {
    num = 20;
  }
  currentAmount = num;
  currentBonus = 0; // Custom amount has no preset bonus

  // Remove highlight on preset cards
  document.querySelectorAll('.topup-pack-card').forEach(card => {
    card.className = 'topup-pack-card apple-card p-4 text-left hover:border-pricingBlue transition-all rounded-2xl relative border border-hairline bg-gallery';
  });

  updateTopupCalculations();
}

function updateTopupCalculations() {
  const payEl = document.getElementById('summary-pay-amount');
  const getEl = document.getElementById('summary-get-credit');
  const qrAmt = document.getElementById('qr-exact-amount');
  const voucherAmt = document.getElementById('voucher-exact-note');
  const qrImg = document.getElementById('topup-qr-image');

  const finalCredit = currentAmount + currentBonus;

  if (payEl) payEl.innerText = `฿${currentAmount.toFixed(2)}`;
  if (getEl) getEl.innerText = `${finalCredit.toFixed(2)} เครดิต${currentBonus > 0 ? ` (+${currentBonus} โบนัส)` : ''}`;
  if (qrAmt) qrAmt.innerText = `฿${currentAmount.toFixed(2)}`;
  if (voucherAmt) voucherAmt.innerText = `฿${currentAmount.toFixed(2)}`;

  // Real QR image and account name come from admin settings; never show a made-up QR.
  const qrUrl = systemSettings?.promptpayQrUrl;
  const nameEl = document.getElementById('topup-promptpay-name');
  if (nameEl) nameEl.innerText = systemSettings?.promptpayName || 'ติดต่อแอดมิน';
  if (qrImg) {
    if (qrUrl) qrImg.src = qrUrl; else qrImg.removeAttribute('src');
    qrImg.classList.toggle('hidden', !qrUrl);
  }
}

function switchTopupPaymentTab(method) {
  currentMethod = method;
  const tabPP = document.getElementById('tab-topup-promptpay');
  const tabTM = document.getElementById('tab-topup-truemoney');
  const panelPP = document.getElementById('panel-topup-promptpay');
  const panelTM = document.getElementById('panel-topup-truemoney');

  if (method === 'promptpay') {
    if (tabPP) tabPP.className = 'flex-1 py-1.5 rounded-button font-medium transition-all bg-gallery text-ink shadow-sm flex items-center justify-center gap-1.5';
    if (tabTM) tabTM.className = 'flex-1 py-1.5 rounded-button font-medium transition-all text-slate hover:text-ink flex items-center justify-center gap-1.5';
    if (panelPP) panelPP.classList.remove('hidden');
    if (panelTM) panelTM.classList.add('hidden');
  } else {
    if (tabPP) tabPP.className = 'flex-1 py-1.5 rounded-button font-medium transition-all text-slate hover:text-ink flex items-center justify-center gap-1.5';
    if (tabTM) tabTM.className = 'flex-1 py-1.5 rounded-button font-medium transition-all bg-gallery text-ink shadow-sm flex items-center justify-center gap-1.5';
    if (panelPP) panelPP.classList.add('hidden');
    if (panelTM) panelTM.classList.remove('hidden');
  }
}

// ==========================================
// 4. FILE A PENDING TOP-UP REQUEST
// ==========================================
let isTopupSubmitting = false;

async function executeTopup(method) {
  if (isTopupSubmitting) return;
  if (!currentUser) {
    triggerToast('กรุณาเข้าสู่ระบบก่อนเติมเงิน');
    return;
  }

  const input = document.getElementById(method === 'promptpay' ? 'topup-slip-ref' : 'topup-voucher-link');
  const proof = input ? input.value.trim() : '';
  if (method === 'promptpay' && proof.length < 6) {
    triggerToast('กรุณากรอกเลขอ้างอิงสลิปให้ครบ');
    input?.focus();
    return;
  }
  if (method === 'truemoney' && !/^https:\/\/gift\.truemoney\.com\//.test(proof)) {
    triggerToast('กรุณากรอกลิงก์ซองของขวัญ TrueMoney ให้ถูกต้อง');
    input?.focus();
    return;
  }

  const btn = document.getElementById(method === 'promptpay' ? 'btn-confirm-topup-pp' : 'btn-confirm-topup-tm');
  const label = btn ? btn.innerText : '';
  isTopupSubmitting = true;
  if (btn) { btn.disabled = true; btn.innerText = 'กำลังส่งคำขอ...'; }

  try {
    const ref = doc(collection(db, "topup_transactions"));
    await setDoc(ref, {
      txnId: 'TOPUP-' + ref.id.slice(0, 8).toUpperCase(),
      uid: currentUser.uid,
      email: currentUser.email || '',
      amount: currentAmount,
      bonusCredit: currentBonus,
      finalCredit: currentAmount + currentBonus,
      paymentMethod: method,
      proofRef: proof,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    if (input) input.value = '';
    triggerToast('ส่งคำขอแล้ว แอดมินจะตรวจสอบและเติมเครดิตให้');
  } catch (err) {
    console.warn("Topup request failed:", err);
    triggerToast('ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
  } finally {
    isTopupSubmitting = false;
    if (btn) { btn.disabled = false; btn.innerText = label; }
  }
}

function renderTopupHistory() {
  const tbody = document.getElementById('topup-history-tbody');
  const empty = document.getElementById('topup-history-empty');
  if (!tbody) return;

  if (historyList.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');

  tbody.innerHTML = historyList.map(item => {
    const [label, cls] = TOPUP_STATUS[item.status] || [item.status || '-', 'text-slate'];
    const when = item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString('th-TH') : 'เมื่อสักครู่';
    return `
    <tr class="hover:bg-mist/70 transition-colors">
      <td class="py-2.5 px-3 font-mono font-medium text-ink">#${esc(item.txnId)}</td>
      <td class="py-2.5 px-3 text-slate">${item.paymentMethod === 'promptpay' ? 'พร้อมเพย์' : 'TrueMoney'}</td>
      <td class="py-2.5 px-3 font-mono font-medium text-ink">฿${Number(item.amount).toFixed(2)}</td>
      <td class="py-2.5 px-3 font-mono font-semibold text-ink">+${Number(item.finalCredit).toFixed(2)}</td>
      <td class="py-2.5 px-3 text-xs font-semibold ${cls}">${esc(label)}</td>
      <td class="py-2.5 px-3 text-right font-mono text-[10px] text-steel">${esc(when)}</td>
    </tr>`;
  }).join('');
}

function triggerToast(msg) {
  const box = document.getElementById('toast-box');
  const txt = document.getElementById('toast-text');
  if (!box || !txt) return;

  txt.innerText = msg;
  box.classList.remove('opacity-0', '-translate-y-4', 'scale-95', 'pointer-events-none');
  box.classList.add('opacity-100', 'translate-y-0', 'scale-100');

  setTimeout(() => {
    box.classList.add('opacity-0', '-translate-y-4', 'scale-95', 'pointer-events-none');
    box.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
  }, 2800);
}

async function handleSignOut() {
  try {
    await signOut(auth);
    window.location.reload();
  } catch (e) {
    console.warn("Sign out error:", e);
  }
}

// Window bindings
window.selectTopupAmount = selectTopupAmount;
window.handleCustomAmount = handleCustomAmount;
window.switchTopupPaymentTab = switchTopupPaymentTab;
window.executeTopup = executeTopup;
window.renderTopupHistory = renderTopupHistory;
window.handleSignOut = handleSignOut;
