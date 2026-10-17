import { db, auth } from "../firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
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
 * TACTICAL STORE — Product Detail & Direct Purchase Controller (js/product.js)
 * High-Precision Apple Design System, Service Quantity Stepper & Instant Checkout
 */

let allProducts = [];
let currentProduct = null;
let currentGallery = [];
let currentGalleryIdx = 0;
let currentQuantity = 1;
let currentDiscount = 0;
let appliedPromoCode = null;
let promoRule = null; // {type:'fixed'|'percent', value}, re-applied whenever the quantity changes
let isSubmittingOrder = false;
let shopSettings = {};
let currentPaymentMethod = 'promptpay';
let lastFulfilledOrder = null;

// ==========================================
// 1. INITIALIZATION & DATA FETCHING
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initAuthListener();
  initShopSettings();
  loadProductPage();
});

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// PromptPay QR / account name come from system/settings so no payment details are hard-coded in the page.
function initShopSettings() {
  try {
    onSnapshot(doc(db, 'system', 'settings'), (snap) => {
      shopSettings = snap.exists() ? snap.data() : {};
      const qr = document.getElementById('product-qr-image');
      const placeholder = document.getElementById('product-qr-placeholder');
      const name = document.getElementById('product-promptpay-name');
      const ok = /^https:\/\//.test(String(shopSettings.promptpayQrUrl || ''));
      if (qr) { if (ok) qr.src = shopSettings.promptpayQrUrl; qr.classList.toggle('hidden', !ok); }
      if (placeholder) placeholder.classList.toggle('hidden', ok);
      if (name) name.innerText = shopSettings.promptpayName || '';
    }, (err) => console.warn('Settings listener error:', err));
  } catch (err) {
    console.warn('Settings listener skipped:', err);
  }
}

async function loadProductPage() {
  const params = new URLSearchParams(window.location.search);
  const targetId = params.get('id');
  const shouldBuy = params.get('action') === 'buy' || params.get('buy') === 'true';

  // 1. Fetch live products from Firestore or fallback
  try {
    const snap = await getDocs(collection(db, "products"));
    if (!snap.empty) {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      allProducts = fetched;
    }
  } catch (err) {
    console.warn("Firestore fetch products fallback:", err);
  }

  // 2. Identify target product
  if (targetId) {
    currentProduct = allProducts.find(p => String(p.id) === String(targetId));
  }
  if (!currentProduct && !targetId && allProducts.length > 0) {
    currentProduct = allProducts[0];
  }

  const loadingEl = document.getElementById('product-loading-state');
  const notFoundEl = document.getElementById('product-not-found');
  const stageEl = document.getElementById('product-content-stage');

  if (loadingEl) loadingEl.classList.add('hidden');

  if (!currentProduct) {
    if (notFoundEl) notFoundEl.classList.remove('hidden');
    return;
  }

  if (stageEl) stageEl.classList.remove('hidden');

  // 3. Render Product View
  renderProductDetails(currentProduct);
  renderRelatedProducts(currentProduct);

  // 4. Auto scroll if buy action requested
  if (shouldBuy) {
    setTimeout(() => {
      scrollToCheckoutForm();
    }, 200);
  }
}

// ==========================================
// 2. RENDER PRODUCT DETAILS (Apple Design)
// ==========================================
function renderProductDetails(p) {
  const isService = p.productType === 'service' || (p.category && p.category.startsWith('service_'));
  const unit = p.serviceUnit || (isService ? 'กอง' : 'ชิ้น');
  const minOrder = isService ? (parseInt(p.serviceMin, 10) || 1) : 1;
  const unitPrice = isService ? (parseFloat(p.serviceRate) || parseFloat(p.price) || 0) : (parseFloat(p.price) || 0);

  // Set quantity to at least minOrder
  currentQuantity = minOrder;
  currentDiscount = 0;
  appliedPromoCode = null;
  promoRule = null;

  // Title, Headings & Breadcrumbs
  document.title = `${p.name} — TACTICAL STORE`;
  const nameBreadcrumb = document.getElementById('breadcrumb-product-name');
  if (nameBreadcrumb) nameBreadcrumb.innerText = p.name;

  const catBreadcrumb = document.getElementById('breadcrumb-category');
  if (catBreadcrumb) {
    catBreadcrumb.innerText = isService ? 'งานบริการในเกม' : (p.category || 'ไอดีเกม');
  }

  const titleHeading = document.getElementById('product-title-heading');
  if (titleHeading) titleHeading.innerText = p.name;

  // Media Gallery Setup
  currentGallery = Array.isArray(p.gallery) && p.gallery.length > 0 ? p.gallery : [p.image];
  currentGalleryIdx = 0;
  updateGalleryView(0);
  renderGalleryThumbnails();

  // Badges
  const typeBadgeText = document.getElementById('product-type-text');
  if (typeBadgeText) {
    typeBadgeText.innerText = isService ? 'งานบริการในเกม' : 'ไอดีเกมพร้อมส่ง';
  }

  const stockBadge = document.getElementById('product-stock-badge');
  const stockText = document.getElementById('product-stock-text');
  const isOutOfStock = Number(p.stock) <= 0;

  if (stockBadge && stockText) {
    if (isService) {
      stockBadge.className = 'bg-gallery/95 text-appleBlue border border-hairline text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm flex items-center gap-1';
      stockText.innerText = `พร้อมรับงาน (${p.stock} ${unit})`;
    } else if (isOutOfStock) {
      stockBadge.className = 'bg-gallery/95 text-launchOrange border border-hairline text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm flex items-center gap-1';
      stockText.innerText = 'สินค้าหมด (Out of Stock)';
    } else {
      stockBadge.className = 'bg-gallery/95 text-emerald-600 border border-hairline text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm flex items-center gap-1';
      stockText.innerText = `พร้อมส่ง (${p.stock} ชิ้น)`;
    }
  }

  // Koen / Key Attribute Tag
  const koenTag = document.getElementById('product-koen-tag');
  if (koenTag) {
    const label = p.koenLabel || (isService ? 'ข้อกำหนดบริการ' : 'มูลค่า Koen');
    koenTag.innerText = `${label}: ${p.koen || '-'}`;
  }

  // Tags
  const tagsContainer = document.getElementById('product-tags-container');
  if (tagsContainer) {
    const tagList = Array.isArray(p.tags) ? p.tags : [];
    tagsContainer.innerHTML = tagList.map(t => `
      <span class="bg-mist text-slate border border-hairline text-[11px] font-medium px-2.5 py-0.5 rounded-full">
        ${t}
      </span>
    `).join('');
  }

  // Pricing Unit & Min Order
  const unitPriceEl = document.getElementById('product-unit-price');
  if (unitPriceEl) unitPriceEl.innerText = `฿${unitPrice.toFixed(2)}`;

  const unitSuffixEl = document.getElementById('product-unit-suffix');
  if (unitSuffixEl) unitSuffixEl.innerText = `/ ${unit}`;

  const minBadgeEl = document.getElementById('product-min-badge');
  const minTextEl = document.getElementById('product-min-text');
  if (minBadgeEl && minTextEl) {
    if (isService && minOrder > 1) {
      minBadgeEl.classList.remove('hidden');
      minTextEl.innerText = `ขั้นต่ำ ${minOrder} ${unit}`;
    } else {
      minBadgeEl.classList.add('hidden');
    }
  }

  // Descriptions
  const descEl = document.getElementById('product-desc-paragraph');
  if (descEl) descEl.innerText = p.desc || '-';

  const fullDescEl = document.getElementById('product-full-desc');
  if (fullDescEl) fullDescEl.innerText = p.desc || '-';

  // Specifications Grid (Apple Cards)
  const specsGrid = document.getElementById('product-specs-grid');
  if (specsGrid) {
    const specItems = Array.isArray(p.specs) ? p.specs : [];
    specsGrid.innerHTML = specItems.map(item => `
      <div class="rounded-2xl p-4 bg-mist flex items-center gap-3">
        <span class="w-6 h-6 rounded-full bg-appleBlue/10 text-appleBlue text-xs flex items-center justify-center font-bold shrink-0">✓</span>
        <span class="text-[15px] font-medium text-ink">${item}</span>
      </div>
    `).join('');
  }

  // Stepper Unit & Min constraints
  const qtyInput = document.getElementById('order-quantity-input');
  if (qtyInput) {
    qtyInput.value = currentQuantity;
    qtyInput.min = minOrder;
  }
  const stepperUnit = document.getElementById('stepper-unit-label');
  if (stepperUnit) stepperUnit.innerText = unit;

  const stepperHint = document.getElementById('stepper-helper-hint');
  if (stepperHint) {
    stepperHint.innerText = isService ? `ขั้นต่ำการโยน/ให้บริการ: ${minOrder} ${unit}` : 'ระบุจำนวนที่ต้องการสั่งซื้อ';
  }

  // Render Recommended Value Packs
  renderValuePacks(p);

  // Service Buyer Extra Fields Toggle
  const serviceExtra = document.getElementById('service-extra-fields');
  if (serviceExtra) {
    if (isService) serviceExtra.classList.remove('hidden');
    else serviceExtra.classList.add('hidden');
  }

  // Pre-fill email if user is authenticated
  if (auth?.currentUser?.email) {
    const emailInput = document.getElementById('buyer-email');
    if (emailInput && !emailInput.value) emailInput.value = auth.currentUser.email;
  }

  recalculatePrices();
}

function updateGalleryView(idx) {
  if (idx < 0 || idx >= currentGallery.length) return;
  currentGalleryIdx = idx;
  const mainImg = document.getElementById('product-main-image');
  if (mainImg) mainImg.src = currentGallery[idx];

  const counterPill = document.getElementById('gallery-counter-pill');
  if (counterPill) {
    counterPill.innerText = `ภาพ ${idx + 1} / ${currentGallery.length}`;
  }

  // Update active thumbnail borders
  document.querySelectorAll('.gallery-thumb-btn').forEach((btn, i) => {
    if (i === idx) {
      btn.className = 'gallery-thumb-btn w-16 h-12 rounded-xl overflow-hidden border-2 border-pricingBlue shrink-0 transition-all';
    } else {
      btn.className = 'gallery-thumb-btn w-16 h-12 rounded-xl overflow-hidden border border-hairline opacity-70 hover:opacity-100 shrink-0 transition-all';
    }
  });
}

function renderGalleryThumbnails() {
  const container = document.getElementById('product-thumbnail-strip');
  if (!container) return;
  if (currentGallery.length <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = currentGallery.map((imgUrl, i) => `
    <button 
      type="button" 
      onclick="updateGalleryView(${i})" 
      class="gallery-thumb-btn w-16 h-12 rounded-xl overflow-hidden ${i === 0 ? 'border-2 border-pricingBlue' : 'border border-hairline opacity-70'} shrink-0 transition-all">
      <img src="${imgUrl}" alt="Thumb" class="w-full h-full object-cover">
    </button>
  `).join('');
}

// ==========================================
// 3. STEPPER & PRICE CALCULATION
// ==========================================
function changeQuantity(delta) {
  if (!currentProduct) return;
  const isService = currentProduct.productType === 'service' || currentProduct.category?.startsWith('service_');
  const minOrder = isService ? (parseInt(currentProduct.serviceMin, 10) || 1) : 1;
  // For services: allow unlimited ordering above minOrder (e.g. 15, 20, 50, 100+ units)
  const maxStock = isService ? 99999 : (Number(currentProduct.stock) > 0 ? Number(currentProduct.stock) : 999);

  const input = document.getElementById('order-quantity-input');
  let currentVal = input ? (parseInt(input.value, 10) || currentQuantity) : currentQuantity;
  let next = currentVal + delta;
  if (next < minOrder) next = minOrder;
  if (next > maxStock) next = maxStock;

  currentQuantity = next;
  if (input) input.value = currentQuantity;

  recalculatePrices();
  updateValuePackHighlight();
}

function handleQuantityDirectInput(val) {
  if (!currentProduct) return;
  const isService = currentProduct.productType === 'service' || currentProduct.category?.startsWith('service_');
  const minOrder = isService ? (parseInt(currentProduct.serviceMin, 10) || 1) : 1;
  const maxStock = isService ? 99999 : (Number(currentProduct.stock) > 0 ? Number(currentProduct.stock) : 999);

  let num = parseInt(val, 10);
  if (isNaN(num) || num < minOrder) num = minOrder;
  if (num > maxStock) num = maxStock;

  currentQuantity = num;
  const input = document.getElementById('order-quantity-input');
  if (input) input.value = currentQuantity;

  recalculatePrices();
  updateValuePackHighlight();
}

function selectValuePack(qty) {
  currentQuantity = qty;
  const input = document.getElementById('order-quantity-input');
  if (input) input.value = currentQuantity;

  recalculatePrices();
  updateValuePackHighlight();
  triggerToast(`เลือกแพ็กเกจ ${qty} เรียบร้อยแล้ว`);
}

function updateValuePackHighlight() {
  document.querySelectorAll('.value-pack-card').forEach(card => {
    const cardQty = parseInt(card.getAttribute('data-qty'), 10);
    if (cardQty === currentQuantity) {
      card.className = 'value-pack-card apple-card p-3.5 bg-gallery border-2 border-pricingBlue shadow-sm cursor-pointer transition-all flex flex-col justify-between rounded-2xl';
    } else {
      card.className = 'value-pack-card apple-card p-3.5 bg-gallery border border-hairline cursor-pointer hover:border-pricingBlue transition-all flex flex-col justify-between rounded-2xl';
    }
  });
}

function renderValuePacks(p) {
  const container = document.getElementById('value-packs-grid');
  if (!container) return;

  const isService = p.productType === 'service' || (p.category && p.category.startsWith('service_'));
  const unit = p.serviceUnit || (isService ? 'กอง' : 'ชิ้น');
  const minOrder = isService ? (parseInt(p.serviceMin, 10) || 1) : 1;
  const unitRate = isService ? (parseFloat(p.serviceRate) || parseFloat(p.price) || 0) : (parseFloat(p.price) || 0);

  if (isService) {
    const pack1Qty = minOrder;
    const pack2Qty = Math.max(minOrder * 2, pack1Qty + 10);
    const pack3Qty = Math.max(minOrder * 4, pack1Qty + 30);

    const packs = [
      {
        name: 'แพ็กเริ่มต้น',
        qty: pack1Qty,
        badge: 'ขั้นต่ำ',
        badgeColor: 'bg-gallery text-slate border border-hairline',
        desc: `จำนวน ${pack1Qty} ${unit}`,
        price: pack1Qty * unitRate
      },
      {
        name: 'แพ็กยอดนิยม',
        qty: pack2Qty,
        badge: 'สุดคุ้ม',
        badgeColor: 'bg-pricingBlue text-gallery',
        desc: `จำนวน ${pack2Qty} ${unit}`,
        price: pack2Qty * unitRate
      },
      {
        name: 'แพ็กจุใจ VIP',
        qty: pack3Qty,
        badge: 'คุ้มค่าที่สุด',
        badgeColor: 'bg-launchOrange text-gallery',
        desc: `จำนวน ${pack3Qty} ${unit}`,
        price: pack3Qty * unitRate
      }
    ];

    container.innerHTML = packs.map(pk => `
      <div 
        onclick="selectValuePack(${pk.qty})" 
        class="value-pack-card apple-card p-3.5 bg-gallery border border-hairline cursor-pointer hover:border-pricingBlue transition-all flex flex-col justify-between rounded-2xl ${currentQuantity === pk.qty ? 'border-2 border-pricingBlue shadow-sm' : ''}"
        data-qty="${pk.qty}">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${pk.badgeColor}">
            ${pk.badge}
          </span>
          <span class="text-[11px] font-mono font-bold text-pricingBlue">
            ฿${pk.price.toFixed(2)}
          </span>
        </div>
        <div>
          <div class="text-xs font-bold text-ink">${pk.name}</div>
          <div class="text-[11px] text-slate mt-0.5">${pk.desc}</div>
        </div>
        <div class="mt-2.5 pt-2 border-t border-hairline/60 flex items-center justify-between text-[10px]">
          <span class="text-steel">เฉลี่ย ฿${unitRate.toFixed(2)}/${unit}</span>
          <span class="text-appleBlue font-medium">เลือกแพ็ก ›</span>
        </div>
      </div>
    `).join('');
  } else {
    const otherProducts = allProducts.filter(item => item.id !== p.id && item.productType !== 'service').slice(0, 3);
    const displayList = otherProducts.length >= 2 ? otherProducts : allProducts.filter(item => item.id !== p.id).slice(0, 3);

    container.innerHTML = displayList.map(item => `
      <a 
        href="product.html?id=${encodeURIComponent(item.id)}" 
        class="apple-card p-3.5 bg-gallery border border-hairline hover:border-pricingBlue transition-all flex flex-col justify-between rounded-2xl block">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-mist text-ink border border-hairline">
            แนะนำ
          </span>
          <span class="text-[11px] font-mono font-bold text-pricingBlue">
            ฿${Number(item.price).toFixed(2)}
          </span>
        </div>
        <div>
          <div class="text-xs font-bold text-ink line-clamp-1">${item.name}</div>
          <div class="text-[11px] text-slate mt-0.5 line-clamp-1">${item.desc || '-'}</div>
        </div>
        <div class="mt-2.5 pt-2 border-t border-hairline/60 flex items-center justify-between text-[10px]">
          <span class="text-steel">สต็อก: ${item.stock} ชิ้น</span>
          <span class="text-appleBlue font-medium">ดูแพ็กนี้ ›</span>
        </div>
      </a>
    `).join('');
  }
}

function recalculatePrices() {
  if (!currentProduct) return;
  const isService = currentProduct.productType === 'service' || currentProduct.category?.startsWith('service_');
  const unit = currentProduct.serviceUnit || (isService ? 'กอง' : 'ชิ้น');
  const minOrder = isService ? (parseInt(currentProduct.serviceMin, 10) || 1) : 1;
  const unitRate = isService ? (parseFloat(currentProduct.serviceRate) || parseFloat(currentProduct.price) || 0) : (parseFloat(currentProduct.price) || 0);

  // Synchronize currentQuantity directly from input field if valid
  const inputEl = document.getElementById('order-quantity-input');
  if (inputEl) {
    const parsedVal = parseInt(inputEl.value, 10);
    if (!isNaN(parsedVal) && parsedVal >= minOrder) {
      currentQuantity = parsedVal;
    }
  }

  const subtotal = currentQuantity * unitRate;
  if (promoRule) {
    const raw = promoRule.type === 'percent' ? Math.round(subtotal * promoRule.value / 100) : promoRule.value;
    currentDiscount = Math.min(raw, subtotal);
  } else {
    currentDiscount = 0;
  }
  let finalPrice = Math.max(0, subtotal - currentDiscount);

  // Update DOM Line items
  const qtyLabel = document.getElementById('calc-qty-label');
  if (qtyLabel) qtyLabel.innerText = currentQuantity;

  const unitLabel = document.getElementById('calc-unit-label');
  if (unitLabel) unitLabel.innerText = unit;

  const subtotalEl = document.getElementById('calc-subtotal');
  if (subtotalEl) subtotalEl.innerText = `฿${subtotal.toFixed(2)}`;

  const discountRow = document.getElementById('calc-discount-row');
  const discountVal = document.getElementById('calc-discount-val');
  if (discountRow && discountVal) {
    if (currentDiscount > 0) {
      discountRow.classList.remove('hidden');
      discountRow.classList.add('flex');
      discountVal.innerText = `-฿${currentDiscount.toFixed(2)}`;
    } else {
      discountRow.classList.add('hidden');
      discountRow.classList.remove('flex');
    }
  }

  const finalPriceEl = document.getElementById('calc-final-price');
  if (finalPriceEl) finalPriceEl.innerText = `฿${finalPrice.toFixed(2)}`;

  const btnPriceTag = document.getElementById('btn-final-price-tag');
  if (btnPriceTag) btnPriceTag.innerText = `฿${finalPrice.toFixed(2)}`;

  const mobileBarPrice = document.getElementById('mobile-bar-price');
  if (mobileBarPrice) mobileBarPrice.innerText = `฿${finalPrice.toFixed(2)}`;

  const voucherTotal = document.getElementById('voucher-exact-total');
  if (voucherTotal) voucherTotal.innerText = `฿${finalPrice.toFixed(2)}`;

}

// ==========================================
// 4. PROMO CODES & PAYMENT TABS
// ==========================================
async function applyProductPromo() {
  const input = document.getElementById('product-promo-input');
  const msg = document.getElementById('promo-status-msg');
  if (!input || !msg || !currentProduct) return;

  const code = input.value.trim().toUpperCase();
  const show = (text, ok) => {
    msg.innerText = text;
    msg.className = `text-[11px] font-medium pt-1 block ${ok ? 'text-appleBlue' : 'text-launchOrange'}`;
  };

  if (!code) {
    promoRule = null;
    appliedPromoCode = null;
    msg.className = 'hidden';
    recalculatePrices();
    return;
  }

  // Firestore promo_codes first (admin-managed), then the two public codes advertised on the site.
  let promo = null;
  try {
    const snap = await getDoc(doc(db, 'promo_codes', code));
    if (snap.exists()) promo = snap.data();
  } catch (err) {
    console.warn('Fetch promo fallback:', err);
  }
  if (!promo) {
    if (code === 'TACTICAL') promo = { type: 'fixed', value: 50 };
    else if (code === 'ARENA10') promo = { type: 'percent', value: 10 };
  }

  const value = Number(promo?.value);
  const used = Number(promo?.usedCount) || 0;
  const quota = Number(promo?.maxTotalUses) || 0;
  if (!promo || !['fixed', 'percent'].includes(promo.type) || !(value > 0)) {
    promoRule = null;
    appliedPromoCode = null;
    show('ไม่พบโค้ดส่วนลดนี้ หรือหมดอายุ', false);
  } else if (quota > 0 && used >= quota) {
    promoRule = null;
    appliedPromoCode = null;
    show('โค้ดนี้ถูกใช้ครบตามจำนวนโควต้าแล้ว', false);
  } else {
    promoRule = { type: promo.type, value };
    appliedPromoCode = code;
    show(promo.type === 'percent' ? `ใช้โค้ด ${code} สำเร็จ (ลด ${value}%)` : `ใช้โค้ด ${code} สำเร็จ (ลด ${value} บาท)`, true);
  }
  recalculatePrices();
}

function switchProductPaymentTab(method) {
  currentPaymentMethod = method;
  const tabPP = document.getElementById('tab-pay-promptpay');
  const tabTM = document.getElementById('tab-pay-truemoney');
  const panelPP = document.getElementById('panel-pay-promptpay');
  const panelTM = document.getElementById('panel-pay-truemoney');

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
// 5. PENDING ORDER SUBMISSION
// ==========================================
function isTrueMoneyVoucher(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname === 'gift.truemoney.com';
  } catch {
    return false;
  }
}

// The browser only files a pending_payment order. An admin verifies the money and delivers the
// credentials (accountDelivered), so nothing secret is ever readable or writable from here.
async function executeProductPurchase() {
  if (!currentProduct || isSubmittingOrder) return;
  const user = auth?.currentUser;
  if (!user) {
    triggerToast('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ');
    setTimeout(() => { window.location.href = 'login.html?mode=login'; }, 1200);
    return;
  }

  const btn = document.getElementById('btn-confirm-product-order');
  const isService = currentProduct.productType === 'service' || currentProduct.category?.startsWith('service_');
  const unit = currentProduct.serviceUnit || (isService ? 'กอง' : 'ชิ้น');

  const emailInput = document.getElementById('buyer-email');
  const contactInput = document.getElementById('buyer-contact');
  const buyerEmail = emailInput ? emailInput.value.trim() : '';
  const buyerContact = contactInput ? contactInput.value.trim() : '';

  if (!buyerEmail || !buyerEmail.includes('@')) {
    triggerToast('กรุณากรอก Email ที่ถูกต้อง');
    emailInput?.focus();
    return;
  }
  if (isService && !buyerContact) {
    triggerToast('กรุณากรอกชื่อในเกม / UID หรือ Line ID เพื่อนัดรับของ');
    contactInput?.focus();
    return;
  }
  if (Number(currentProduct.stock) <= 0) {
    triggerToast('ขออภัย สินค้านี้หมดจากคลังสต็อกแล้ว');
    return;
  }

  let paymentProof;
  if (currentPaymentMethod === 'truemoney') {
    paymentProof = document.getElementById('product-voucher-input')?.value.trim() || '';
    if (!isTrueMoneyVoucher(paymentProof)) {
      triggerToast('กรุณากรอกลิงก์ซองของขวัญ TrueMoney ให้ถูกต้อง (https://gift.truemoney.com/...)');
      return;
    }
  } else {
    if (document.getElementById('product-qr-image')?.classList.contains('hidden')) {
      triggerToast('ร้านยังไม่เปิดรับชำระผ่านพร้อมเพย์ กรุณาเลือกช่องทางอื่น');
      return;
    }
    paymentProof = document.getElementById('product-payment-ref')?.value.trim() || '';
    if (!paymentProof) {
      triggerToast('กรุณากรอกเวลาที่โอนหรือเลขอ้างอิงรายการ');
      document.getElementById('product-payment-ref')?.focus();
      return;
    }
  }

  isSubmittingOrder = true;
  btn.disabled = true;
  btn.innerText = 'กำลังส่งคำสั่งซื้อ...';

  const unitRate = isService ? (parseFloat(currentProduct.serviceRate) || parseFloat(currentProduct.price) || 0) : (parseFloat(currentProduct.price) || 0);
  const subtotal = currentQuantity * unitRate;
  const discount = Math.min(currentDiscount, subtotal);
  const finalPrice = Math.round((subtotal - discount) * 100) / 100;

  try {
    const orderRef = doc(collection(db, 'orders'));
    const orderId = `ORD-${orderRef.id.slice(0, 8).toUpperCase()}`;
    const orderPayload = {
      orderNumber: orderId,
      orderId,
      productId: currentProduct.id,
      productName: currentProduct.name,
      productType: isService ? 'service' : 'account',
      quantity: currentQuantity,
      unit,
      unitPrice: unitRate,
      subtotal,
      discount,
      promoCode: appliedPromoCode || null,
      amount: finalPrice,
      finalPrice,
      paymentMethod: currentPaymentMethod,
      paymentProof,
      buyerEmail,
      buyerContact,
      status: 'pending_payment',
      userEmail: user.email || '',
      userId: user.uid,
      createdAt: serverTimestamp()
    };
    await setDoc(orderRef, orderPayload);
    lastFulfilledOrder = orderPayload;
    displayOrderSuccessCard(orderPayload);
    triggerToast('ส่งคำสั่งซื้อแล้ว ทีมงานกำลังตรวจสอบการชำระเงิน');
  } catch (err) {
    console.error('Order submit error:', err);
    triggerToast('ส่งคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
  } finally {
    isSubmittingOrder = false;
    btn.disabled = false;
    btn.innerHTML = `<span>แจ้งชำระเงิน (฿${finalPrice.toFixed(2)})</span>`;
  }
}

function displayOrderSuccessCard(order) {
  const successCard = document.getElementById('product-order-success-card');
  if (!successCard) return;
  const orderNumEl = document.getElementById('order-result-id');
  if (orderNumEl) orderNumEl.innerText = `#${order.orderId}`;
  const nameEl = document.getElementById('order-result-product');
  if (nameEl) nameEl.innerText = order.productName;
  successCard.classList.remove('hidden');
  successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function copyOrderResultCredentials() {
  if (!lastFulfilledOrder) return;
  const o = lastFulfilledOrder;
  const text = `เลขที่ออเดอร์: #${o.orderId}\nสินค้า: ${o.productName}\nยอดชำระ: ฿${o.finalPrice.toFixed(2)}`;
  navigator.clipboard.writeText(text).then(() => {
    triggerToast('คัดลอกเลขที่ออเดอร์เรียบร้อย');
  }).catch(() => {
    triggerToast('คัดลอกไม่สำเร็จ กรุณาจดเลขที่ออเดอร์ไว้');
  });
}

// ==========================================
// 6. RELATED PRODUCTS (Apple 28px Cards)
// ==========================================
function renderRelatedProducts(currentP) {
  const container = document.getElementById('related-products-grid');
  if (!container) return;

  const others = allProducts.filter(p => p.id !== currentP.id).slice(0, 3);
  if (others.length === 0) return;

  container.innerHTML = others.map(p => {
    const isSrv = p.productType === 'service' || p.category?.startsWith('service_');
    const unit = p.serviceUnit || (isSrv ? 'กอง' : 'ชิ้น');

    return `
      <div class="apple-card p-5 flex flex-col h-full">
        <a href="product.html?id=${encodeURIComponent(p.id)}" class="relative aspect-[16/10] rounded-2xl overflow-hidden bg-gallery cursor-pointer mb-4 block">
          <img 
            src="${p.image}" 
            alt="${p.name}" 
            class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onerror="this.onerror=null;this.src='https://placehold.co/800x500/f5f5f7/86868b?text=Arena+Breakout'"
          />
          <div class="absolute top-2.5 left-2.5 z-10">
            <span class="bg-gallery/95 text-ink border border-hairline text-[10px] font-semibold px-2 py-0.5 rounded-full">
              ${isSrv ? 'บริการ' : 'ไอดี'}
            </span>
          </div>
        </a>

        <div class="flex flex-col flex-grow">
          <a href="product.html?id=${encodeURIComponent(p.id)}" class="text-sm font-semibold text-ink line-clamp-1 hover:text-appleBlue transition-colors mb-1">
            ${p.name}
          </a>
          <p class="text-slate text-xs line-clamp-2 leading-relaxed mb-3">
            ${p.desc || '-'}
          </p>

          <div class="mt-auto flex items-center justify-between pt-3 border-t border-hairline">
            <div class="flex flex-col">
              <span class="text-[10px] text-slate font-medium">ราคา</span>
              <div class="text-base font-semibold text-pricingBlue font-heading">
                ฿${Number(p.price).toFixed(2)}
                ${isSrv ? `<span class="text-[11px] text-slate font-normal font-sans"> / ${unit}</span>` : ''}
              </div>
            </div>
            
            <a href="product.html?id=${encodeURIComponent(p.id)}" class="apple-explore-pill px-3 py-1 text-xs">
              ดูรายละเอียด
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 7. UTILITIES & MODALS
// ==========================================
function scrollToCheckoutForm() {
  const el = document.getElementById('checkout-anchor-section');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function triggerToast(text) {
  const box = document.getElementById('toast-box');
  const txt = document.getElementById('toast-text');
  if (!box || !txt) return;

  txt.innerText = text;
  box.classList.remove('opacity-0', '-translate-y-4', 'scale-95', 'pointer-events-none');
  box.classList.add('opacity-100', 'translate-y-0', 'scale-100');

  setTimeout(() => {
    box.classList.add('opacity-0', '-translate-y-4', 'scale-95', 'pointer-events-none');
    box.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
  }, 2800);
}

const ORDER_STATUS_LABEL = {
  pending_payment: 'รอตรวจสอบการชำระเงิน',
  completed: 'จัดส่งสำเร็จ',
  cancelled: 'ยกเลิกแล้ว'
};

async function openMyOrdersModal() {
  const modal = document.getElementById('my-orders-modal');
  const listEl = document.getElementById('my-orders-list');
  const emptyEl = document.getElementById('my-orders-empty');
  if (!modal) return;

  modal.classList.remove('hidden');
  modal.classList.add('flex');

  const user = auth?.currentUser;
  let orders = [];
  if (user) {
    try {
      const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', user.uid)));
      orders = snap.docs.map(d => ({
        ...d.data(),
        createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate().toISOString() : d.data().createdAt
      })).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    } catch (err) {
      console.warn('Load orders failed:', err);
      triggerToast('โหลดประวัติคำสั่งซื้อไม่สำเร็จ');
    }
  }

  if (orders.length === 0) {
    if (listEl) listEl.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }
  if (emptyEl) emptyEl.classList.add('hidden');
  if (!listEl) return;

  // Credentials appear only after an admin marks the order completed and delivers them.
  listEl.innerHTML = orders.map(ord => {
    const acc = ord.status === 'completed' ? (ord.accountDelivered || {}) : {};
    const isSrv = ord.productType === 'service';
    const detail = isSrv
      ? `<div class="text-[11px] text-ink font-sans bg-gallery p-2 rounded-links border border-hairline">ติดต่อ: ${escapeHtml(ord.buyerContact || '-')} | จำนวน: ${escapeHtml(ord.quantity)} ${escapeHtml(ord.unit || 'กอง')}</div>`
      : (acc.username
        ? `<div class="flex justify-between text-ink bg-gallery p-2 rounded-links border border-hairline"><span>U: ${escapeHtml(acc.username)}</span><span>P: ${escapeHtml(acc.password)}</span></div>`
        : `<div class="text-[11px] text-slate font-sans bg-gallery p-2 rounded-links border border-hairline">ไอดีจะแสดงที่นี่เมื่อทีมงานยืนยันการชำระเงินแล้ว</div>`);
    return `
      <div class="apple-card p-4 bg-mist border-hairline space-y-2 font-mono text-xs">
        <div class="flex justify-between items-center border-b border-hairline pb-1.5 font-sans">
          <span class="font-semibold text-ink">${escapeHtml(ord.productName)}</span>
          <span class="text-ink font-semibold font-mono">฿${Number(ord.finalPrice).toFixed(2)}</span>
        </div>
        <div class="flex justify-between text-slate text-[11px]">
          <span>ORDER: #${escapeHtml(ord.orderId)}</span>
          <span>${escapeHtml(ORDER_STATUS_LABEL[ord.status] || ord.status || '-')}</span>
        </div>
        ${detail}
      </div>`;
  }).join('');
}

function closeMyOrdersModal() {
  const modal = document.getElementById('my-orders-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function initAuthListener() {
  try {
    onAuthStateChanged(auth, (user) => {
      const loggedOut = document.getElementById('auth-logged-out');
      const loggedIn = document.getElementById('auth-logged-in');
      const nameEl = document.getElementById('user-display-name');
      const initialEl = document.getElementById('user-avatar-initial');

      if (user) {
        if (loggedOut) loggedOut.classList.add('hidden');
        if (loggedIn) {
          loggedIn.classList.remove('hidden');
          loggedIn.classList.add('flex');
        }
        const name = user.displayName || user.email?.split('@')[0] || 'Agent';
        if (nameEl) nameEl.innerText = name;
        if (initialEl) initialEl.innerText = name.charAt(0).toUpperCase();
      } else {
        if (loggedIn) loggedIn.classList.add('hidden');
        if (loggedOut) loggedOut.classList.remove('hidden');
      }
    });
  } catch (e) {
    console.warn("Auth listener fallback:", e);
  }
}

async function handleSignOut() {
  try {
    await signOut(auth);
    triggerToast('ออกจากระบบเรียบร้อย');
  } catch (e) {
    console.warn("Sign out error:", e);
  }
}

// Bind to window for HTML inline handlers
window.updateGalleryView = updateGalleryView;
window.changeQuantity = changeQuantity;
window.handleQuantityDirectInput = handleQuantityDirectInput;
window.applyProductPromo = applyProductPromo;
window.switchProductPaymentTab = switchProductPaymentTab;
window.executeProductPurchase = executeProductPurchase;
window.copyOrderResultCredentials = copyOrderResultCredentials;
window.scrollToCheckoutForm = scrollToCheckoutForm;
window.openMyOrdersModal = openMyOrdersModal;
window.closeMyOrdersModal = closeMyOrdersModal;
window.handleSignOut = handleSignOut;

window.selectValuePack = selectValuePack;
