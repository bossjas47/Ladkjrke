# Tactical Store

Static storefront for Arena Breakout accounts and in-game services (HTML + Tailwind CDN + Firebase Auth/Firestore).

## How an order works

1. Customer signs in, picks a product and files an order. The browser only writes a `pending_payment` order
   (`js/index.js`, `js/product.js`). It never sees stock or credentials.
2. An admin opens `front/admin.html` > Orders, checks the transfer slip / TrueMoney voucher by hand and presses
   **ยืนยันชำระ & ส่งมอบ**. That one transaction marks the stock item sold, decrements stock and sets the order
   to `completed` with `accountDelivered`.
3. The customer sees the credentials under "ออเดอร์ของฉัน" / account page once the order is `completed`.

## How a wallet top-up works

Same pattern: `js/topup.js` files a `pending` request (slip reference or TrueMoney link). Admin > Topups checks the
money arrived and presses **ยืนยัน & เติมเครดิต**; one transaction credits `users/{uid}.walletBalance` and marks the
request `completed`. Browsers cannot write `users/*`. Nothing in the shop spends the wallet balance yet.

## Page transitions

`css/transition.css` (native View Transitions: header stays, page fades and rises 10px) and `js/transition.js` (fade fallback for
Firefox) are linked from every page. Both switch off under `prefers-reduced-motion`. New pages need the same two tags.

## Before going live

- Deploy `firestore.rules` (Firebase console > Firestore > Rules, or `firebase deploy --only firestore:rules`).
- Make yourself admin: `GOOGLE_APPLICATION_CREDENTIALS=serviceAccount.json node scripts/set-admin-claim.js you@example.com`
  (needs `npm i firebase-admin`), then sign out and in again. Admin is a custom claim, not an email check.
- In admin > Settings fill in the PromptPay QR image URL and account name. Without them PromptPay is disabled.
- Leave the stat tiles and banner empty unless you have real numbers; they are hidden when empty.

## Known gaps

- Order totals and promo discounts are computed in the browser. Compare each order's amount with the product
  price when you verify payment.
- Top-up bonus packs (+25, +80, +200 credit) are hard-coded in `front/topup.html` and the credit amount comes from the browser; check it when you approve.
- `account.js` shows the admin tab by email list (`ADMIN_EMAILS`), which is UI only; anyone can register that username. Data stays protected by the `admin` claim.
- `js/admin.js` still carries an unused copy of the old storefront checkout code (section 8).
