import { db, auth } from "../firebase-config.js";
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc,
  getDocs,
  setDoc, 
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot, 
  query,
  where,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * TACTICAL STORE — Master Controller (js/index.js)
 * รวมระบบทั้งหน้าร้านค้า (Storefront) และระบบจัดการหลังบ้าน (Admin Dashboard + Stock Vault)
 */

// ==========================================
// 1. DEFAULT DATA & REPOSITORY
// ==========================================
const DEFAULT_PRODUCTS = [
  {
    id: '1',
    name: 'M4A1 Full Mod + T6 Ammo x300',
    category: 'ammo_acc',
    price: 350.00,
    koen: '5,500,000',
    stock: 12,
    image: 'https://images.unsplash.com/photo-1595590424283-b8f1784cb2c8?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1595590424283-b8f1784cb2c8?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1574226516831-e1dff420e5c7?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['Best Seller', 'พร้อมบวก'],
    desc: 'ปืน M4A1 ฟูลม็อดแต่งลดแรงถีบสูงสุด พร้อมกระสุนระดับ T6 M995 เจาะเกราะทะลวงระดับพระกาฬ x300 นัด พร้อมเล่นทันที',
    specs: ['เกราะ T5 ครบชุด', 'กระสุน T6 x300', 'Koen เงินสด 5.5M', 'กระเป๋า 28 ช่อง']
  },
  {
    id: '2',
    name: 'Starter Koen Account (15 Million)',
    category: 'koen',
    price: 150.00,
    koen: '15,000,000',
    stock: 45,
    image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['สายฟาร์ม', 'คุ้มสุด'],
    desc: 'ไอดีเปล่าเริ่มต้นที่มีเงิน Koen สะสม 15 ล้านในคลัง ไม่เคยโดนแบน ผูกอีเมลสะอาดพร้อมโอนกรรมสิทธิ์',
    specs: ['Koen สะสม 15,000,000', 'เลเวล 12+', 'ไม่เคยติดโทษแบน', 'เปลี่ยนอีเมลได้ทันที']
  },
  {
    id: '3',
    name: 'Sniper God Tier (AX50 + T7 Thermal)',
    category: 'full_acc',
    price: 890.00,
    koen: '30,000,000',
    stock: 0,
    image: 'https://images.unsplash.com/photo-1585098906517-8e1008d58544?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1585098906517-8e1008d58544?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1595590424283-b8f1784cb2c8?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['Premium', 'เทพสไน'],
    desc: 'เซ็ตสไนเปอร์ระดับสูงสุด AX50 ติดกล้องความร้อน T7 มองทะลุหมอกและใบไม้ เงินสดในตัว 30M เหมาะสำหรับสายซุ่มแนวหลัง',
    specs: ['สไนเปอร์ AX50 Mod เต็ม', 'กล้อง T7 Thermal', 'กระสุน T7 x100', 'Koen เงินสด 30M']
  },
  {
    id: '4',
    name: 'FAL Full Mod + M61 (T6) x300',
    category: 'ammo_acc',
    price: 420.00,
    koen: '8,000,000',
    stock: 7,
    image: 'https://images.unsplash.com/photo-1550985542-f28329b3a364?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1550985542-f28329b3a364?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1595590424283-b8f1784cb2c8?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['ดาเมจจัด', 'ยอดนิยม'],
    desc: 'FAL แต่งเต็มคุมแรงถีบขั้นสุด บรรจุกระสุน M61 เจาะเกราะหนัก 2 นัดร่วงทุกรายใน Kamona',
    specs: ['FAL Full Mod Recoil ต่ำ', 'กระสุน M61 T6 x300', 'เกราะ T6 พร้อมหมวก', 'Koen เงินสด 8M']
  },
  {
    id: '5',
    name: 'Mega Wealthy Koen (100 Million)',
    category: 'koen',
    price: 1190.00,
    koen: '100,000,000',
    stock: 3,
    image: 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['มหาเศรษฐี', 'VIP'],
    desc: 'เงินสด Koen 100 ล้าน ซื้อได้ทุกอย่างในตลาดกลาง จัดเป็นไอดีสายสะสมหรือเปิดคลังบวกยาวตลอดทั้งซีซั่น',
    specs: ['Koen 100,000,000 เต็ม', 'กล่องเซฟใหญ่ 3x3', 'ปลดล็อกพ่อค้าทุกตัว', 'รับประกันตลอดชีพ']
  },
  {
    id: '6',
    name: 'Budget Runner Set + MPX 9mm 7N31',
    category: 'full_acc',
    price: 120.00,
    koen: '3,000,000',
    stock: 18,
    image: 'https://images.unsplash.com/photo-1574226516831-e1dff420e5c7?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1574226516831-e1dff420e5c7?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1595590424283-b8f1784cb2c8?auto=format&fit=crop&q=80&w=800'
    ],
    tags: ['สายประหยัด', 'วิ่งไว'],
    desc: 'เซ็ตวิ่งฟาร์มของไว ปืน SMG MPX ยิงไว ดาเมจทะลุเกราะ 7N31 ของครบตัวพร้อมลุย',
    specs: ['MPX Full Mod ไวสุด', 'กระสุน 7N31 x250', 'เกราะเบา T4 วิ่งเร็ว', 'Koen เงินสด 3M']
  }
];

const CATEGORIES = [
  { id: 'all', name: 'ทั้งหมด' },
  { id: 'ammo_acc', name: 'ไอดีไก่กระสุน' },
  { id: 'koen', name: 'ไอดีเงิน Koen' },
  { id: 'full_acc', name: 'ไอดีพร้อมเล่น' },
  { id: 'skins', name: 'สกินปืน / เซ็ตชุด' }
];

const PRESET_IMAGES = {
  m4a1: 'https://images.unsplash.com/photo-1595590424283-b8f1784cb2c8?auto=format&fit=crop&q=80&w=800',
  koen: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&q=80&w=800',
  sniper: 'https://images.unsplash.com/photo-1585098906517-8e1008d58544?auto=format&fit=crop&q=80&w=800',
  fal: 'https://images.unsplash.com/photo-1550985542-f28329b3a364?auto=format&fit=crop&q=80&w=800',
  wealth: 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?auto=format&fit=crop&q=80&w=800',
  smg: 'https://images.unsplash.com/photo-1574226516831-e1dff420e5c7?auto=format&fit=crop&q=80&w=800'
};

// Global App State
let PRODUCTS = [...DEFAULT_PRODUCTS];
let currentCategory = 'all';
let searchQuery = '';
let stockFilter = 'all';
let sortOrder = 'default';
let selectedProduct = null;
let currentPaymentMethod = 'promptpay';
let discountAmount = 0;
let timerCountdown = 600;
let timerInterval = null;
let isPasswordRevealed = false;
let toastTimeout = null;
let currentDeliveredUsername = 'ArenaAgent9910';
let currentDeliveredPassword = 'KamonaStrike#2026';
let currentUser = null;
let currentModalGallery = [];
let currentGalleryIdx = 0;

// Anti-Abuse Promo Rate Limits
let promoFailedAttempts = 0;
let promoLockoutExpiry = 0;

// ==========================================
// 2. TOAST NOTIFICATION UTILITY
// ==========================================
function triggerToast(message) {
  const box = document.getElementById('toast-box');
  const text = document.getElementById('toast-text');
  if (!box || !text) return;

  text.innerText = message;
  box.classList.remove('opacity-0', '-translate-y-4', 'scale-95', 'pointer-events-none');
  box.classList.add('opacity-100', 'translate-y-0', 'scale-100');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    box.classList.add('opacity-0', '-translate-y-4', 'scale-95', 'pointer-events-none');
    box.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
  }, 3000);
}
window.showAdminToast = triggerToast;
window.triggerToast = triggerToast;

// ==========================================
// 3. FIRESTORE SYNC & LISTENER
// ==========================================
function initFirebaseProductsListener() {
  try {
    const productsRef = collection(db, "products");
    onSnapshot(productsRef, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreList = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          firestoreList.push({
            id: docSnap.id,
            name: data.name || 'ไม่มีชื่อสินค้า',
            category: data.category || 'all',
            price: Number(data.price) || 0,
            koen: data.koen || '-',
            stock: data.stock !== undefined ? Number(data.stock) : 0,
            image: data.image || 'https://placehold.co/800x500/18181b/f59e0b?text=Tactical',
            gallery: Array.isArray(data.gallery) && data.gallery.length > 0 ? data.gallery : [data.image],
            tags: Array.isArray(data.tags) ? data.tags : [],
            desc: data.desc || '',
            specs: Array.isArray(data.specs) ? data.specs : []
          });
        });
        PRODUCTS = firestoreList;
      } else {
        PRODUCTS = [...DEFAULT_PRODUCTS];
      }

      // ตรวจสอบและ Render ตามหน้าที่กำลังเปิด
      if (document.getElementById('admin-products-table-body')) {
        renderAdminProducts();
        updateAdminMetrics();
      }
      if (document.getElementById('product-grid')) {
        renderCategoryTabs();
        renderProducts();
        updateHeroMetrics();
      }
    }, (err) => {
      console.warn("Firestore listener fallback to default:", err);
      PRODUCTS = [...DEFAULT_PRODUCTS];
      if (document.getElementById('admin-products-table-body')) {
        renderAdminProducts();
        updateAdminMetrics();
      }
      if (document.getElementById('product-grid')) {
        renderCategoryTabs();
        renderProducts();
      }
    });
  } catch (e) {
    PRODUCTS = [...DEFAULT_PRODUCTS];
    if (document.getElementById('admin-products-table-body')) renderAdminProducts();
    if (document.getElementById('product-grid')) renderProducts();
  }
}

// ==========================================
// 4. ADMIN DASHBOARD: PIN VAULT & SECURITY
// ==========================================
let currentSecurityDoc = null;
let failedAttempts = 0;
let lockoutTimer = null;

async function hashPinWithSalt(pin, saltHex) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + ":" + saltHex + ":TACTICAL_PIN_VAULT_2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateRandomSalt() {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  return Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkSecurityPinState() {
  const gate = document.getElementById('admin-auth-gate');
  if (!gate) return; // ไม่ได้เปิดหน้า admin

  const loadingState = document.getElementById('pin-state-loading');
  const setupState = document.getElementById('pin-state-setup');
  const unlockState = document.getElementById('pin-state-unlock');

  if (sessionStorage.getItem('tactical_admin_pin_unlocked') === 'true') {
    unlockDashboardUI();
    return;
  }

  try {
    let storedData = null;
    const pinDoc = await getDoc(doc(db, 'system_settings', 'admin_pin'));
    if (pinDoc.exists()) {
      storedData = pinDoc.data();
    } else {
      const local = localStorage.getItem('tactical_admin_pin_vault');
      if (local) storedData = JSON.parse(local);
    }

    if (loadingState) loadingState.classList.add('hidden');

    if (!storedData || !storedData.pinHash || !storedData.salt) {
      if (setupState) setupState.classList.remove('hidden');
      if (unlockState) unlockState.classList.add('hidden');
    } else {
      currentSecurityDoc = storedData;
      if (setupState) setupState.classList.add('hidden');
      if (unlockState) unlockState.classList.remove('hidden');
      initPinDigitBoxes();
    }
  } catch (err) {
    console.warn('Security PIN check fallback:', err);
    if (loadingState) loadingState.classList.add('hidden');
    if (setupState) setupState.classList.remove('hidden');
  }
}

async function handlePinSetupSubmit(event) {
  event.preventDefault();
  const p1 = document.getElementById('setup-pin-val').value.trim();
  const p2 = document.getElementById('setup-pin-confirm').value.trim();

  if (!/^\d{6}$/.test(p1)) {
    triggerToast('รหัส PIN ต้องเป็นตัวเลข 6 หลักเท่านั้น');
    return;
  }
  if (p1 !== p2) {
    triggerToast('รหัส PIN ทั้ง 2 ช่องไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
    return;
  }

  try {
    const salt = generateRandomSalt();
    const pinHash = await hashPinWithSalt(p1, salt);
    const payload = {
      pinHash,
      salt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      setBy: 'atest'
    };

    try {
      await setDoc(doc(db, 'system_settings', 'admin_pin'), payload);
    } catch (e) {
      console.warn('Firestore set PIN error, saved locally:', e);
    }
    localStorage.setItem('tactical_admin_pin_vault', JSON.stringify(payload));
    
    currentSecurityDoc = payload;
    triggerToast('บันทึกรหัส PIN ลงฐานข้อมูลสำเร็จ');
    sessionStorage.setItem('tactical_admin_pin_unlocked', 'true');
    setTimeout(() => unlockDashboardUI(), 600);
  } catch (err) {
    triggerToast('เกิดข้อผิดพลาดในการบันทึก PIN: ' + err.message);
  }
}

async function handlePinUnlockSubmit(event) {
  if (event) event.preventDefault();
  if (failedAttempts >= 5) {
    triggerToast('ระบบถูกล็อกชั่วคราวเนื่องจากกรอกรหัสผิดเกินกำหนด');
    return;
  }

  const digits = Array.from(document.querySelectorAll('.pin-digit-input')).map(i => i.value).join('');
  if (digits.length !== 6) {
    triggerToast('กรุณากรอกรหัส PIN ให้ครบ 6 หลัก');
    return;
  }

  const inputHash = await hashPinWithSalt(digits, currentSecurityDoc.salt);
  if (inputHash === currentSecurityDoc.pinHash) {
    failedAttempts = 0;
    sessionStorage.setItem('tactical_admin_pin_unlocked', 'true');
    triggerToast('ปลดล็อกสิทธิ์ผู้ดูแลสำเร็จ');
    unlockDashboardUI();
  } else {
    failedAttempts++;
    document.getElementById('pin-error-msg')?.classList.remove('hidden');
    document.querySelectorAll('.pin-digit-input').forEach(i => i.value = '');
    document.querySelector('.pin-digit-input')?.focus();

    if (failedAttempts >= 5) {
      triggerPinLockout();
    } else {
      triggerToast(`รหัส PIN ไม่ถูกต้อง (เหลือโอกาส ${5 - failedAttempts} ครั้ง)`);
    }
  }
}

function triggerPinLockout() {
  const lockMsg = document.getElementById('pin-lockout-msg');
  const timerSpan = document.getElementById('pin-lockout-timer');
  const btn = document.getElementById('btn-pin-submit');
  if (lockMsg) lockMsg.classList.remove('hidden');
  if (btn) btn.disabled = true;

  let remaining = 60;
  if (lockoutTimer) clearInterval(lockoutTimer);
  lockoutTimer = setInterval(() => {
    remaining--;
    if (timerSpan) timerSpan.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(lockoutTimer);
      failedAttempts = 0;
      if (lockMsg) lockMsg.classList.add('hidden');
      if (btn) btn.disabled = false;
    }
  }, 1000);
}

function unlockDashboardUI() {
  document.getElementById('admin-auth-gate')?.classList.add('hidden');
  document.getElementById('admin-main-content')?.classList.remove('hidden');
  renderAdminProducts();
  renderAdminOrders();
  renderAdminPromos();
  loadAdminSettings();
}

function initPinDigitBoxes() {
  const inputs = document.querySelectorAll('.pin-digit-input');
  inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      if (e.target.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
      if (Array.from(inputs).every(i => i.value.length === 1)) {
        handlePinUnlockSubmit(null);
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        inputs[index - 1].focus();
      }
    });
  });
  inputs[0]?.focus();
}

function promptResetPin() {
  if (confirm('คุณต้องการรีเซ็ตรหัส PIN เพื่อตั้งใหม่ใช่หรือไม่?')) {
    sessionStorage.removeItem('tactical_admin_pin_unlocked');
    localStorage.removeItem('tactical_admin_pin_vault');
    location.reload();
  }
}

function lockAdminSession() {
  sessionStorage.removeItem('tactical_admin_pin_unlocked');
  location.reload();
}

// ==========================================
// 5. ADMIN: PRODUCT CRUD & TABLE (WITH STOCK BUTTON)
// ==========================================
function updateAdminMetrics() {
  const total = PRODUCTS.length;
  const inStock = PRODUCTS.filter(p => Number(p.stock) > 0).length;
  const outOfStock = PRODUCTS.filter(p => Number(p.stock) === 0).length;
  
  const elTotal = document.getElementById('metric-total-products');
  const elIn = document.getElementById('metric-instock-products');
  const elOut = document.getElementById('metric-outofstock-products');
  
  if (elTotal) elTotal.innerText = total;
  if (elIn) elIn.innerText = inStock;
  if (elOut) elOut.innerText = outOfStock;
}

function renderAdminProducts(customList = null) {
  const tbody = document.getElementById('admin-products-table-body');
  const empty = document.getElementById('admin-products-empty');
  if (!tbody) return;

  const list = customList || PRODUCTS;
  tbody.innerHTML = '';

  if (list.length === 0) {
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');

  tbody.innerHTML = list.map(product => {
    const isOutOfStock = Number(product.stock) === 0;

    return `
      <tr class="hover:bg-mist/70 transition-colors border-b border-hairline">
        <td class="py-3 px-4">
          <div class="w-14 h-10 rounded-lg overflow-hidden bg-mist border border-hairline shrink-0">
            <img 
              src="${product.image}" 
              alt="${product.name}" 
              class="w-full h-full object-cover"
              onerror="this.src='https://placehold.co/100x70/f5f5f7/86868b?text=Tactical'"
            />
          </div>
        </td>
        <td class="py-3 px-4">
          <div class="font-medium text-ink text-xs line-clamp-1">${product.name}</div>
          <div class="text-[11px] text-slate line-clamp-1">${product.desc || '-'}</div>
        </td>
        <td class="py-3 px-4">
          <span class="inline-block bg-mist border border-hairline px-2 py-0.5 rounded-full text-[10px] text-slate font-mono">
            ${product.category}
          </span>
        </td>
        <td class="py-3 px-4 font-mono font-semibold text-ink">
          ฿${Number(product.price).toFixed(2)}
        </td>
        <td class="py-3 px-4 font-mono text-slate">
          ${product.koen}
        </td>
        <td class="py-3 px-4">
          ${!isOutOfStock 
            ? `<span class="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                 <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                 ${product.stock} ชิ้น
               </span>`
            : `<span class="inline-block text-launchOrange font-semibold text-[11px] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                 หมด (0)
               </span>`
          }
        </td>
        <td class="py-3 px-4 text-right">
          <div class="inline-flex items-center gap-1.5 justify-end">
            <!-- ปุ่มสต็อก (Stock Replenishment Button) -->
            <button 
              onclick="openStockModal('${product.id}')" 
              title="เติมสต็อกไอดีชุดใหญ่" 
              class="apple-pricing-pill px-3 py-1 text-[11px] font-medium flex items-center gap-1.5 shadow-sm">
              <span>📦 สต็อก</span>
              <span class="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px] font-mono">${product.stock}</span>
            </button>
            
            <!-- ปุ่มแก้ไข -->
            <button 
              onclick="openProductModal('${product.id}')" 
              title="แก้ไขรายละเอียด" 
              class="apple-explore-pill px-2.5 py-1 text-[11px] text-slate hover:text-ink">
              แก้ไข
            </button>
            
            <!-- ปุ่มลบ -->
            <button 
              onclick="deleteAdminProduct('${product.id}')" 
              title="ลบสินค้านี้" 
              class="apple-explore-pill px-2.5 py-1 text-[11px] text-red-500 border-red-200 hover:bg-red-50">
              ลบ
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterAdminProducts(queryText) {
  const q = (queryText || '').toLowerCase();
  const filtered = PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q))
  );
  renderAdminProducts(filtered);
}

function openProductModal(productId = null) {
  const modal = document.getElementById('product-form-modal');
  const heading = document.getElementById('product-modal-heading');
  const idInput = document.getElementById('prod-edit-id');
  if (!modal) return;

  if (productId) {
    const p = PRODUCTS.find(it => it.id === productId);
    if (!p) return;
    if (heading) heading.innerText = 'แก้ไขสินค้า: ' + p.name;
    if (idInput) idInput.value = p.id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-category').value = p.category;
    document.getElementById('prod-koen').value = p.koen;
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-stock').value = p.stock;
    document.getElementById('prod-image').value = p.image;
    document.getElementById('prod-gallery').value = (p.gallery || []).join('\n');
    document.getElementById('prod-tags').value = (p.tags || []).join(', ');
    document.getElementById('prod-desc').value = p.desc;
    document.getElementById('prod-specs').value = (p.specs || []).join('\n');
    updateImagePreview(p.image);
  } else {
    if (heading) heading.innerText = 'เพิ่มสินค้าใหม่';
    if (idInput) idInput.value = '';
    document.getElementById('product-crud-form').reset();
    updateImagePreview('');
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeProductModal() {
  const modal = document.getElementById('product-form-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

async function handleProductFormSubmit(event) {
  event.preventDefault();
  const idInput = document.getElementById('prod-edit-id').value.trim();
  const name = document.getElementById('prod-name').value.trim();
  const category = document.getElementById('prod-category').value;
  const koen = document.getElementById('prod-koen').value.trim();
  const price = parseFloat(document.getElementById('prod-price').value) || 0;
  const stock = parseInt(document.getElementById('prod-stock').value, 10) || 0;
  const image = document.getElementById('prod-image').value.trim();
  const galleryText = document.getElementById('prod-gallery').value.trim();
  const gallery = galleryText ? galleryText.split('\n').map(s => s.trim()).filter(Boolean) : [image];
  const tagsText = document.getElementById('prod-tags').value.trim();
  const tags = tagsText ? tagsText.split(',').map(s => s.trim()).filter(Boolean) : [];
  const desc = document.getElementById('prod-desc').value.trim();
  const specsText = document.getElementById('prod-specs').value.trim();
  const specs = specsText ? specsText.split('\n').map(s => s.trim()).filter(Boolean) : [];

  const prodId = idInput || 'prod_' + Date.now();
  const payload = {
    id: prodId,
    name,
    category,
    koen,
    price,
    stock,
    image,
    gallery,
    tags,
    desc,
    specs,
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, "products", prodId), payload, { merge: true });
    triggerToast('บันทึกข้อมูลสินค้าลง Firebase สำเร็จ!');
    closeProductModal();
  } catch (err) {
    console.warn("Save product error (local fallback):", err);
    const idx = PRODUCTS.findIndex(p => p.id === prodId);
    if (idx >= 0) PRODUCTS[idx] = payload;
    else PRODUCTS.push(payload);
    renderAdminProducts();
    updateAdminMetrics();
    closeProductModal();
    triggerToast('บันทึกสินค้าในระบบเรียบร้อย (Local)');
  }
}

async function deleteAdminProduct(productId) {
  if (!confirm('คุณต้องการลบสินค้านี้ออกจากระบบใช่หรือไม่?')) return;
  try {
    await deleteDoc(doc(db, "products", productId));
    triggerToast('ลบสินค้าสำเร็จเรียบร้อย');
  } catch (err) {
    console.warn("Delete product error:", err);
    PRODUCTS = PRODUCTS.filter(p => p.id !== productId);
    renderAdminProducts();
    updateAdminMetrics();
    triggerToast('ลบสินค้าในระบบเรียบร้อย (Local)');
  }
}

async function seedInitialProducts() {
  if (!confirm('ต้องการคืนค่าสินค้าเริ่มต้น 6 รายการลงฐานข้อมูลใช่หรือไม่?')) return;
  triggerToast('กำลังคืนค่าสินค้าเริ่มต้น...');
  try {
    for (const p of DEFAULT_PRODUCTS) {
      await setDoc(doc(db, "products", p.id), p);
    }
    triggerToast('คืนค่า 6 สินค้าเริ่มต้นสำเร็จ!');
  } catch (err) {
    console.warn("Seed fallback error:", err);
    PRODUCTS = [...DEFAULT_PRODUCTS];
    renderAdminProducts();
    updateAdminMetrics();
    triggerToast('คืนค่าข้อมูลในระบบ Local เรียบร้อย');
  }
}

function setImagePreset(presetKey) {
  const url = PRESET_IMAGES[presetKey];
  if (url) {
    const input = document.getElementById('prod-image');
    if (input) input.value = url;
    updateImagePreview(url);
  }
}

function updateImagePreview(url) {
  const el = document.getElementById('image-preview-element');
  if (el) el.src = url || 'https://placehold.co/800x500/f5f5f7/86868b?text=Image+Preview';
}

function openStockModalQuick() {
  if (PRODUCTS && PRODUCTS.length > 0) {
    openStockModal(PRODUCTS[0].id);
  } else {
    triggerToast('กรุณาเพิ่มสินค้าหรือคืนค่าเริ่มต้นก่อนจัดการสต็อก');
  }
}

// ==========================================
// 6. ADMIN: BULK STOCK REPLENISHMENT ENGINE
// ==========================================
let currentStockProductId = null;
let parsedStockItems = [];

function parseStockLines(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const items = [];
  const seen = new Set();
  let hasDuplicates = false;

  lines.forEach((line) => {
    let username = '';
    let password = '';

    const emailPassMatch = line.match(/^(?:email|user|username)\s+([^\s]+)\s+(?:password|pass|pwd)\s+(.+)$/i);
    const colonPipeMatch = line.match(/^([^:\s|]+)\s*[:|]\s*(.+)$/);
    const spaceMatch = line.match(/^([^\s]+)\s+([^\s]+)$/);

    if (emailPassMatch) {
      username = emailPassMatch[1].trim();
      password = emailPassMatch[2].trim();
    } else if (colonPipeMatch) {
      username = colonPipeMatch[1].trim();
      password = colonPipeMatch[2].trim();
    } else if (spaceMatch) {
      username = spaceMatch[1].trim();
      password = spaceMatch[2].trim();
    }

    if (username && password) {
      const key = username.toLowerCase();
      if (seen.has(key)) {
        hasDuplicates = true;
      } else {
        seen.add(key);
        items.push({ username, password, status: 'available' });
      }
    }
  });

  return { items, hasDuplicates };
}

function handleStockTextareaInput(val) {
  const { items, hasDuplicates } = parseStockLines(val);
  parsedStockItems = items;

  const counter = document.getElementById('stock-parsed-counter');
  const dupWarning = document.getElementById('stock-duplicate-warning');
  const btnLabel = document.getElementById('btn-add-stock-label');

  if (counter) counter.textContent = `ตรวจพบ: ${items.length} รายการพร้อมนำเข้า`;
  if (btnLabel) btnLabel.textContent = `บันทึกและนำเข้าสต็อก (${items.length} ชิ้น)`;
  if (dupWarning) {
    if (hasDuplicates) dupWarning.classList.remove('hidden');
    else dupWarning.classList.add('hidden');
  }
}

async function openStockModal(productId) {
  currentStockProductId = productId;
  parsedStockItems = [];

  const modal = document.getElementById('stock-management-modal');
  const textarea = document.getElementById('bulk-stock-textarea');
  if (textarea) textarea.value = '';
  handleStockTextareaInput('');

  const prod = PRODUCTS.find(p => p.id === productId);
  const prodTitle = prod ? prod.name : 'สินค้า #' + productId;
  const curStock = prod ? prod.stock : 0;

  document.getElementById('stock-modal-prod-title').textContent = prodTitle;
  document.getElementById('stock-modal-current-count').textContent = curStock;

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  loadAvailableStockItems(productId);
}

function closeStockModal() {
  const modal = document.getElementById('stock-management-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  currentStockProductId = null;
}

async function submitBulkStockImport() {
  if (!currentStockProductId) {
    triggerToast('ไม่พบข้อมูลสินค้าระหว่างทำรายการ');
    return;
  }
  if (parsedStockItems.length === 0) {
    triggerToast('กรุณาวางรายการไอดีอย่างน้อย 1 บรรทัด (เช่น email ... password ...)');
    return;
  }

  const btn = document.getElementById('btn-confirm-add-stock');
  if (btn) btn.disabled = true;

  try {
    const batch = writeBatch(db);
    const prodRef = doc(db, 'products', currentStockProductId);

    parsedStockItems.forEach(item => {
      const itemRef = doc(collection(prodRef, 'stock_items'));
      batch.set(itemRef, {
        username: item.username,
        password: item.password,
        status: 'available',
        addedAt: serverTimestamp(),
        addedBy: 'atest'
      });
    });

    batch.update(prodRef, {
      stock: increment(parsedStockItems.length)
    });

    await batch.commit();

    triggerToast(`นำเข้าไอดีสำเร็จเรียบร้อย (${parsedStockItems.length} ชิ้น)`);
    document.getElementById('bulk-stock-textarea').value = '';
    handleStockTextareaInput('');
    
    loadAvailableStockItems(currentStockProductId);
  } catch (err) {
    console.warn('Stock import fallback (local):', err);
    const key = 'tactical_stock_' + currentStockProductId;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [...existing, ...parsedStockItems.map((it, idx) => ({
      id: 'local_' + Date.now() + '_' + idx,
      username: it.username,
      password: it.password,
      status: 'available',
      addedAt: new Date().toISOString()
    }))];
    localStorage.setItem(key, JSON.stringify(updated));

    // Update local product stock
    const p = PRODUCTS.find(it => it.id === currentStockProductId);
    if (p) p.stock = (p.stock || 0) + parsedStockItems.length;

    renderAdminProducts();
    updateAdminMetrics();
    loadAvailableStockItems(currentStockProductId);
    triggerToast(`นำเข้าไอดีสำเร็จ (${parsedStockItems.length} ชิ้น - โหมด Local)`);
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function loadAvailableStockItems(productId) {
  const tbody = document.getElementById('stock-items-list-body');
  const emptyMsg = document.getElementById('stock-items-empty');
  const countBadge = document.getElementById('stock-available-count');
  if (!tbody) return;

  tbody.innerHTML = '';
  let items = [];

  try {
    const stockCol = collection(db, 'products', productId, 'stock_items');
    const q = query(stockCol, where('status', '==', 'available'));
    const snap = await getDocs(q);
    snap.forEach(docSnap => {
      items.push({ id: docSnap.id, ...docSnap.data() });
    });
  } catch (e) {
    const key = 'tactical_stock_' + productId;
    items = JSON.parse(localStorage.getItem(key) || '[]').filter(i => i.status === 'available');
  }

  if (countBadge) countBadge.textContent = items.length;
  const modalCount = document.getElementById('stock-modal-current-count');
  if (modalCount) modalCount.textContent = items.length;

  if (items.length === 0) {
    if (emptyMsg) emptyMsg.classList.remove('hidden');
    return;
  }

  if (emptyMsg) emptyMsg.classList.add('hidden');
  tbody.innerHTML = items.map((it, idx) => `
    <tr class="hover:bg-gallery/80 transition-colors">
      <td class="py-2.5 px-3 text-slate w-8">${idx + 1}.</td>
      <td class="py-2.5 px-3 font-semibold text-ink select-all">${it.username}</td>
      <td class="py-2.5 px-3 text-slate select-all">••••••••</td>
      <td class="py-2.5 px-3 text-right">
        <button onclick="deleteSingleStockItem('${productId}', '${it.id}')" class="text-red-500 hover:text-red-700 text-[11px] font-medium hover:underline">
          ลบออก
        </button>
      </td>
    </tr>
  `).join('');
}

async function deleteSingleStockItem(productId, itemId) {
  if (!confirm('คุณต้องการนำไอดีนี้ออกจากคลังสต็อกใช่หรือไม่?')) return;

  try {
    const batch = writeBatch(db);
    const itemRef = doc(db, 'products', productId, 'stock_items', itemId);
    const prodRef = doc(db, 'products', productId);

    batch.delete(itemRef);
    batch.update(prodRef, {
      stock: increment(-1)
    });
    await batch.commit();

    triggerToast('ลบไอดีออกจากคลังเรียบร้อย');
    loadAvailableStockItems(productId);
  } catch (err) {
    const key = 'tactical_stock_' + productId;
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = items.filter(i => i.id !== itemId);
    localStorage.setItem(key, JSON.stringify(filtered));

    const p = PRODUCTS.find(it => it.id === productId);
    if (p && p.stock > 0) p.stock -= 1;

    renderAdminProducts();
    updateAdminMetrics();
    loadAvailableStockItems(productId);
    triggerToast('ลบไอดีเรียบร้อย');
  }
}

// ==========================================
// 7. ADMIN: ORDERS & PROMOS & SETTINGS
// ==========================================
async function renderAdminOrders() {
  const tbody = document.getElementById('admin-orders-table-body');
  const empty = document.getElementById('admin-orders-empty');
  if (!tbody) return;

  let orders = [];
  try {
    const snap = await getDocs(collection(db, 'orders'));
    snap.forEach(d => orders.push({ id: d.id, ...d.data() }));
  } catch (e) {
    orders = JSON.parse(localStorage.getItem('tactical_my_orders') || '[]');
  }

  // Update Metrics
  const rev = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const promptPayCount = orders.filter(o => o.paymentMethod === 'promptpay').length;
  const trueMoneyCount = orders.filter(o => o.paymentMethod === 'truemoney').length;

  const mRev = document.getElementById('metric-order-revenue');
  const mCount = document.getElementById('metric-order-count');
  const mPP = document.getElementById('metric-order-promptpay');
  const mTM = document.getElementById('metric-order-truemoney');

  if (mRev) mRev.innerText = `฿${rev.toFixed(2)}`;
  if (mCount) mCount.innerText = orders.length;
  if (mPP) mPP.innerText = promptPayCount;
  if (mTM) mTM.innerText = trueMoneyCount;

  if (orders.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');

  tbody.innerHTML = orders.map(o => {
    const acc = o.accountDelivered || {};
    return `
      <tr class="hover:bg-mist/70 transition-colors border-b border-hairline">
        <td class="py-3 px-4 font-mono font-bold text-pricingBlue">${o.orderNumber || o.id}</td>
        <td class="py-3 px-4 text-slate">${o.createdAt ? new Date(o.createdAt).toLocaleString('th-TH') : '-'}</td>
        <td class="py-3 px-4 font-medium text-ink">${o.productName}</td>
        <td class="py-3 px-4 font-mono font-bold text-ink">฿${Number(o.amount).toFixed(2)}</td>
        <td class="py-3 px-4 uppercase font-semibold text-slate">${o.paymentMethod || 'PromptPay'}</td>
        <td class="py-3 px-4 font-mono text-xs select-all text-slate">${acc.username || 'User'}:${acc.password || '••••••'}</td>
        <td class="py-3 px-4">
          <span class="inline-block text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-200">
            สำเร็จ (Delivered)
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

function refreshOrders() {
  renderAdminOrders();
  triggerToast('รีเฟรชข้อมูลคำสั่งซื้อเรียบร้อย');
}

// ==========================================
// 3. PROMO CODE MANAGEMENT (Moved to js/back/code.js)
// ==========================================
// Separate module js/back/code.js handles renderAdminPromos, openPromoModal,
// closePromoModal, handlePromoTypeChange, handleSavePromoModal, deletePromo.

async function loadAdminSettings() {
  try {
    let data = null;
    try {
      const sDoc = await getDoc(doc(db, 'system', 'settings'));
      if (sDoc.exists()) {
        data = sDoc.data();
      }
    } catch (e) {
      console.warn("Load settings remote fallback:", e);
    }

    if (!data) {
      const local = localStorage.getItem('tactical_store_settings');
      if (local) {
        try { data = JSON.parse(local); } catch (_) {}
      }
    }

    if (!data) {
      data = {
        marqueeText: "ระบบจัดส่งไอดีอัตโนมัติ 24 ชม. ได้รับรหัสทันทีหลังชำระเงิน",
        ribbonText: "จ่ายดอกเบี้ย 0% นานสูงสุด 10 เดือน* สำหรับผลิตภัณฑ์และแพ็กเกจ Tactical Store ใหม่ของคุณ",
        ribbonLinkText: "เลือกซื้อ",
        ribbonLinkUrl: "#catalog-section",
        stat1Val: "45,200+",
        stat1Lbl: "สมาชิกในระบบ",
        stat2Val: "1,405",
        stat2Lbl: "ไอดีพร้อมส่งทันที",
        stat3Val: "89,500+",
        stat3Lbl: "ออเดอร์สำเร็จ",
        stat4Val: "~3 วินาที",
        stat4Lbl: "เวลาจัดส่งเฉลี่ย",
        discordLink: "https://discord.gg/tacticalstore",
        lineId: "@tacticalstore",
        slipokKey: "",
        slipokBranch: "",
        truemoneyKey: "",
        promptpayNo: ""
      };
    }

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null) el.value = val;
    };

    setVal('setting-marquee-text', data.marqueeText);
    setVal('setting-ribbon-text', data.ribbonText);
    setVal('setting-ribbon-link-text', data.ribbonLinkText);
    setVal('setting-ribbon-link-url', data.ribbonLinkUrl);
    setVal('setting-stat1-val', data.stat1Val);
    setVal('setting-stat1-lbl', data.stat1Lbl);
    setVal('setting-stat2-val', data.stat2Val);
    setVal('setting-stat2-lbl', data.stat2Lbl);
    setVal('setting-stat3-val', data.stat3Val);
    setVal('setting-stat3-lbl', data.stat3Lbl);
    setVal('setting-stat4-val', data.stat4Val);
    setVal('setting-stat4-lbl', data.stat4Lbl);
    setVal('setting-discord-link', data.discordLink);
    setVal('setting-line-id', data.lineId);
    setVal('setting-slipok-key', data.slipokKey);
    setVal('setting-slipok-branch', data.slipokBranch);
    setVal('setting-truemoney-key', data.truemoneyKey);
    setVal('setting-promptpay-no', data.promptpayNo);

  } catch (e) {
    console.warn("Load settings error:", e);
  }
}

async function handleSaveSettings(event) {
  event.preventDefault();

  const getVal = (id) => (document.getElementById(id)?.value || '').trim();

  const payload = {
    marqueeText: getVal('setting-marquee-text'),
    ribbonText: getVal('setting-ribbon-text'),
    ribbonLinkText: getVal('setting-ribbon-link-text'),
    ribbonLinkUrl: getVal('setting-ribbon-link-url'),
    stat1Val: getVal('setting-stat1-val'),
    stat1Lbl: getVal('setting-stat1-lbl'),
    stat2Val: getVal('setting-stat2-val'),
    stat2Lbl: getVal('setting-stat2-lbl'),
    stat3Val: getVal('setting-stat3-val'),
    stat3Lbl: getVal('setting-stat3-lbl'),
    stat4Val: getVal('setting-stat4-val'),
    stat4Lbl: getVal('setting-stat4-lbl'),
    discordLink: getVal('setting-discord-link'),
    lineId: getVal('setting-line-id'),
    slipokKey: getVal('setting-slipok-key'),
    slipokBranch: getVal('setting-slipok-branch'),
    truemoneyKey: getVal('setting-truemoney-key'),
    promptpayNo: getVal('setting-promptpay-no'),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, 'system', 'settings'), payload, { merge: true });
    triggerToast('✓ บันทึกการตั้งค่าร้านค้า & API Keys สำเร็จ!');
  } catch (e) {
    console.warn("Save settings fallback:", e);
    triggerToast('✓ บันทึกการตั้งค่าร้านค้า & API Keys เรียบร้อย (Local)');
  }

  localStorage.setItem('tactical_store_settings', JSON.stringify(payload));
}

async function renderAdminTopups() {
  const tbody = document.getElementById('admin-topups-table-body');
  const emptyEl = document.getElementById('admin-topups-empty');
  if (!tbody) return;

  let topups = [
    { id: 'TP-1001', userEmail: 'commander@tactical.gg', method: 'PromptPay SlipOK', amount: 500.00, credit: 500.00, slipRef: '202610129841', status: 'completed' },
    { id: 'TP-1002', userEmail: 'arena_pro@gmail.com', method: 'TrueMoney Voucher', amount: 300.00, credit: 300.00, slipRef: 'https://gift.truemoney...', status: 'completed' },
    { id: 'TP-1003', userEmail: 'ghost_operator@ogzmail.com', method: 'PromptPay SlipOK', amount: 1200.00, credit: 1200.00, slipRef: '202610127712', status: 'completed' }
  ];

  try {
    const snap = await getDocs(collection(db, 'topup_transactions'));
    if (!snap.empty) {
      topups = [];
      snap.forEach(d => topups.push({ id: d.id, ...d.data() }));
    }
  } catch (e) {
    const local = localStorage.getItem('tactical_admin_topups');
    if (local) {
      try { topups = JSON.parse(local); } catch (_) {}
    }
  }

  if (topups.length === 0) {
    tbody.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }
  if (emptyEl) emptyEl.classList.add('hidden');

  tbody.innerHTML = topups.map(t => `
    <tr class="hover:bg-mist/70 transition-colors border-b border-hairline">
      <td class="py-3 px-4 font-mono font-bold text-xs text-ink">${t.id}</td>
      <td class="py-3 px-4 text-xs font-mono text-slate">${t.userEmail || t.userId || 'Guest'}</td>
      <td class="py-3 px-4 text-xs font-medium text-ink">${t.method || 'PromptPay'}</td>
      <td class="py-3 px-4 text-xs font-mono font-semibold text-pricingBlue">฿${Number(t.amount || 0).toFixed(2)}</td>
      <td class="py-3 px-4 text-xs font-mono font-bold text-emerald-600">+${Number(t.credit || t.amount || 0).toFixed(2)} ฿</td>
      <td class="py-3 px-4 text-xs font-mono text-slate max-w-[180px] truncate" title="${t.slipRef || '-'}">${t.slipRef || '-'}</td>
      <td class="py-3 px-4">
        <span class="inline-block text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-200">
          ${t.status === 'completed' ? 'สำเร็จ (Approved)' : (t.status || 'สำเร็จ')}
        </span>
      </td>
    </tr>
  `).join('');
}


function switchAdminTab(tabName) {
  const tabs = ['products', 'orders', 'promos', 'topups', 'settings'];
  tabs.forEach(t => {
    const sec = document.getElementById(`admin-sec-${t}`);
    const btn = document.getElementById(`admin-tab-btn-${t}`);
    if (sec) sec.classList.toggle('hidden', t !== tabName);
    if (btn) {
      if (t === tabName) {
        btn.className = 'px-4 py-1.5 rounded-button text-xs font-normal transition-all bg-ink text-gallery flex items-center gap-2 shrink-0';
      } else {
        btn.className = 'px-4 py-1.5 rounded-button text-xs font-normal transition-all text-slate hover:text-ink flex items-center gap-2 shrink-0';
      }
    }
  });

  if (tabName === 'promos') {
    if (typeof window.renderAdminPromos === 'function') {
      window.renderAdminPromos();
    }
  } else if (tabName === 'topups') {
    if (typeof window.renderAdminTopups === 'function') {
      window.renderAdminTopups();
    }
  }
}

// ==========================================
// 8. STOREFRONT: CATALOG & GALLERY & CHECKOUT
// ==========================================
function initAuthListener() {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const loggedOutContainer = document.getElementById('auth-logged-out');
    const loggedInContainer = document.getElementById('auth-logged-in');
    const displayNameEl = document.getElementById('user-display-name');
    const avatarInitialEl = document.getElementById('user-avatar-initial');
    const mobileAuthText = document.getElementById('mobile-nav-auth-text');

    if (user) {
      const name = user.displayName || user.email.split('@')[0];
      if (loggedOutContainer) loggedOutContainer.classList.add('hidden');
      if (loggedInContainer) {
        loggedInContainer.classList.remove('hidden');
        loggedInContainer.classList.add('flex');
      }
      if (displayNameEl) displayNameEl.innerText = name;
      if (avatarInitialEl) avatarInitialEl.innerText = name.charAt(0).toUpperCase();
      if (mobileAuthText) mobileAuthText.innerText = name.slice(0, 5) + '...';
      updateMyOrdersBadge();
    } else {
      if (loggedOutContainer) loggedOutContainer.classList.remove('hidden');
      if (loggedInContainer) {
        loggedInContainer.classList.add('hidden');
        loggedInContainer.classList.remove('flex');
      }
      if (mobileAuthText) mobileAuthText.innerText = 'บัญชี';
    }
  });
}

async function handleSignOut() {
  try {
    await signOut(auth);
    triggerToast('ออกจากระบบเรียบร้อยแล้ว');
  } catch (error) {
    triggerToast('เกิดข้อผิดพลาดในการออกจากระบบ');
  }
}

function updateHeroMetrics() {
  const inStockTotal = PRODUCTS.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const el = document.getElementById('hero-instock-count');
  if (el) el.innerText = inStockTotal > 0 ? inStockTotal.toLocaleString() : '1,405';
}

function renderCategoryTabs() {
  const tabsContainer = document.getElementById('category-tabs');
  if (!tabsContainer) return;

  tabsContainer.innerHTML = CATEGORIES.map(cat => {
    const isActive = cat.id === currentCategory;
    const btnClass = isActive 
      ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-white/5';
    return `
      <button onclick="filterCategory('${cat.id}')" class="px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 ${btnClass}">
        ${cat.name}
      </button>
    `;
  }).join('');
}

function filterCategory(catId) {
  currentCategory = catId;
  renderCategoryTabs();
  renderProducts();
}

function handleSearch(val) {
  searchQuery = val;
  renderProducts();
}

function setStockFilter(mode) {
  stockFilter = mode;
  const btnAll = document.getElementById('filter-stock-all');
  const btnIn = document.getElementById('filter-stock-instock');
  if (btnAll && btnIn) {
    if (mode === 'all') {
      btnAll.className = 'px-3.5 py-1.5 rounded-xl font-bold transition-all bg-amber-500 text-black';
      btnIn.className = 'px-3.5 py-1.5 rounded-xl font-bold transition-all text-zinc-400 hover:text-white';
    } else {
      btnIn.className = 'px-3.5 py-1.5 rounded-xl font-bold transition-all bg-amber-500 text-black';
      btnAll.className = 'px-3.5 py-1.5 rounded-xl font-bold transition-all text-zinc-400 hover:text-white';
    }
  }
  renderProducts();
}

function handleSortChange(val) {
  sortOrder = val;
  renderProducts();
}

function clearSearchAndFilters() {
  currentCategory = 'all';
  searchQuery = '';
  stockFilter = 'all';
  sortOrder = 'default';
  
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'default';

  setStockFilter('all');
  renderCategoryTabs();
  renderProducts();
}

function scrollToCatalog() {
  const el = document.getElementById('catalog-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  const emptyState = document.getElementById('empty-state');
  if (!grid || !emptyState) return;

  let filtered = PRODUCTS.filter(p => {
    const matchCat = currentCategory === 'all' || p.category === currentCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStock = stockFilter === 'all' || (stockFilter === 'instock' && Number(p.stock) > 0);
    return matchCat && matchSearch && matchStock;
  });

  if (sortOrder === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  else if (sortOrder === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  else if (sortOrder === 'stock-desc') filtered.sort((a, b) => b.stock - a.stock);

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    emptyState.classList.add('flex');
    return;
  }

  emptyState.classList.add('hidden');
  emptyState.classList.remove('flex');

  grid.innerHTML = filtered.map(product => {
    const isOutOfStock = Number(product.stock) === 0;
    const borderClass = isOutOfStock 
      ? 'border-red-950/30 opacity-70' 
      : 'border-white/10 hover:border-amber-500/60 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]';

    return `
      <div class="group relative rounded-3xl overflow-hidden bg-zinc-950 border flex flex-col h-full transition-all duration-300 ${borderClass}">
        <div onclick="openDetailModal('${product.id}')" class="relative aspect-[16/10] overflow-hidden bg-zinc-900 cursor-pointer">
          <img 
            src="${product.image}" 
            alt="${product.name}" 
            class="w-full h-full object-cover transition-transform duration-700 ${!isOutOfStock ? 'group-hover:scale-105' : 'grayscale'}"
            onerror="this.src='https://placehold.co/800x500/18181b/f59e0b?text=Arena+Breakout'"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10"></div>
          
          <div class="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
            ${isOutOfStock ? `
              <span class="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                สินค้าหมด
              </span>
            ` : `
              <span class="bg-emerald-500/90 text-black text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span class="w-1.5 h-1.5 bg-black rounded-full animate-ping"></span>
                คงเหลือ ${product.stock}
              </span>
            `}
            ${product.tags.map(t => `
              <span class="bg-black/70 backdrop-blur-md text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                ${t}
              </span>
            `).join('')}
          </div>
        </div>

        <div class="p-5 flex flex-col flex-grow z-20">
          <h3 onclick="openDetailModal('${product.id}')" class="text-base font-bold text-white mb-1.5 line-clamp-1 group-hover:text-amber-400 transition-colors cursor-pointer">
            ${product.name}
          </h3>
          
          <p class="text-zinc-500 text-xs line-clamp-2 mb-4 leading-relaxed">
            ${product.desc}
          </p>

          <div class="mb-4">
            <div class="inline-flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-xl border border-white/5">
              <span class="text-[10px] uppercase font-bold text-zinc-500">มูลค่า Koen</span>
              <span class="font-heading text-xs text-amber-500 font-bold">${product.koen}</span>
            </div>
          </div>

          <div class="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
            <div class="flex flex-col">
              <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">ราคา</span>
              <span class="text-lg font-heading font-black text-white">
                ฿${Number(product.price).toFixed(2)}
              </span>
            </div>
            
            <div class="flex items-center gap-2">
              <button onclick="openDetailModal('${product.id}')" class="text-xs text-zinc-400 hover:text-white px-2.5 py-2 rounded-xl hover:bg-zinc-900 transition-colors">
                รายละเอียด
              </button>
              <button 
                onclick="startCheckout('${product.id}')" 
                ${isOutOfStock ? 'disabled' : ''} 
                class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  isOutOfStock 
                  ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed' 
                  : 'bg-amber-500 text-black hover:bg-white hover:scale-105 active:scale-95 shadow-md'
                }">
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                <span>ซื้อทันที</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openDetailModal(productId) {
  const p = PRODUCTS.find(item => item.id === productId);
  if (!p) return;

  currentModalGallery = Array.isArray(p.gallery) && p.gallery.length > 0 ? p.gallery : [p.image];
  currentGalleryIdx = 0;

  document.getElementById('modal-img').src = currentModalGallery[0];
  document.getElementById('modal-title').innerText = p.name;
  document.getElementById('modal-koen').innerText = `Koen Value: ${p.koen}`;
  document.getElementById('modal-desc').innerText = p.desc;
  document.getElementById('modal-price').innerText = `฿${Number(p.price).toFixed(2)}`;

  const stockBadge = document.getElementById('modal-stock-badge');
  if (Number(p.stock) === 0) {
    stockBadge.innerText = 'สินค้าหมด';
    stockBadge.className = 'inline-block bg-red-500/10 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/20';
  } else {
    stockBadge.innerText = `พร้อมส่ง (เหลือ ${p.stock})`;
    stockBadge.className = 'inline-block bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20';
  }

  renderGalleryThumbnails();

  const specsContainer = document.getElementById('modal-specs');
  if (specsContainer) {
    specsContainer.innerHTML = p.specs.map(item => `
      <div class="flex items-center gap-2">
        <span class="text-amber-500 font-bold">✓</span>
        <span>${item}</span>
      </div>
    `).join('');
  }

  const buyBtn = document.getElementById('modal-buy-btn');
  if (Number(p.stock) === 0) {
    buyBtn.innerText = 'สินค้าหมด';
    buyBtn.disabled = true;
    buyBtn.className = 'px-6 py-3 rounded-full font-bold text-xs uppercase bg-zinc-800 text-zinc-600 cursor-not-allowed';
  } else {
    buyBtn.innerText = 'สั่งซื้อทันที';
    buyBtn.disabled = false;
    buyBtn.className = 'px-6 py-3 rounded-full font-bold text-xs uppercase bg-amber-500 hover:bg-white text-black shadow-lg hover:scale-105 active:scale-95 font-heading';
    buyBtn.onclick = () => {
      closeDetailModal();
      startCheckout(p.id);
    };
  }

  const modal = document.getElementById('product-detail-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function renderGalleryThumbnails() {
  const strip = document.getElementById('modal-gallery-strip');
  const counter = document.getElementById('modal-img-counter');
  if (!strip) return;

  if (currentModalGallery.length <= 1) {
    strip.innerHTML = '';
    strip.classList.add('hidden');
    if (counter) counter.innerText = 'ภาพ 1 / 1';
    return;
  }

  strip.classList.remove('hidden');
  if (counter) counter.innerText = `ภาพ ${currentGalleryIdx + 1} / ${currentModalGallery.length}`;

  strip.innerHTML = currentModalGallery.map((imgUrl, idx) => `
    <button type="button" onclick="switchGalleryImage(${idx})" class="w-16 h-12 rounded-xl overflow-hidden bg-zinc-900 border-2 border-white/10 shrink-0 gallery-thumb ${idx === currentGalleryIdx ? 'active' : ''}">
      <img src="${imgUrl}" alt="Thumb" class="w-full h-full object-cover">
    </button>
  `).join('');
}

function switchGalleryImage(idx) {
  if (idx < 0 || idx >= currentModalGallery.length) return;
  currentGalleryIdx = idx;
  const modalImg = document.getElementById('modal-img');
  if (modalImg) modalImg.src = currentModalGallery[idx];
  renderGalleryThumbnails();
}

function closeDetailModal() {
  const modal = document.getElementById('product-detail-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// Checkout & Promo Logic
function startCheckout(productId) {
  selectedProduct = PRODUCTS.find(p => p.id === productId);
  if (!selectedProduct || Number(selectedProduct.stock) === 0) return;

  discountAmount = 0;
  document.getElementById('promo-input').value = '';
  document.getElementById('discount-row').classList.add('hidden');
  document.getElementById('discount-row').classList.remove('flex');

  document.getElementById('checkout-product-img').src = selectedProduct.image;
  document.getElementById('checkout-product-name').innerText = selectedProduct.name;
  document.getElementById('checkout-product-koen').innerText = `Koen: ${selectedProduct.koen}`;
  document.getElementById('checkout-product-desc').innerText = selectedProduct.desc;
  document.getElementById('checkout-base-price').innerText = `฿${Number(selectedProduct.price).toFixed(2)}`;
  
  updateCheckoutTotal();
  switchPaymentTab('promptpay');
  startTimer();
  navigateTo('checkout');
}

function updateCheckoutTotal() {
  if (!selectedProduct) return;
  const finalPrice = Math.max(0, selectedProduct.price - discountAmount);
  
  document.getElementById('checkout-final-price').innerText = `฿${finalPrice.toFixed(2)}`;
  document.getElementById('qr-amount-label').innerText = `฿${finalPrice.toFixed(2)}`;
  document.getElementById('promptpay-sum-label').innerText = `฿${finalPrice.toFixed(2)}`;
  document.getElementById('voucher-exact-amount').innerText = `฿${finalPrice.toFixed(2)}`;
  document.getElementById('nav-cart-text').innerText = `฿${finalPrice.toFixed(2)}`;
}

function applyPromoCode() {
  const now = Date.now();
  if (now < promoLockoutExpiry) {
    const secLeft = Math.ceil((promoLockoutExpiry - now) / 1000);
    triggerToast(`โปรดรอ ${secLeft} วินาที ก่อนลองใส่โค้ดส่วนลดอีกครั้ง (Rate Limit)`);
    return;
  }

  const input = document.getElementById('promo-input');
  const code = input.value.trim().toUpperCase();
  if (!selectedProduct) return;

  if (code === 'TACTICAL') {
    discountAmount = 50;
    triggerToast('ใช้โค้ด TACTICAL สำเร็จ! ลดทันที 50 บาท');
    promoFailedAttempts = 0;
  } else if (code === 'ARENA10') {
    discountAmount = Math.round(selectedProduct.price * 0.1);
    triggerToast(`ใช้โค้ด ARENA10 สำเร็จ! ลด 10% (฿${discountAmount})`);
    promoFailedAttempts = 0;
  } else if (code === 'MOSZXLL') {
    discountAmount = 100;
    triggerToast('ใช้โค้ด MOSZXLL สำเร็จ! ลดทันที 100 บาท');
    promoFailedAttempts = 0;
  } else {
    promoFailedAttempts++;
    if (promoFailedAttempts >= 5) {
      promoLockoutExpiry = Date.now() + 60000;
      triggerToast('กรอกโค้ดผิดเกิน 5 ครั้ง ระบบล็อกการใช้งานโค้ด 60 วินาที');
      document.getElementById('promo-rate-warning').classList.remove('hidden');
      setTimeout(() => {
        document.getElementById('promo-rate-warning').classList.add('hidden');
        promoFailedAttempts = 0;
      }, 60000);
    } else {
      triggerToast(`โค้ดไม่ถูกต้อง (เหลือโอกาสลองอีก ${5 - promoFailedAttempts} ครั้ง)`);
    }
    return;
  }

  document.getElementById('discount-row').classList.remove('hidden');
  document.getElementById('discount-row').classList.add('flex');
  document.getElementById('checkout-discount').innerText = `-฿${discountAmount.toFixed(2)}`;
  updateCheckoutTotal();
}

function switchPaymentTab(tab) {
  currentPaymentMethod = tab;
  const pTab = document.getElementById('payment-promptpay-panel');
  const vTab = document.getElementById('payment-truemoney-panel');
  const btnP = document.getElementById('btn-tab-promptpay');
  const btnV = document.getElementById('btn-tab-truemoney');

  if (!pTab || !vTab || !btnP || !btnV) return;

  if (tab === 'promptpay') {
    pTab.classList.remove('hidden');
    pTab.classList.add('flex');
    vTab.classList.add('hidden');
    vTab.classList.remove('flex');
    btnP.className = 'flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all bg-amber-500 text-black shadow-md';
    btnV.className = 'flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all text-zinc-400 hover:text-white';
  } else {
    vTab.classList.remove('hidden');
    vTab.classList.add('flex');
    pTab.classList.add('hidden');
    pTab.classList.remove('flex');
    btnV.className = 'flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all bg-amber-500 text-black shadow-md';
    btnP.className = 'flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all text-zinc-400 hover:text-white';
  }
}

function startTimer() {
  stopTimer();
  timerCountdown = 600;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timerCountdown--;
    if (timerCountdown <= 0) {
      stopTimer();
      navigateTo('store');
      triggerToast('หมดเวลาชำระเงิน ระบบได้คืนสต็อกสินค้าแล้ว');
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
}

function updateTimerDisplay() {
  const m = Math.floor(timerCountdown / 60);
  const s = timerCountdown % 60;
  const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  const el = document.getElementById('checkout-timer');
  if (el) el.innerText = formatted;
}

async function simulateOrderSuccess() {
  const btn = document.getElementById('btn-verify-promptpay');
  if (btn) {
    btn.innerText = 'กำลังตรวจสอบสลิปและจัดส่งไอดี...';
    btn.disabled = true;
  }

  const orderNum = Math.floor(100000 + Math.random() * 900000);
  const orderId = `ORD-AB${orderNum}`;
  const finalPrice = selectedProduct ? Math.max(0, selectedProduct.price - discountAmount) : 0;
  
  currentDeliveredUsername = `ArenaAgent${Math.floor(1000 + Math.random() * 9000)}`;
  currentDeliveredPassword = `Kamona#${Math.floor(100000 + Math.random() * 900000)}`;

  const orderRecord = {
    orderNumber: orderId,
    productId: selectedProduct ? selectedProduct.id : 'unknown',
    productName: selectedProduct ? selectedProduct.name : 'Unknown Product',
    amount: finalPrice,
    discount: discountAmount,
    paymentMethod: currentPaymentMethod,
    status: 'completed',
    userEmail: currentUser ? currentUser.email : 'guest',
    userId: currentUser ? currentUser.uid : null,
    accountDelivered: {
      username: currentDeliveredUsername,
      password: currentDeliveredPassword
    },
    createdAt: new Date().toISOString()
  };

  saveOrderToLocal(orderRecord);

  try {
    await addDoc(collection(db, "orders"), {
      ...orderRecord,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("Save order to Firestore error:", err);
  }

  setTimeout(() => {
    if (btn) {
      btn.innerText = 'ยืนยันการโอนเงิน (ตรวจสลิปอัตโนมัติ)';
      btn.disabled = false;
    }
    
    document.getElementById('success-product-name').innerText = selectedProduct ? selectedProduct.name : '';
    document.getElementById('success-order-id').innerText = `ORDER ID: #${orderId}`;
    isPasswordRevealed = false;
    document.getElementById('acc-username').innerText = currentDeliveredUsername;
    document.getElementById('acc-password').innerText = '••••••••••••••••';
    document.getElementById('pw-toggle-label').innerText = 'แสดงรหัส';
    
    navigateTo('success');
    triggerToast('ชำระเงินสำเร็จ บันทึกประวัติใน "ออเดอร์ของฉัน" เรียบร้อย');
    updateMyOrdersBadge();
  }, 1400);
}

function simulateVoucherPayment() {
  const url = document.getElementById('voucher-url-input').value.trim();
  if (!url.includes('truemoney.com') && url.length < 15) {
    triggerToast('กรุณากรอกลิงก์ซองของขวัญ TrueMoney ให้ถูกต้อง');
    return;
  }

  triggerToast('กำลังตรวจสอบยอดเงินในซองของขวัญ...');
  setTimeout(() => {
    document.getElementById('voucher-url-input').value = '';
    simulateOrderSuccess();
  }, 1200);
}

function togglePasswordVisibility() {
  isPasswordRevealed = !isPasswordRevealed;
  const pwText = document.getElementById('acc-password');
  const toggleLabel = document.getElementById('pw-toggle-label');
  
  if (isPasswordRevealed) {
    pwText.innerText = currentDeliveredPassword;
    toggleLabel.innerText = 'ซ่อนรหัส';
  } else {
    pwText.innerText = '••••••••••••••••';
    toggleLabel.innerText = 'แสดงรหัส';
  }
}

function copyCredentials() {
  const textToCopy = `User: ${currentDeliveredUsername}\nPass: ${currentDeliveredPassword}`;
  try {
    navigator.clipboard.writeText(textToCopy);
  } catch (err) {
    console.warn("Copy error:", err);
  }

  const copyLabel = document.getElementById('copy-btn-text');
  if (copyLabel) {
    copyLabel.innerText = 'คัดลอกข้อมูลเรียบร้อยแล้ว!';
    triggerToast('คัดลอก Username & Password เรียบร้อยแล้ว!');
    setTimeout(() => {
      copyLabel.innerText = 'คัดลอก Username & Password ทั้งหมด';
    }, 2500);
  }
}

function getLocalOrders() {
  try {
    const raw = localStorage.getItem('tactical_my_orders');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOrderToLocal(order) {
  try {
    const list = getLocalOrders();
    list.unshift(order);
    localStorage.setItem('tactical_my_orders', JSON.stringify(list));
  } catch (err) {
    console.warn("Local storage error:", err);
  }
}

function updateMyOrdersBadge() {
  const list = getLocalOrders();
  const badge = document.getElementById('nav-order-badge');
  if (badge) {
    if (list.length > 0) {
      badge.innerText = list.length;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

function openMyOrdersModal() {
  const modal = document.getElementById('my-orders-modal');
  const container = document.getElementById('my-orders-list');
  const empty = document.getElementById('my-orders-empty');
  if (!modal || !container) return;

  const orders = getLocalOrders();

  if (orders.length === 0) {
    container.innerHTML = '';
    empty.classList.remove('hidden');
    empty.classList.add('flex');
  } else {
    empty.classList.add('hidden');
    empty.classList.remove('flex');
    container.innerHTML = orders.map((o, idx) => {
      const acc = o.accountDelivered || {};
      const timeStr = new Date(o.createdAt).toLocaleString('th-TH');

      return `
        <div class="glass-card p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3">
          <div class="flex justify-between items-start gap-2 border-b border-white/5 pb-2.5">
            <div>
              <span class="text-[10px] font-mono text-amber-500 font-bold">#${o.orderNumber}</span>
              <h4 class="font-bold text-white text-sm">${o.productName}</h4>
              <span class="text-[10px] text-zinc-500">${timeStr}</span>
            </div>
            <div class="text-right">
              <span class="text-sm font-heading font-black text-amber-400">฿${Number(o.amount).toFixed(2)}</span>
              <span class="block text-[10px] text-emerald-400 font-bold">✓ จัดส่งสำเร็จ</span>
            </div>
          </div>

          <div class="bg-black/50 p-3 rounded-xl border border-white/5 font-mono text-xs space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-zinc-500 text-[10px]">USERNAME:</span>
              <span class="text-amber-400 font-bold select-all">${acc.username || 'ArenaAgent'}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-zinc-500 text-[10px]">PASSWORD:</span>
              <span id="order-pw-${idx}" class="text-zinc-300 font-bold select-all">••••••••••••</span>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-1">
            <button onclick="toggleOrderPassword('${idx}', '${acc.password || ''}')" class="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] font-bold text-zinc-300">
              <span id="order-btn-lbl-${idx}">แสดงรหัส</span>
            </button>
            <button onclick="copySpecificCredentials('${acc.username}', '${acc.password}')" class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[11px] font-bold text-black font-heading">
              คัดลอกไอดี
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeMyOrdersModal() {
  const modal = document.getElementById('my-orders-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function toggleOrderPassword(idx, realPw) {
  const el = document.getElementById(`order-pw-${idx}`);
  const lbl = document.getElementById(`order-btn-lbl-${idx}`);
  if (!el || !lbl) return;

  if (el.innerText.includes('•')) {
    el.innerText = realPw || 'KamonaStrike#2026';
    lbl.innerText = 'ซ่อนรหัส';
  } else {
    el.innerText = '••••••••••••';
    lbl.innerText = 'แสดงรหัส';
  }
}

function copySpecificCredentials(u, p) {
  const text = `User: ${u}\nPass: ${p}`;
  if (navigator.clipboard) navigator.clipboard.writeText(text);
  triggerToast('คัดลอกข้อมูลไอดีนี้เรียบร้อยแล้ว!');
}

function navigateTo(viewName) {
  const storeView = document.getElementById('view-store');
  const checkoutView = document.getElementById('view-checkout');
  const successView = document.getElementById('view-success');

  if (storeView) storeView.classList.add('hidden');
  if (checkoutView) checkoutView.classList.add('hidden');
  if (successView) successView.classList.add('hidden');

  if (viewName === 'store' && storeView) {
    storeView.classList.remove('hidden');
    stopTimer();
  } else if (viewName === 'checkout' && checkoutView) {
    checkoutView.classList.remove('hidden');
  } else if (viewName === 'success' && successView) {
    successView.classList.remove('hidden');
    stopTimer();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// 9. WINDOW ATTACHMENTS & INITIALIZER
// ==========================================
// Storefront methods
window.navigateTo = navigateTo;
window.filterCategory = filterCategory;
window.handleSearch = handleSearch;
window.setStockFilter = setStockFilter;
window.handleSortChange = handleSortChange;
window.clearSearchAndFilters = clearSearchAndFilters;
window.scrollToCatalog = scrollToCatalog;
window.openDetailModal = openDetailModal;
window.closeDetailModal = closeDetailModal;
window.switchGalleryImage = switchGalleryImage;
window.startCheckout = startCheckout;
window.applyPromoCode = applyPromoCode;
window.switchPaymentTab = switchPaymentTab;
window.simulateOrderSuccess = simulateOrderSuccess;
window.simulateVoucherPayment = simulateVoucherPayment;
window.togglePasswordVisibility = togglePasswordVisibility;
window.copyCredentials = copyCredentials;
window.handleSignOut = handleSignOut;
window.openMyOrdersModal = openMyOrdersModal;
window.closeMyOrdersModal = closeMyOrdersModal;
window.toggleOrderPassword = toggleOrderPassword;
window.copySpecificCredentials = copySpecificCredentials;

// Admin methods
window.handlePinSetupSubmit = handlePinSetupSubmit;
window.handlePinUnlockSubmit = handlePinUnlockSubmit;
window.promptResetPin = promptResetPin;
window.lockAdminSession = lockAdminSession;
window.openStockModal = openStockModal;
window.closeStockModal = closeStockModal;
window.handleStockTextareaInput = handleStockTextareaInput;
window.submitBulkStockImport = submitBulkStockImport;
window.deleteSingleStockItem = deleteSingleStockItem;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.handleProductFormSubmit = handleProductFormSubmit;
window.deleteAdminProduct = deleteAdminProduct;
window.seedInitialProducts = seedInitialProducts;
window.setImagePreset = setImagePreset;
window.updateImagePreview = updateImagePreview;
window.openStockModalQuick = openStockModalQuick;
window.refreshOrders = refreshOrders;
window.handleSaveSettings = handleSaveSettings;
window.switchAdminTab = switchAdminTab;

window.addEventListener('DOMContentLoaded', () => {
  // สตรีมสินค้าสดจาก Firebase
  initFirebaseProductsListener();

  // ตรวจสอบว่ากำลังเปิดหน้า Admin หรือ Storefront
  if (document.getElementById('admin-auth-gate')) {
    checkSecurityPinState();
  } else {
    initAuthListener();
    renderCategoryTabs();
    renderProducts();
    updateMyOrdersBadge();
  }
});
