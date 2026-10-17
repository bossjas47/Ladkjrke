# CLAUDE.md

## Project overview

TACTICAL STORE is a Thai-language storefront for Arena Breakout Instant Market. It is a static front end built with HTML, CSS, and browser JavaScript modules. Tailwind CSS is loaded from its CDN. Firebase JS SDK 10.7.1 is imported from Google's CDN for Firebase Authentication and Cloud Firestore.

There is no `package.json`, bundler, build step, or automated test suite in this repository. Keep changes consistent with the existing vanilla HTML/CSS/JavaScript structure unless the user explicitly asks to migrate it.

## Project layout

- `index.html` and `js/index.js`: storefront home page.
- `front/login.html` and `js/login.js`: sign-in and registration.
- `front/account.html` and `js/account.js`: customer account.
- `front/category.html` and `js/category.js`: category listing.
- `front/product.html` and `js/product.js`: product details.
- `front/topup.html` and `js/topup.js`: top-up flow.
- `front/admin.html`, `js/admin.js`, and `js/back/code.js`: admin page and promo-code functions.
- `css/style.css`: shared styles.
- `firebase-config.js`: browser Firebase app, Auth, and Firestore initialization.

HTML pages load JavaScript with `type="module"`. Preserve the existing relative import paths when moving or adding files.

## Local development

Serve the repository root over HTTP so browser module imports work; do not open the HTML files with `file://`.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. Other pages are under `/front/`, for example `/front/login.html` and `/front/admin.html`. The page also relies on network access for Firebase and Tailwind CDN assets.

## Validation

There are no configured build or test commands. For a change, run `git diff --check`, start the local HTTP server, and smoke-test the affected page in a browser. Do not claim automated tests passed unless a test suite has actually been added and run.

## Project-specific guardrails

- Keep the UI and user-facing text in Thai unless the user requests another language.
- Prefer small, focused changes. Do not introduce a framework, package manager, or build tooling without asking the user first.
- Treat Firebase operations as production-connected unless a Firebase Emulator is explicitly configured. Do not run destructive writes, change authentication users, or alter production data while testing.
- `firebase-config.js` contains browser-facing Firebase project configuration. Do not add service-account files, private keys, server credentials, or other privileged secrets to the repository. Protect data with Firebase Authentication and Firestore Security Rules; a browser config is not a substitute for security rules.
- Do not weaken authentication, authorization checks, Firestore rules, or admin access controls to make a test pass.
- Before finishing, summarize changed files and any validation actually performed.
