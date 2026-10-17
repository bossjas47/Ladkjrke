# Tactical Store

Static storefront for Arena Breakout accounts and in-game services (HTML + Tailwind CDN + Firebase Auth/Firestore).

## How an order works

1. Customer signs in, picks a product and files an order. The browser only writes a `pending_payment` order
   (`js/index.js`, `js/product.js`). It never sees stock or credentials.
2. An admin opens `front/admin.html` > Orders, checks the transfer slip / TrueMoney voucher by hand and presses
   **ยืนยันชำระ & ส่งมอบ**. That one transaction marks the stock item sold, decrements stock and sets the order
   to `completed` with `accountDelivered`.
3. The customer sees the credentials under "ออเดอร์ของฉัน" / account page once the order is `completed`.

## Before going live

- Deploy `firestore.rules` (Firebase console > Firestore > Rules, or `firebase deploy --only firestore:rules`).
- Make yourself admin: `GOOGLE_APPLICATION_CREDENTIALS=serviceAccount.json node scripts/set-admin-claim.js you@example.com`
  (needs `npm i firebase-admin`), then sign out and in again. Admin is a custom claim, not an email check.
- In admin > Settings fill in the PromptPay QR image URL and account name. Without them PromptPay is disabled.
- Leave the stat tiles and banner empty unless you have real numbers; they are hidden when empty.

## Known gaps

- Order totals and promo discounts are computed in the browser. Compare each order's amount with the product
  price when you verify payment.
- `js/topup.js` (wallet top-up) is not converted yet: rules block it from crediting balances, so it no longer works.
- `js/admin.js` still carries an unused copy of the old storefront checkout code (section 8).
- Login falls back to storing passwords in localStorage (`js/login.js`) when Firebase Auth is unavailable.
