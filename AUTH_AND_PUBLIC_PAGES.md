# Auth Requirements and Public/Protected Pages

This document summarizes the authentication requirements and which pages are currently public vs. protected in this project.

## Authentication Requirements (Backend)

The frontend router guard checks `accessToken` and `userData` cookies to decide if a user is logged in. For a production setup, your backend should provide endpoints that set these values on successful login.

Required endpoints:
1. `POST /auth/login`
   - Purpose: authenticate user and issue a token.
   - Expected response: token + user profile (role, id, etc.).
2. `POST /auth/register`
   - Purpose: create a user account.
3. `POST /auth/logout`
   - Purpose: invalidate the session/token (optional but recommended).

Important frontend behavior:
- Any route with `meta.public: true` is accessible without login.
- Routes with `meta.unauthenticatedOnly: true` are for guests only (login/register pages).
- All other routes require login and will redirect to `login` if not authenticated.

## Current Public Pages (No Login Required)

These pages explicitly set `meta.public: true`:
- `src/pages/front-pages/landing-page/index.vue`
- `src/pages/front-pages/features.vue`
- `src/pages/front-pages/pricing.vue`
- `src/pages/front-pages/ai-guide.vue`
- `src/pages/front-pages/contact.vue`
- `src/pages/front-pages/help-center/index.vue`
- `src/pages/front-pages/help-center/article/[title].vue`
- `src/pages/front-pages/checkout.vue`
- `src/pages/front-pages/payment.vue`

## Protected Pages (Login Required)

Any page **without** `meta.public: true` is protected by default.

Professional recommendation:
- Keep marketing pages public (landing, features, pricing, help).
- Require login for checkout/payment, dashboards, subscriptions, orders, customer portal, and any user data.

To make a page protected:
- Remove `public: true` from its `meta` definition (or don’t add it).

To make a page public:
- Add `public: true` in its `definePage({ meta: { ... } })`.

