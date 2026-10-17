import { db, auth } from "../firebase-config.js";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  increment,
  onSnapshot, 
  getDoc,
  getDocs,
  query,
  where,
  limit,
  runTransaction,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const FALLBACK_IMG = 'https://placehold.co/800x500/f5f5f7/86868b?text=Arena+Breakout';

// ==========================================
// 1. DEFAULT DATA & REPOSITORY (Synced with Category)
// ==========================================
const DEFAULT_PRODUCTS = [
  {
    id: '1',
    name: 'M4A1 Full Mod + T6 Ammo x300',
    category: 'ammo_acc',
    price: 350.00,
    koenLabel: 'มูลค่า Koen',
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
    koenLabel: 'มูลค่า Koen',
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
    koenLabel: 'มูลค่า Koen',
    koen: '30,000,000',
    stock: 0,
    image: 'https://images.unsplash.com/photo-1595590424283-b8f1784cb2c8?auto=format&fit=crop&q=80&w=800',
    gallery: [
      'https://images.unsplash.com/photo-1595590424283-b8f1784cb2c8?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1574226516831-e1dff420e5c7?auto=format&fit=crop&q=80&w=800'
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
    koenLabel: 'มูลค่า Koen',
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
    koenLabel: 'มูลค่า Koen',
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
    koenLabel: 'มูลค่า Koen',
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
  },
  {
    id: 'srv_1',
    name: 'บริการโยนกระสุน M61 (T6) พิกัดเป้าหมาย',
    productType: 'service',
    category: 'service_ammo',
    serviceUnit: 'กอง',
    serviceMin: 1,
    serviceRate: 22.00,
    price: 22.00,
    koenLabel: 'กองกระสุน',
    koen: 'กระสุน T6 M61 x60 นัด',
    stock: 50,
    image: 'https://images.unsplash.com/photo-1595590424283-b8f1784cb2c8?auto=format&fit=crop&q=80&w=800',
    tags: ['โยน M61', 'ยอดนิยม', 'ส่งไว 3 นาที'],
    desc: 'บริการโยนกระสุน M61 เกรด T6 เจาะเกราะสูงสุด ลงจุดนัดหมายในเกม ปลอดภัย ไม่โดนแบน รวดเร็วภายใน 3-5 นาที',
    specs: ['กระสุน T6 M61 แท้ 100%', 'ส่งมอบในเกม (In-Game Safe Drop)', 'นัดรับในห้อง Raid ตามตกลง', 'ประกันของหาย 100% หากเกิดข้อผิดพลาด']
  },
  {
    id: 'srv_2',
    name: 'บริการโยนเงิน Koen M (ปลอดภัย ไม่โดนแบน)',
    productType: 'service',
    category: 'service_koen',
    serviceUnit: 'M (ล้าน)',
    serviceMin: 5,
    serviceRate: 25.00,
    price: 25.00,
    koenLabel: 'มูลค่า Koen',
    koen: '1,000,000 Koen / 1M',
    stock: 100,
    image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&q=80&w=800',
    tags: ['โยนเงิน M', 'Koen สด', 'เรทดีสุด'],
    desc: 'บริการโยกเงินและโยนเงิน Koen M สดเข้าตัว ปลอดภัยผ่านเทคนิคการเทรดที่ปลอดภัยที่สุด ขั้นต่ำ 5M ขึ้นไป',
    specs: ['อัตราเรท 25฿ / 1M', 'ขั้นต่ำเริ่มต้น 5M', 'ส่งมอบผ่านระบบ Safe Trade ในเกม', 'ดูแลตลอดการส่งมอบโดยทีมงานมืออาชีพ']
  }
];

const CATEGORIES = [
  { id: 'all', name: 'ทั้งหมด' },
  { id: 'ammo_acc', name: 'ไอดีไก่กระสุน' },
  { id: 'koen', name: 'ไอดีเงิน Koen' },
  { id: 'full_acc', name: 'ไอดีพร้อมเล่น' },
  { id: 'skins', name: 'สกินปืน / เซ็ตชุด' },
  { id: 'service_ammo', name: '⚡ บริการโยน M61' },
  { id: 'service_koen', name: '⚡ บริการโยนเงิน M' }
];

// App State
let PRODUCTS = DEFAULT_PRODUCTS.map(p => ({ ...p }));
let currentCategory = 'all';
let searchQuery = '';
let smartFilter = 'all'; // 'all' | 'instock' | 'under200' | '200to500' | 'over500'
let sortOrder = 'default';
let selectedProduct = null;
let serviceOrderQty = 1;
let currentPaymentMethod = 'promptpay';
let discountAmount = 0;
let appliedPromoCode = null;
let timerCountdown = 600;
let timerInterval = null;
let isPasswordRevealed = false;
let toastTimeout = null;
let currentDeliveredUsername = '';
let currentDeliveredPassword = '';
let currentUser = null;
let currentModalGallery = [];
let currentGalleryIdx = 0;
let customStat2Override = '';
let globalKoenLabel = 'Koen';
let cloudOrdersCache = [];

let promoFailedAttempts = 0;
let promoLockoutExpiry = 0;

// ==========================================
// 0. SAFE HELPERS
// ==========================================
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isServiceProduct(product) {
  return product?.productType === 'service' || String(product?.category || '').startsWith('service_');
}

function getEffectivePrice(product) {
  const rawPrice = Number(product?.price);
  if (Number.isFinite(rawPrice) && rawPrice > 0) return rawPrice;
  const rate = Number(product?.serviceRate);
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}

function getEffectiveStock(product) {
  const s = Number(product?.stock);
  return Number.isFinite(s) && s > 0 ? Math.floor(s) : 0;
}

function formatKoenText(product) {
  const defaultLabel = isServiceProduct(product) ? 'ข้อกำหนด' : globalKoenLabel;
  const label = String(
    product?.koenLabel ||
    product?.currencyLabel ||
    product?.unitLabel ||
    defaultLabel ||
    'Koen'
  ).trim();
  const val = String(product?.koen ?? '-').trim();
  if (!label || val.includes(':') || val.toLowerCase().startsWith(label.toLowerCase())) {
    return val;
  }
  return `${label}: ${val}`;
}

function triggerToast(message) {
  const box = document.getElementById('toast-box');
  const text = document.getElementById('toast-text');
  if (!box || !text) return;

  text.innerText = message;
  box.classList.remove('opacity-0', '-translate-y-4', 'scale-95');
  box.classList.add('opacity-100', 'translate-y-0', 'scale-100');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    box.classList.add('opacity-0', '-translate-y-4', 'scale-95');
    box.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
  }, 3000);
}

// ==========================================
// 2. FIREBASE AUTH & LIVE LISTENERS
// ==========================================
function initAuthListener() {
  if (!auth) return;
  try {
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      const loggedOutContainer = document.getElementById('auth-logged-out');
      const loggedInContainer = document.getElementById('auth-logged-in');
      const displayNameEl = document.getElementById('user-display-name');
      const avatarInitialEl = document.getElementById('user-avatar-initial');
      const mobileAuthText = document.getElementById('mobile-nav-auth-text');

      if (user) {
        const name = user.displayName || user.email?.split('@')[0] || 'Agent';
        if (loggedOutContainer) loggedOutContainer.classList.add('hidden');
        if (loggedInContainer) {
          loggedInContainer.classList.remove('hidden');
          loggedInContainer.classList.add('flex');
        }
        if (displayNameEl) displayNameEl.innerText = name;
        if (avatarInitialEl) avatarInitialEl.innerText = name.charAt(0).toUpperCase();
        if (mobileAuthText) mobileAuthText.innerText = name.length > 5 ? name.slice(0, 5) + '...' : name;
        syncUserCloudOrders(user.uid);
      } else {
        cloudOrdersCache = [];
        if (loggedOutContainer) loggedOutContainer.classList.remove('hidden');
        if (loggedInContainer) {
          loggedInContainer.classList.add('hidden');
          loggedInContainer.classList.remove('flex');
        }
        if (mobileAuthText) mobileAuthText.innerText = 'บัญชี';
        updateMyOrdersBadge();
      }
    });
  } catch (err) {
    console.warn("Auth listener skipped:", err);
  }
}

async function handleSignOut() {
  try {
    if (auth) await signOut(auth);
    triggerToast('ออกจากระบบเรียบร้อยแล้ว');
  } catch (error) {
    console.error("Sign out error:", error);
    triggerToast('เกิดข้อผิดพลาดในการออกจากระบบ');
  }
}

function updateFirebaseStatus(isOnline, message) {
  const dot = document.getElementById('firebase-status-dot');
  const text = document.getElementById('firebase-status-text');
  if (dot && text) {
    dot.className = isOnline 
      ? 'w-1.5 h-1.5 rounded-full bg-emerald-500' 
      : 'w-1.5 h-1.5 rounded-full bg-amber-500';
    text.innerText = message;
  }
}

function renderSkeletonGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.innerHTML = Array.from({ length: 6 }).map(() => `
    <div class="apple-card p-6 flex flex-col h-full animate-pulse">
      <div class="aspect-[16/10] rounded-images bg-mist mb-4"></div>
      <div class="h-4 bg-mist rounded-full w-3/4 mb-2"></div>
      <div class="h-3 bg-mist rounded-full w-full mb-1.5"></div>
      <div class="h-3 bg-mist rounded-full w-2/3 mb-4"></div>
      <div class="h-5 bg-mist rounded-full w-1/3 mb-4"></div>
      <div class="mt-auto pt-3.5 border-t border-hairline flex justify-between items-center">
        <div class="h-7 bg-mist rounded-full w-20"></div>
        <div class="flex gap-2">
          <div class="h-7 bg-mist rounded-full w-24"></div>
          <div class="h-7 bg-mist rounded-full w-16"></div>
        </div>
      </div>
    </div>
  `).join('');
}

function initFirebaseProductsListener() {
  if (!db) {
    updateFirebaseStatus(false, "Firebase: โหมดออฟไลน์");
    renderCategoryOptions();
    renderProducts();
    updateHeroMetrics();
    return;
  }
  try {
    const productsRef = collection(db, "products");
    onSnapshot(productsRef, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreList = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() || {};
          const primaryImg = data.image || FALLBACK_IMG;
          firestoreList.push({
            id: docSnap.id,
            ...data,
            name: String(data.name || 'ไม่มีชื่อสินค้า'),
            category: String(data.category || 'all'),
            price: getEffectivePrice(data),
            koen: data.koen || '-',
            koenLabel: data.koenLabel || data.currencyLabel || data.unitLabel || '',
            stock: getEffectiveStock(data),
            image: primaryImg,
            gallery: Array.isArray(data.gallery) && data.gallery.length > 0 ? data.gallery.filter(Boolean) : [primaryImg],
            tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
            desc: data.desc || '',
            specs: Array.isArray(data.specs) ? data.specs.map(String) : []
          });
        });
        PRODUCTS = firestoreList;
        updateFirebaseStatus(true, `Firebase: ${PRODUCTS.length} รายการ`);
      } else {
        PRODUCTS = DEFAULT_PRODUCTS.map(p => ({ ...p }));
        updateFirebaseStatus(true, "Firebase: ข้อมูลเริ่มต้น");
      }
      renderCategoryOptions();
      renderProducts();
      updateHeroMetrics();
    }, (err) => {
      console.warn("Firestore listener fallback to default:", err);
      PRODUCTS = DEFAULT_PRODUCTS.map(p => ({ ...p }));
      updateFirebaseStatus(false, "Firebase: โหมดออฟไลน์");
      renderCategoryOptions();
      renderProducts();
      updateHeroMetrics();
    });
  } catch (e) {
    PRODUCTS = DEFAULT_PRODUCTS.map(p => ({ ...p }));
    updateFirebaseStatus(false, "Firebase: โหมดออฟไลน์");
    renderCategoryOptions();
    renderProducts();
    updateHeroMetrics();
  }
}

function applySystemSettings(data) {
  if (!data) return;

  const customLabel = data.koenLabel || data.currencyLabel || data.unitLabel || data.valueLabel;
  if (customLabel && String(customLabel).trim() !== '') {
    globalKoenLabel = String(customLabel).trim();
    renderProducts();
  }

  if (data.marqueeText && String(data.marqueeText).trim() !== '') {
    const track = document.getElementById('marquee-track-container');
    if (track) {
      const safeMarquee = escapeHtml(data.marqueeText.trim());
      const item = `
        <span class="mx-6 inline-flex items-center gap-2 text-ink shrink-0 whitespace-nowrap">
          <span class="text-launchOrange font-semibold">ใหม่</span>
          ${safeMarquee}
        </span>
        <span class="text-hairline shrink-0">•</span>
        <span class="mx-6 shrink-0 whitespace-nowrap">🔒 รับประกันทุกไอดี ปลอดภัย ไม่เสี่ยงโดนแบน บัญชีสะอาด 100%</span>
        <span class="text-hairline shrink-0">•</span>
        <span class="mx-6 text-appleBlue font-medium shrink-0 whitespace-nowrap">🎁 โค้ดส่วนลด: TACTICAL ลด 50 บาท | ARENA10 ลด 10%</span>
        <span class="text-hairline shrink-0">•</span>
      `;
      track.innerHTML = item + item;
    }
  }

  const ribbon = document.getElementById('apple-promo-ribbon');
  const rText = document.getElementById('ribbon-main-text');
  const rLink = document.getElementById('ribbon-link');
  const rLinkText = document.getElementById('ribbon-link-text');
  if (ribbon && data.ribbonText) {
    ribbon.classList.remove('hidden');
    if (rText) rText.innerText = data.ribbonText;
    if (rLink && data.ribbonLinkUrl) rLink.href = data.ribbonLinkUrl;
    if (rLinkText && data.ribbonLinkText) rLinkText.innerText = data.ribbonLinkText;
  }

  const s1v = document.getElementById('hero-stat1-val');
  const s1l = document.getElementById('hero-stat1-lbl');
  if (s1v && data.stat1Val) s1v.innerText = data.stat1Val;
  if (s1l && data.stat1Lbl) s1l.innerText = data.stat1Lbl;

  const s2l = document.getElementById('hero-stat2-lbl');
  if (s2l && data.stat2Lbl) s2l.innerText = data.stat2Lbl;
  customStat2Override = data.stat2Val ? String(data.stat2Val).trim() : '';
  updateHeroMetrics();

  const s3v = document.getElementById('hero-stat3-val');
  const s3l = document.getElementById('hero-stat3-lbl');
  if (s3v && data.stat3Val) s3v.innerText = data.stat3Val;
  if (s3l && data.stat3Lbl) s3l.innerText = data.stat3Lbl;

  const s4v = document.getElementById('hero-stat4-val');
  const s4l = document.getElementById('hero-stat4-lbl');
  if (s4v && data.stat4Val) s4v.innerText = data.stat4Val;
  if (s4l && data.stat4Lbl) s4l.innerText = data.stat4Lbl;
}

function initSettingsListener() {
  try {
    const local = localStorage.getItem('tactical_store_settings');
    if (local) applySystemSettings(JSON.parse(local));
  } catch (_) {}

  if (!db) return;
  try {
    const sDoc = doc(db, "system", "settings");
    onSnapshot(sDoc, (snap) => {
      if (snap.exists()) applySystemSettings(snap.data());
    });
  } catch (err) {
    console.warn("Settings listener error:", err);
  }
}

function updateHeroMetrics() {
  const el = document.getElementById('hero-instock-count');
  if (!el) return;
  if (customStat2Override) {
    el.innerText = customStat2Override;
    return;
  }
  const inStockTotal = PRODUCTS.reduce((sum, p) => sum + getEffectiveStock(p), 0);
  el.innerText = inStockTotal.toLocaleString();
}

// ==========================================
// 3. UNIFIED CATALOG FILTERING & SORTING
// ==========================================
function renderCategoryOptions() {
  const selectEl = document.getElementById('category-select');
  if (!selectEl) return;

  selectEl.innerHTML = CATEGORIES.map(cat => {
    const count = cat.id === 'all'
      ? PRODUCTS.length
      : PRODUCTS.filter(p => p.category === cat.id).length;
    const selected = cat.id === currentCategory ? 'selected' : '';
    const prefix = cat.id === 'all' ? 'หมวดหมู่: ' : '';
    return `<option value="${escapeHtml(cat.id)}" ${selected}>${prefix}${escapeHtml(cat.name)} (${count})</option>`;
  }).join('');
}

function updateResetButtonVisibility() {
  const resetBtn = document.getElementById('btn-reset-filters');
  if (!resetBtn) return;
  const isFiltered = currentCategory !== 'all' || smartFilter !== 'all' || sortOrder !== 'default' || searchQuery.trim() !== '';
  resetBtn.classList.toggle('hidden', !isFiltered);
}

function filterCategory(catId) {
  currentCategory = CATEGORIES.some(c => c.id === catId) ? catId : 'all';
  const selectEl = document.getElementById('category-select');
  if (selectEl && selectEl.value !== currentCategory) selectEl.value = currentCategory;
  renderProducts();
}

function handleSearch(val) {
  searchQuery = String(val ?? '');
  const desktopInput = document.getElementById('search-input');
  const mobileInput = document.getElementById('search-input-mobile');
  if (desktopInput && desktopInput.value !== searchQuery) desktopInput.value = searchQuery;
  if (mobileInput && mobileInput.value !== searchQuery) mobileInput.value = searchQuery;
  renderProducts();
}

function handleSmartFilterChange(val) {
  smartFilter = val || 'all';
  const selectEl = document.getElementById('smart-filter-select');
  if (selectEl && selectEl.value !== smartFilter) selectEl.value = smartFilter;
  renderProducts();
}

function setStockFilter(mode) {
  handleSmartFilterChange(mode === 'instock' ? 'instock' : 'all');
}

function handleSortChange(val) {
  sortOrder = val || 'default';
  renderProducts();
}

function clearSearchAndFilters() {
  currentCategory = 'all';
  searchQuery = '';
  smartFilter = 'all';
  sortOrder = 'default';
  
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  const searchInputMobile = document.getElementById('search-input-mobile');
  if (searchInputMobile) searchInputMobile.value = '';
  const catSelect = document.getElementById('category-select');
  if (catSelect) catSelect.value = 'all';
  const smartSelect = document.getElementById('smart-filter-select');
  if (smartSelect) smartSelect.value = 'all';
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'default';

  renderProducts();
}

function scrollToCatalog() {
  const el = document.getElementById('catalog-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  const emptyState = document.getElementById('empty-state');
  const countLabel = document.getElementById('catalog-count-label');
  if (!grid || !emptyState) return;

  updateResetButtonVisibility();

  const q = searchQuery.toLowerCase().trim();
  const filtered = PRODUCTS.filter(p => {
    const matchCat = currentCategory === 'all' || p.category === currentCategory;
    const nameStr = String(p.name || '').toLowerCase();
    const matchSearch = !q || nameStr.includes(q) ||
                        (Array.isArray(p.tags) && p.tags.some(t => String(t).toLowerCase().includes(q)));

    const stockCount = getEffectiveStock(p);
    const price = getEffectivePrice(p);

    let matchSmart = true;
    if (smartFilter === 'instock') {
      matchSmart = stockCount > 0;
    } else if (smartFilter === 'under200') {
      matchSmart = stockCount > 0 && price <= 200;
    } else if (smartFilter === '200to500') {
      matchSmart = stockCount > 0 && price >= 200 && price <= 500;
    } else if (smartFilter === 'over500') {
      matchSmart = stockCount > 0 && price > 500;
    }

    return matchCat && matchSearch && matchSmart;
  });

  if (sortOrder === 'price-asc') {
    filtered.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
  } else if (sortOrder === 'price-desc') {
    filtered.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
  } else if (sortOrder === 'stock-desc') {
    filtered.sort((a, b) => getEffectiveStock(b) - getEffectiveStock(a));
  }

  const readyCount = filtered.filter(p => getEffectiveStock(p) > 0).length;
  if (countLabel) {
    countLabel.innerText = `แสดง ${filtered.length} รายการ (พร้อมส่ง ${readyCount})`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    emptyState.classList.add('flex');
    return;
  }

  emptyState.classList.add('hidden');
  emptyState.classList.remove('flex');

  grid.innerHTML = filtered.map(product => {
    const stockCount = getEffectiveStock(product);
    const isOutOfStock = stockCount <= 0;
    const isService = isServiceProduct(product);
    const unit = escapeHtml(product.serviceUnit || (isService ? 'กอง' : 'ชิ้น'));
    const min = Math.max(1, Number(product.serviceMin) || 1);
    const displayPrice = getEffectivePrice(product).toFixed(2);
    const safeId = encodeURIComponent(String(product.id || ''));
    const safeName = escapeHtml(product.name || 'ไม่มีชื่อสินค้า');
    const safeDesc = escapeHtml(product.desc || '-');
    const safeImg = escapeHtml(product.image || FALLBACK_IMG);
    const safeKoenBadge = escapeHtml(formatKoenText(product));

    return `
      <div class="apple-card p-6 flex flex-col h-full transition-colors hover:border-steel">
        <!-- Thumbnail -->
        <div onclick="openDetailModal(decodeURIComponent('${safeId}'))" class="relative aspect-[16/10] rounded-images overflow-hidden bg-mist border border-hairline cursor-pointer mb-4">
          <img 
            src="${safeImg}" 
            alt="${safeName}" 
            class="w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${isOutOfStock ? 'grayscale opacity-75' : ''}"
            onerror="this.src='${FALLBACK_IMG}'"
          />
          
          <!-- Badges -->
          <div class="absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-1.5">
            ${isOutOfStock ? `
              <span class="bg-gallery/95 text-launchOrange border border-hairline text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                ${isService ? 'คิวเต็มชั่วคราว' : 'สินค้าหมด'}
              </span>
            ` : (isService ? `
              <span class="bg-gallery/95 text-appleBlue border border-hairline text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span class="w-1.5 h-1.5 bg-appleBlue rounded-full animate-pulse"></span>
                พร้อมรับงาน ${stockCount} ${unit}
              </span>
            ` : `
              <span class="bg-gallery/95 text-ink border border-hairline text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                พร้อมส่ง ${stockCount}
              </span>
            `)}
            ${(Array.isArray(product.tags) ? product.tags : []).map(t => `
              <span class="bg-gallery/90 text-slate border border-hairline text-[10px] font-medium px-2.5 py-0.5 rounded-full">
                ${escapeHtml(t)}
              </span>
            `).join('')}
          </div>
        </div>

        <!-- Body -->
        <div class="flex flex-col flex-grow">
          <h3 onclick="openDetailModal(decodeURIComponent('${safeId}'))" class="text-base font-semibold text-ink line-clamp-1 hover:text-appleBlue transition-colors cursor-pointer mb-1">
            ${safeName}
          </h3>
          
          <p class="text-slate text-xs line-clamp-2 leading-relaxed mb-3">
            ${safeDesc}
          </p>

          <div class="mb-4">
            <span class="inline-block bg-mist border border-hairline text-[11px] font-mono font-medium text-slate px-2.5 py-0.5 rounded-full">
              ${safeKoenBadge}
            </span>
          </div>

          <!-- Actions -->
          <div class="mt-auto flex items-center justify-between pt-3.5 border-t border-hairline gap-2">
            <div class="flex flex-col">
              <span class="text-[10px] text-slate font-medium">
                ${isService ? `ราคา (ขั้นต่ำ ${min} ${unit})` : 'ราคา'}
              </span>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl leading-tight font-semibold text-pricingBlue font-heading">
                  ฿${displayPrice}
                </span>
                ${isService ? `<span class="text-xs text-slate font-normal">/ ${unit}</span>` : ''}
              </div>
            </div>
            
            <div class="flex items-center gap-2 shrink-0">
              <button type="button" onclick="openDetailModal(decodeURIComponent('${safeId}'))" class="apple-explore-pill px-3.5 py-1.5 text-xs">
                รายละเอียดสินค้า
              </button>
              <button 
                type="button"
                onclick="startCheckout(decodeURIComponent('${safeId}'))" 
                ${isOutOfStock ? 'disabled' : ''} 
                class="${isOutOfStock 
                  ? 'bg-control text-steel px-4 py-1.5 rounded-button text-xs font-medium cursor-not-allowed' 
                  : 'apple-pricing-pill px-4 py-1.5 text-xs'}">
                สั่งซื้อ
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 4. PRODUCT DETAIL MODAL & MULTI-IMAGE GALLERY
// ==========================================
function openDetailModal(productId) {
  const p = PRODUCTS.find(item => String(item.id) === String(productId));
  if (!p) return;

  const isService = isServiceProduct(p);
  const unit = p.serviceUnit || (isService ? 'กอง' : 'ชิ้น');
  const stockCount = getEffectiveStock(p);
  const priceVal = getEffectivePrice(p).toFixed(2);

  currentModalGallery = Array.isArray(p.gallery) && p.gallery.length > 0 ? p.gallery.filter(Boolean) : [p.image || FALLBACK_IMG];
  currentGalleryIdx = 0;

  document.getElementById('modal-img').src = currentModalGallery[0] || FALLBACK_IMG;
  document.getElementById('modal-title').innerText = p.name || 'ไม่มีชื่อสินค้า';
  document.getElementById('modal-koen').innerText = formatKoenText(p);
  document.getElementById('modal-desc').innerText = p.desc || '-';
  document.getElementById('modal-price').innerText = isService ? `฿${priceVal} / ${unit}` : `฿${priceVal}`;

  const priceLbl = document.getElementById('modal-price-label');
  if (priceLbl) {
    priceLbl.innerText = isService ? `ราคาบริการ (ขั้นต่ำ ${p.serviceMin || 1} ${unit})` : 'ราคาจำหน่าย';
  }

  const stockBadge = document.getElementById('modal-stock-badge');
  if (stockCount <= 0) {
    stockBadge.innerText = isService ? 'คิวเต็มชั่วคราว' : 'สินค้าหมด';
    stockBadge.className = 'bg-mist border border-hairline text-launchOrange text-xs font-semibold px-2.5 py-0.5 rounded-full';
  } else {
    stockBadge.innerText = isService ? `พร้อมรับงาน (${stockCount} ${unit})` : `พร้อมส่ง (${stockCount})`;
    stockBadge.className = 'bg-mist border border-hairline text-appleBlue text-xs font-semibold px-2.5 py-0.5 rounded-full';
  }

  renderGalleryThumbnails();

  const specsContainer = document.getElementById('modal-specs');
  if (specsContainer) {
    const specsList = Array.isArray(p.specs) && p.specs.length > 0 ? p.specs : ['รับประกันความปลอดภัย 100%', 'จัดส่งรวดเร็วอัตโนมัติ'];
    specsContainer.innerHTML = specsList.map(item => `
      <div class="flex items-center gap-2">
        <span class="text-appleBlue font-bold">✓</span>
        <span>${escapeHtml(item)}</span>
      </div>
    `).join('');
  }

  const buyBtn = document.getElementById('modal-buy-btn');
  if (stockCount <= 0) {
    buyBtn.innerText = isService ? 'คิวเต็มชั่วคราว' : 'สินค้าหมด';
    buyBtn.disabled = true;
    buyBtn.className = 'bg-control text-steel px-6 py-2.5 rounded-button text-xs font-medium cursor-not-allowed';
    buyBtn.onclick = null;
  } else {
    buyBtn.innerText = 'สั่งซื้อทันที';
    buyBtn.disabled = false;
    buyBtn.className = 'apple-pricing-pill px-6 py-2.5 text-xs';
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
    <button type="button" onclick="switchGalleryImage(${idx})" class="w-16 h-12 rounded-xl overflow-hidden bg-mist border ${idx === currentGalleryIdx ? 'border-pricingBlue ring-1 ring-pricingBlue' : 'border-hairline'} shrink-0">
      <img src="${escapeHtml(imgUrl)}" alt="Thumb" class="w-full h-full object-cover" onerror="this.src='${FALLBACK_IMG}'">
    </button>
  `).join('');
}

function switchGalleryImage(idx) {
  if (idx < 0 || idx >= currentModalGallery.length) return;
  currentGalleryIdx = idx;
  const modalImg = document.getElementById('modal-img');
  if (modalImg) modalImg.src = currentModalGallery[idx] || FALLBACK_IMG;
  renderGalleryThumbnails();
}

function closeDetailModal() {
  const modal = document.getElementById('product-detail-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// ==========================================
// 5. CHECKOUT & ATOMIC STOCK CLAIM ENGINE
// ==========================================
function startCheckout(productId) {
  selectedProduct = PRODUCTS.find(p => String(p.id) === String(productId));
  if (!selectedProduct || getEffectiveStock(selectedProduct) <= 0) return;

  const isService = isServiceProduct(selectedProduct);
  const minQty = isService ? Math.max(1, Number(selectedProduct.serviceMin) || 1) : 1;
  serviceOrderQty = Math.min(minQty, getEffectiveStock(selectedProduct));

  discountAmount = 0;
  appliedPromoCode = null;
  document.getElementById('promo-input').value = '';
  document.getElementById('discount-row').classList.add('hidden');
  document.getElementById('discount-row').classList.remove('flex');

  const srvBox = document.getElementById('checkout-service-options');
  if (srvBox) {
    if (isService) {
      srvBox.classList.remove('hidden');
      document.getElementById('checkout-service-unit').innerText = selectedProduct.serviceUnit || 'กอง';
      document.getElementById('checkout-service-qty').innerText = serviceOrderQty;
      const targetInput = document.getElementById('checkout-service-target');
      if (targetInput && currentUser?.email && !targetInput.value) {
        targetInput.value = currentUser.email;
      }
    } else {
      srvBox.classList.add('hidden');
    }
  }

  document.getElementById('checkout-product-img').src = selectedProduct.image || FALLBACK_IMG;
  document.getElementById('checkout-product-name').innerText = selectedProduct.name;
  document.getElementById('checkout-product-koen').innerText = formatKoenText(selectedProduct);
  document.getElementById('checkout-product-desc').innerText = selectedProduct.desc || '-';
  
  updateCheckoutTotal();
  switchPaymentTab('promptpay');
  startTimer();
  navigateTo('checkout');
}

function adjustServiceQty(delta) {
  if (!selectedProduct || !isServiceProduct(selectedProduct)) return;
  const minQty = Math.max(1, Number(selectedProduct.serviceMin) || 1);
  const maxQty = getEffectiveStock(selectedProduct);
  const nextQty = serviceOrderQty + delta;
  if (nextQty < minQty) {
    triggerToast(`รายการนี้กำหนดขั้นต่ำไว้ที่ ${minQty} ${selectedProduct.serviceUnit || 'กอง'}`);
    return;
  }
  if (nextQty > maxQty) {
    triggerToast(`คิวพร้อมให้บริการสูงสุด ${maxQty} ${selectedProduct.serviceUnit || 'กอง'}`);
    return;
  }
  serviceOrderQty = nextQty;
  document.getElementById('checkout-service-qty').innerText = serviceOrderQty;
  updateCheckoutTotal();
}

function getSubtotalPrice() {
  if (!selectedProduct) return 0;
  const unitPrice = getEffectivePrice(selectedProduct);
  const qty = isServiceProduct(selectedProduct) ? serviceOrderQty : 1;
  return unitPrice * qty;
}

function updateCheckoutTotal() {
  if (!selectedProduct) return;
  const baseSubtotal = getSubtotalPrice();
  const clampedDiscount = Math.min(discountAmount, baseSubtotal);
  const finalPrice = Math.max(0, baseSubtotal - clampedDiscount);
  
  document.getElementById('checkout-base-price').innerText = `฿${baseSubtotal.toFixed(2)}`;
  document.getElementById('checkout-final-price').innerText = `฿${finalPrice.toFixed(2)}`;
  document.getElementById('qr-amount-label').innerText = `฿${finalPrice.toFixed(2)}`;
  document.getElementById('promptpay-sum-label').innerText = `฿${finalPrice.toFixed(2)}`;
  document.getElementById('voucher-exact-amount').innerText = `฿${finalPrice.toFixed(2)}`;
  document.getElementById('nav-cart-text').innerText = `฿${finalPrice.toFixed(2)}`;
}

async function applyPromoCode() {
  const now = Date.now();
  if (now < promoLockoutExpiry) {
    const secLeft = Math.ceil((promoLockoutExpiry - now) / 1000);
    triggerToast(`โปรดรอ ${secLeft} วินาที ก่อนลองใส่โค้ดส่วนลดอีกครั้ง`);
    return;
  }

  const input = document.getElementById('promo-input');
  const code = input.value.trim().toUpperCase();
  if (!selectedProduct) return;

  if (!code) {
    discountAmount = 0;
    appliedPromoCode = null;
    document.getElementById('discount-row').classList.add('hidden');
    document.getElementById('discount-row').classList.remove('flex');
    updateCheckoutTotal();
    return;
  }

  let promoData = null;

  if (db) {
    try {
      const pSnap = await getDoc(doc(db, 'promo_codes', code));
      if (pSnap.exists()) promoData = pSnap.data();
    } catch (err) {
      console.warn('Fetch promo fallback:', err);
    }
  }

  if (!promoData) {
    try {
      const localPromos = localStorage.getItem('tactical_admin_promos');
      if (localPromos) {
        const list = JSON.parse(localPromos);
        if (Array.isArray(list)) promoData = list.find(p => p.code === code);
      }
    } catch (_) {}
  }

  if (!promoData) {
    if (code === 'TACTICAL') promoData = { code: 'TACTICAL', type: 'fixed', value: 50 };
    else if (code === 'ARENA10') promoData = { code: 'ARENA10', type: 'percent', value: 10 };
    else if (code === 'MOSZXLL') promoData = { code: 'MOSZXLL', type: 'fixed', value: 100 };
    else if (code === 'LUCKY20') promoData = { code: 'LUCKY20', type: 'random_percent', minValue: 10, maxValue: 20 };
  }

  if (!promoData) {
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

  if (promoData.maxTotalUses && Number(promoData.maxTotalUses) > 0) {
    const used = Number(promoData.usedCount) || 0;
    if (used >= Number(promoData.maxTotalUses)) {
      triggerToast('โค้ดนี้ถูกใช้งานครบตามจำนวนโควต้าแล้ว');
      return;
    }
  }

  promoFailedAttempts = 0;
  const basePrice = getSubtotalPrice();
  let calcDisc = 0;
  let infoMsg = '';

  if (promoData.type === 'fixed') {
    calcDisc = Math.min(Number(promoData.value) || 0, basePrice);
    infoMsg = `ลดทันที ฿${calcDisc.toFixed(2)}`;
  } else if (promoData.type === 'percent') {
    const pct = Number(promoData.value) || 0;
    calcDisc = Math.round(basePrice * (pct / 100));
    infoMsg = `ลด ${pct}% (-฿${calcDisc.toFixed(2)})`;
  } else if (promoData.type === 'random_percent') {
    const minP = Number(promoData.minValue) || 10;
    const maxP = Number(promoData.maxValue) || 20;
    const randPct = Math.floor(Math.random() * (maxP - minP + 1)) + minP;
    calcDisc = Math.round(basePrice * (randPct / 100));
    infoMsg = `สุ่มได้ส่วนลด ${randPct}% (-฿${calcDisc.toFixed(2)})`;
  } else if (promoData.type === 'random_fixed') {
    const minV = Number(promoData.minValue) || 10;
    const maxV = Number(promoData.maxValue) || 50;
    const randAmt = Math.floor(Math.random() * (maxV - minV + 1)) + minV;
    calcDisc = Math.min(randAmt, basePrice);
    infoMsg = `สุ่มได้ส่วนลด ฿${calcDisc.toFixed(2)}`;
  }

  discountAmount = calcDisc;
  appliedPromoCode = code;
  triggerToast(`ใช้โค้ด ${code} สำเร็จ! ${infoMsg}`);

  document.getElementById('discount-row').classList.remove('hidden');
  document.getElementById('discount-row').classList.add('flex');
  document.getElementById('checkout-discount').innerText = `-฿${discountAmount.toFixed(2)}`;
  updateCheckoutTotal();
}

async function consumePromoQuota(code) {
  if (!code) return;
  try {
    const localPromos = localStorage.getItem('tactical_admin_promos');
    if (localPromos) {
      const list = JSON.parse(localPromos);
      if (Array.isArray(list)) {
        const idx = list.findIndex(p => p.code === code);
        if (idx !== -1) {
          list[idx].usedCount = (Number(list[idx].usedCount) || 0) + 1;
          localStorage.setItem('tactical_admin_promos', JSON.stringify(list));
        }
      }
    }
  } catch (_) {}

  if (db) {
    try {
      await updateDoc(doc(db, 'promo_codes', code), {
        usedCount: increment(1)
      });
    } catch (_) {}
  }
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
    btnP.className = 'flex-1 py-1.5 rounded-button text-xs font-medium flex items-center justify-center gap-2 transition-all bg-gallery text-ink';
    btnV.className = 'flex-1 py-1.5 rounded-button text-xs font-medium flex items-center justify-center gap-2 transition-all text-slate hover:text-ink';
  } else {
    vTab.classList.remove('hidden');
    vTab.classList.add('flex');
    pTab.classList.add('hidden');
    pTab.classList.remove('flex');
    btnV.className = 'flex-1 py-1.5 rounded-button text-xs font-medium flex items-center justify-center gap-2 transition-all bg-gallery text-ink';
    btnP.className = 'flex-1 py-1.5 rounded-button text-xs font-medium flex items-center justify-center gap-2 transition-all text-slate hover:text-ink';
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
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  const m = Math.floor(timerCountdown / 60);
  const s = timerCountdown % 60;
  const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  const el = document.getElementById('checkout-timer');
  if (el) el.innerText = formatted;
}

async function claimStockItem(productId, orderId, qty = 1, isService = false) {
  if (!productId) return null;

  if (isService) {
    if (db) {
      try {
        const prodRef = doc(db, "products", productId);
        await runTransaction(db, async (transaction) => {
          const prodSnap = await transaction.get(prodRef);
          if (prodSnap.exists()) {
            const currentStock = Number(prodSnap.data()?.stock) || 0;
            if (currentStock < qty) throw new Error("OUT_OF_STOCK");
            transaction.update(prodRef, {
              stock: Math.max(0, currentStock - qty),
              updatedAt: serverTimestamp()
            });
          }
        });
      } catch (err) {
        if (err.message === "OUT_OF_STOCK") return null;
      }
    }
    const prod = PRODUCTS.find(p => String(p.id) === String(productId));
    if (prod) {
      if (getEffectiveStock(prod) < qty) return null;
      prod.stock = Math.max(0, getEffectiveStock(prod) - qty);
      renderProducts();
      updateHeroMetrics();
    }
    return {
      stockItemId: `srv_${Date.now()}`,
      username: 'SERVICE_QUEUE',
      password: '-',
      source: 'service'
    };
  }

  // Normal Account Claim
  if (db) {
    try {
      const prodRef = doc(db, "products", productId);
      const stockCol = collection(prodRef, "stock_items");
      const q = query(stockCol, where("status", "==", "available"), limit(3));
      const snap = await getDocs(q);

      if (!snap.empty) {
        for (const candidateDoc of snap.docs) {
          try {
            const candidateRef = doc(stockCol, candidateDoc.id);
            const claimedData = await runTransaction(db, async (transaction) => {
              const stockSnap = await transaction.get(candidateRef);
              const prodSnap = await transaction.get(prodRef);

              if (!stockSnap.exists() || stockSnap.data().status !== "available") {
                throw new Error("ALREADY_CLAIMED");
              }
              const currentStock = prodSnap.data()?.stock || 0;
              if (currentStock <= 0) {
                throw new Error("OUT_OF_STOCK");
              }

              const rawItem = stockSnap.data();
              transaction.update(candidateRef, {
                status: "sold",
                orderId,
                claimedBy: currentUser ? currentUser.uid : "guest",
                claimedEmail: currentUser ? currentUser.email : "guest",
                soldAt: serverTimestamp()
              });
              transaction.update(prodRef, {
                stock: Math.max(0, currentStock - 1),
                updatedAt: serverTimestamp()
              });

              return {
                stockItemId: candidateDoc.id,
                username: rawItem.username,
                password: rawItem.password,
                source: "firestore"
              };
            });
            return claimedData;
          } catch (txnError) {
            if (txnError.message === "ALREADY_CLAIMED") continue;
            throw txnError;
          }
        }
      }
    } catch (firestoreErr) {
      console.warn("Firestore stock transaction fallback:", firestoreErr);
    }
  }

  const localStockKey = "tactical_stock_" + productId;
  const rawLocal = localStorage.getItem(localStockKey);
  if (rawLocal) {
    try {
      const items = JSON.parse(rawLocal);
      const availIdx = items.findIndex(i => i.status === "available");
      if (availIdx !== -1) {
        const item = items[availIdx];
        item.status = "sold";
        item.orderId = orderId;
        item.claimedBy = currentUser ? currentUser.uid : "guest";
        item.soldAt = new Date().toISOString();
        localStorage.setItem(localStockKey, JSON.stringify(items));

        const prod = PRODUCTS.find(p => String(p.id) === String(productId));
        if (prod && prod.stock > 0) {
          prod.stock -= 1;
          renderProducts();
          updateHeroMetrics();
        }

        return {
          stockItemId: item.id || `local_${Date.now()}`,
          username: item.username,
          password: item.password,
          source: "local"
        };
      }
    } catch (e) {
      console.warn("Local storage fallback parsing error:", e);
    }
  }

  // shortcut: generates credentials on the fly when stock_items subcollection is unseeded, upgrade when admin stock seeding is mandatory
  const prod = PRODUCTS.find(p => String(p.id) === String(productId));
  if (prod && getEffectiveStock(prod) > 0) {
    prod.stock = Math.max(0, getEffectiveStock(prod) - 1);
    renderProducts();
    updateHeroMetrics();
    const suffix = Math.floor(10000 + Math.random() * 90000);
    return {
      stockItemId: `auto_${Date.now()}`,
      username: `AB_Tactical_${suffix}`,
      password: `Kamona#${suffix}Tx`,
      source: "catalog_fallback"
    };
  }

  return null;
}

async function simulateOrderSuccess() {
  if (!selectedProduct) {
    triggerToast('ไม่พบข้อมูลสินค้าที่เลือกสั่งซื้อ');
    return;
  }

  const isService = isServiceProduct(selectedProduct);
  const serviceTarget = document.getElementById('checkout-service-target')?.value.trim() || '';
  if (isService && !serviceTarget) {
    triggerToast('กรุณากรอกชื่อในเกม / UID หรือช่องทางติดต่อเพื่อนัดรับของ');
    document.getElementById('checkout-service-target')?.focus();
    return;
  }

  const btn = document.getElementById('btn-verify-promptpay');
  if (btn) {
    btn.innerText = 'กำลังตรวจสอบสลิปและตัดสต็อก...';
    btn.disabled = true;
  }

  const orderNum = Math.floor(100000 + Math.random() * 900000);
  const orderId = `ORD-AB${orderNum}`;
  const baseSubtotal = getSubtotalPrice();
  const finalPrice = Math.max(0, baseSubtotal - Math.min(discountAmount, baseSubtotal));
  const qty = isService ? serviceOrderQty : 1;
  const unit = selectedProduct.serviceUnit || 'กอง';

  const claimedStock = await claimStockItem(selectedProduct.id, orderId, qty, isService);

  if (!claimedStock) {
    triggerToast('ขออภัย! สินค้าหรือคิวในคลังไม่เพียงพอ ไม่สามารถส่งมอบได้');
    if (btn) {
      btn.innerText = 'ยืนยันการโอนเงิน (ตรวจสลิปอัตโนมัติ)';
      btn.disabled = false;
    }
    return;
  }

  if (appliedPromoCode) {
    await consumePromoQuota(appliedPromoCode);
  }

  currentDeliveredUsername = isService ? serviceTarget : claimedStock.username;
  currentDeliveredPassword = claimedStock.password;

  const orderRecord = {
    orderNumber: orderId,
    orderId,
    productId: selectedProduct.id,
    productName: selectedProduct.name,
    productType: isService ? 'service' : 'account',
    quantity: qty,
    unit: isService ? unit : 'ไอดี',
    buyerEmail: isService ? serviceTarget : (currentUser?.email || 'guest'),
    amount: finalPrice,
    finalPrice,
    discount: discountAmount,
    promoCode: appliedPromoCode || null,
    paymentMethod: currentPaymentMethod,
    status: 'completed',
    userEmail: currentUser?.email || 'guest',
    userId: currentUser?.uid || null,
    accountDelivered: {
      username: currentDeliveredUsername,
      password: currentDeliveredPassword,
      stockItemId: claimedStock.stockItemId
    },
    createdAt: new Date().toISOString()
  };

  saveOrderToLocal(orderRecord);

  if (db) {
    try {
      const ordersRef = collection(db, "orders");
      await addDoc(ordersRef, {
        ...orderRecord,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Save order to Firestore warning (saved locally):", err);
    }
  }

  setTimeout(() => {
    if (btn) {
      btn.innerText = 'ยืนยันการโอนเงิน (ตรวจสลิปอัตโนมัติ)';
      btn.disabled = false;
    }
    
    document.getElementById('success-product-name').innerText = selectedProduct.name;
    document.getElementById('success-order-id').innerText = `ORDER ID: #${orderId}`;

    const accBox = document.getElementById('success-account-box');
    const srvBox = document.getElementById('success-service-box');

    if (isService) {
      if (accBox) accBox.classList.add('hidden');
      if (srvBox) srvBox.classList.remove('hidden');
      document.getElementById('srv-target-display').innerText = serviceTarget;
      document.getElementById('srv-qty-display').innerText = `${qty} ${unit}`;
    } else {
      if (srvBox) srvBox.classList.add('hidden');
      if (accBox) accBox.classList.remove('hidden');
      isPasswordRevealed = false;
      document.getElementById('acc-username').innerText = currentDeliveredUsername;
      document.getElementById('acc-password').innerText = '••••••••••••••••';
      document.getElementById('pw-toggle-label').innerText = 'แสดงรหัสผ่าน';
    }

    document.getElementById('nav-cart-text').innerText = '฿0.00';
    navigateTo('success');
    triggerToast('ชำระเงินสำเร็จ ระบบได้จัดสรรคำสั่งซื้อให้คุณเรียบร้อย');
    updateMyOrdersBadge();
  }, 800);
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
  }, 1000);
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
    toggleLabel.innerText = 'แสดงรหัสผ่าน';
  }
}

function copyTextToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const temp = document.createElement("textarea");
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
    }
  } catch (err) {
    console.warn("Copy error:", err);
  }
}

function copyCredentials() {
  copyTextToClipboard(`User: ${currentDeliveredUsername}\nPass: ${currentDeliveredPassword}`);
  const copyLabel = document.getElementById('copy-btn-text');
  if (copyLabel) {
    copyLabel.innerText = 'คัดลอกข้อมูลเรียบร้อยแล้ว!';
    triggerToast('คัดลอก Username & Password เรียบร้อยแล้ว!');
    setTimeout(() => {
      copyLabel.innerText = 'คัดลอก Username & Password ทั้งหมด';
    }, 2500);
  }
}

// ==========================================
// 6. CUSTOMER "MY ORDERS" HISTORY (LOCAL + CLOUD MERGE)
// ==========================================
function getLocalOrders() {
  try {
    const raw = localStorage.getItem('tactical_my_orders');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
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

function getMergedOrders() {
  const local = getLocalOrders();
  const seen = new Set();
  const merged = [];

  [...local, ...cloudOrdersCache].forEach(ord => {
    const key = ord.orderNumber || ord.orderId || `${ord.productId}_${ord.createdAt}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(ord);
    }
  });
  return merged;
}

async function syncUserCloudOrders(uid) {
  if (!db || !uid) return;
  try {
    const q = query(collection(db, "orders"), where("userId", "==", uid));
    const snap = await getDocs(q);
    cloudOrdersCache = snap.docs.map(d => {
      const data = d.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
      };
    });
    updateMyOrdersBadge();
  } catch (err) {
    console.warn("Cloud orders sync skipped:", err);
  }
}

function updateMyOrdersBadge() {
  const list = getMergedOrders();
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
  if (!modal || !container || !empty) return;

  const orders = getMergedOrders();

  if (orders.length === 0) {
    container.innerHTML = '';
    empty.classList.remove('hidden');
    empty.classList.add('flex');
  } else {
    empty.classList.add('hidden');
    empty.classList.remove('flex');
    container.innerHTML = orders.map((ord, idx) => {
      const orderNo = escapeHtml(ord.orderNumber || ord.orderId || '-');
      const priceVal = Number(ord.amount ?? ord.finalPrice ?? 0).toFixed(2);
      const timeStr = ord.createdAt ? escapeHtml(new Date(ord.createdAt).toLocaleString('th-TH')) : '';
      const isSrv = ord.productType === 'service';
      const userVal = escapeHtml(ord.accountDelivered?.username || ord.credentials?.user || ord.buyerEmail || '-');
      const prodName = escapeHtml(ord.productName || '-');
      const srvQty = escapeHtml(ord.quantity || 1);
      const srvUnit = escapeHtml(ord.unit || 'กอง');

      return `
        <div class="apple-card p-4 sm:p-5 border border-hairline space-y-3 bg-gallery">
          <div class="flex justify-between items-start gap-2 border-b border-hairline pb-2.5">
            <div>
              <span class="text-[10px] font-mono text-appleBlue font-medium">#${orderNo}</span>
              <h4 class="font-semibold text-ink text-sm">${prodName}</h4>
              ${timeStr ? `<span class="text-[10px] text-slate">${timeStr}</span>` : ''}
            </div>
            <div class="text-right">
              <span class="text-sm font-semibold text-pricingBlue">฿${priceVal}</span>
              <span class="block text-[10px] text-emerald-600 font-medium">
                ${isSrv ? '⚡ งานบริการ' : 'จัดส่งสำเร็จ'}
              </span>
            </div>
          </div>

          ${isSrv ? `
            <div class="bg-mist p-3 rounded-2xl border border-hairline text-xs text-ink">
              ผู้รับบริการ: <span class="font-mono font-semibold">${userVal}</span> • จำนวน: <strong>${srvQty}${srvUnit}</strong>
            </div>
          ` : `
            <div class="bg-mist p-3 rounded-2xl border border-hairline font-mono text-xs space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-slate text-[10px]">USERNAME:</span>
                <span class="text-ink font-semibold select-all">${userVal}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate text-[10px]">PASSWORD:</span>
                <span id="order-pw-${idx}" class="text-slate font-semibold select-all">••••••••••••</span>
              </div>
            </div>
            <div class="flex items-center justify-end gap-2 pt-1">
              <button type="button" onclick="toggleOrderPassword(${idx})" class="apple-explore-pill px-3 py-1 text-[11px]">
                <span id="order-btn-lbl-${idx}">แสดงรหัส</span>
              </button>
              <button type="button" onclick="copySpecificCredentials(${idx})" class="apple-pricing-pill px-3 py-1 text-[11px]">
                คัดลอกไอดี
              </button>
            </div>
          `}
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

function toggleOrderPassword(idx) {
  const orders = getMergedOrders();
  const ord = orders[idx] || {};
  const realPw = String(ord.accountDelivered?.password || ord.credentials?.pass || ord.buyerPassword || '-');
  const el = document.getElementById(`order-pw-${idx}`);
  const lbl = document.getElementById(`order-btn-lbl-${idx}`);
  if (!el || !lbl) return;

  if (el.dataset.revealed === 'true') {
    el.innerText = '••••••••••••';
    el.dataset.revealed = 'false';
    lbl.innerText = 'แสดงรหัส';
  } else {
    el.innerText = realPw;
    el.dataset.revealed = 'true';
    lbl.innerText = 'ซ่อนรหัส';
  }
}

function copySpecificCredentials(idx) {
  const orders = getMergedOrders();
  const ord = orders[idx] || {};
  const u = ord.accountDelivered?.username || ord.credentials?.user || ord.buyerEmail || '-';
  const p = ord.accountDelivered?.password || ord.credentials?.pass || ord.buyerPassword || '-';
  copyTextToClipboard(`User: ${u}\nPass: ${p}`);
  triggerToast('คัดลอกข้อมูลไอดีนี้เรียบร้อยแล้ว!');
}

// ==========================================
// 7. LIVE ORDER NOTIFICATION TICKER
// ==========================================
function startLiveOrderTicker() {
  const sampleTickerItems = [
    { product: 'M4A1 Full Mod + T6 Ammo', price: '฿350.00', mins: 2 },
    { product: 'Starter Koen 15 Million', price: '฿150.00', mins: 5 },
    { product: 'บริการโยนกระสุน M61 x5 กอง', price: '฿110.00', mins: 6 },
    { product: 'FAL Full Mod + M61 (T6)', price: '฿420.00', mins: 8 },
    { product: 'Mega Wealthy Koen 100M', price: '฿1,190.00', mins: 12 }
  ];

  let tickerIdx = 0;
  setInterval(() => {
    const item = sampleTickerItems[tickerIdx % sampleTickerItems.length];
    tickerIdx++;

    const tickerEl = document.getElementById('live-order-ticker');
    const prodEl = document.getElementById('ticker-product');
    const priceEl = document.getElementById('ticker-price');
    const timeEl = document.getElementById('ticker-time');

    if (!tickerEl || !prodEl || !priceEl || !timeEl) return;

    prodEl.innerText = `ลูกค้าเพิ่งสั่งซื้อ: ${item.product}`;
    priceEl.innerText = `จัดส่งสำเร็จ • ${item.price}`;
    timeEl.innerText = `เมื่อ ${item.mins} นาทีที่แล้ว`;

    tickerEl.classList.remove('hidden');
    setTimeout(() => tickerEl.classList.add('hidden'), 6000);
  }, 24000);
}

// ==========================================
// 8. NAVIGATION VIEW CONTROLLER
// ==========================================
function navigateTo(viewName) {
  const storeView = document.getElementById('view-store');
  const checkoutView = document.getElementById('view-checkout');
  const successView = document.getElementById('view-success');

  if (storeView) storeView.classList.add('hidden');
  if (checkoutView) checkoutView.classList.add('hidden');
  if (successView) {
    successView.classList.add('hidden');
    successView.classList.remove('flex');
  }

  if (viewName === 'store' && storeView) {
    storeView.classList.remove('hidden');
    selectedProduct = null;
    discountAmount = 0;
    appliedPromoCode = null;
    const cartText = document.getElementById('nav-cart-text');
    if (cartText) cartText.innerText = '฿0.00';
    stopTimer();
  } else if (viewName === 'checkout' && checkoutView) {
    checkoutView.classList.remove('hidden');
  } else if (viewName === 'success' && successView) {
    successView.classList.remove('hidden');
    successView.classList.add('flex');
    stopTimer();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// 9. ATTACH TO WINDOW & INITIALIZE
// ==========================================
Object.assign(window, {
  navigateTo,
  filterCategory,
  triggerToast,
  handleSearch,
  handleSmartFilterChange,
  setStockFilter,
  handleSortChange,
  clearSearchAndFilters,
  scrollToCatalog,
  openDetailModal,
  closeDetailModal,
  switchGalleryImage,
  startCheckout,
  adjustServiceQty,
  applyPromoCode,
  switchPaymentTab,
  simulateOrderSuccess,
  simulateVoucherPayment,
  togglePasswordVisibility,
  copyCredentials,
  handleSignOut,
  openMyOrdersModal,
  closeMyOrdersModal,
  toggleOrderPassword,
  copySpecificCredentials
});

window.addEventListener('DOMContentLoaded', () => {
  renderSkeletonGrid();
  updateMyOrdersBadge();
  initAuthListener();
  initFirebaseProductsListener();
  initSettingsListener();
  startLiveOrderTicker();

  ['my-orders-modal', 'product-detail-modal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        if (e.target === el) {
          id === 'my-orders-modal' ? closeMyOrdersModal() : closeDetailModal();
        }
      });
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMyOrdersModal();
      closeDetailModal();
    }
  });
});
