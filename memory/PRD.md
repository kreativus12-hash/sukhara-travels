# Sukhara Travels and Tourism — PRD

## Original problem statement
Build a complete professional travel and tourism website for Sukhara Travels and Tourism (sukharatravels.com), an Indian travel agency and tour operator (domestic + international holidays, customized trips, honeymoon, family, group/corporate). Real functional business website, staged delivery: Stage 1 public homepage, Stage 2 backend + DB integration, Stage 3 secure admin panel. Premium brand: deep navy, travel blue, orange/gold accents; no generic template look; public site must never be broken by later stages.

## Architecture
- React frontend (CRA/craco, Tailwind + custom CSS), FastAPI backend (MongoDB Motor), JWT auth via HttpOnly cookies (15-min access + 7-day refresh).
- Public routes: `/`, `/destinations/:slug`, `/packages/:slug` — all DB-driven.
- Admin app: `/admin/*` — isolated React sub-app (`src/admin/`), own layout/sidebar/design system; public code untouched.
- Backend: `/api/*` public routes; `/api/admin/*` protected by admin role dependency; generic CRUD factory + custom package/itinerary endpoints.

## User personas
- Prospective traveller: browses destinations/packages, submits trip enquiries, WhatsApps the agency.
- Admin (business owner): manages all website content, triages enquiries, updates settings.

## Core requirements (static)
Public marketing site, DB-driven content, enquiry capture, secure admin CMS for destinations/packages/itineraries/gallery/testimonials/FAQs/blog/enquiries/contacts/settings, WhatsApp integration, responsive everywhere.

## Implemented
- 2026-09 (Stage 1): Premium public homepage — hero, trip planner form, destinations, packages, why-us, categories, CTAs, inspiration, footer. Fully responsive.
- 2026-09 (Stage 2): FastAPI + MongoDB; schemas for destinations, packages, itineraries, enquiries, contacts, settings; seed data; public pages wired to DB; enquiry + contact forms persist; JWT cookie auth with brute-force lockout + admin seed.
- 2026-09-28 (Stage 3): Secure admin panel at `/admin`:
  - Login screen, protected routes, auto session refresh (`/api/auth/refresh`), logout.
  - Dashboard: 8 live stat cards, recent enquiries, recent contact messages, quick actions.
  - Enquiries: status filters, search, detail drawer, status + internal notes, quick call/WhatsApp/email, delete.
  - Contact messages: list, view modal, read/replied status, delete, quick actions.
  - Destinations, Testimonials, FAQs, Gallery, Blog: full CRUD (generic engine) with publish/featured toggles.
  - Packages: full CRUD + day-by-day itinerary builder (add/remove/reorder days, meals/stay/activities).
  - Website settings: brand, contact, social, SEO — live on public site instantly.
  - Backend: all `/api/admin/*` CRUD endpoints, stats endpoint, seed fix (no longer reverts admin edits on restart).

## Verified
- All admin endpoints via curl (CRUD round-trips, public sync, 401 without auth).
- Browser flows: login → dashboard → enquiry status change (persisted, badge updated) → package editor with 5-day itinerary → settings → logout → login screen. Mobile 375px hamburger sidebar. UI testimonial create/delete. Public homepage intact (8 destinations, 4 packages).

- 2026-09-28 (Stage 4A): CRM enhancement:
  - Lead records extended: lead_id (ST-YYYY-NNNN), adults/children, package_title, follow_up_date/note, append-only internal notes, timeline events, possible_duplicate flag (same phone/email kept as separate leads with admin warning).
  - New status set: New, Contacted, Follow-up, Quotation Sent, Confirmed, Closed, Lost (legacy quoted/booked migrated on startup).
  - Enquiry list: search by name/phone/email/lead ID + filters for status, destination, package, holiday type, date.
  - Detail drawer: Customer / Trip / Enquiry / Lead Management / Internal Notes / Timeline sections.
  - Dashboard: per-status pipeline chips, upcoming + overdue follow-up cards (overdue = past date & not closed/confirmed/lost).
  - Public planner: email field, phone/email validation, double-submit guard, lead reference in success message; destination/package context auto-attached from detail pages; customized-trip CTA sets source "Customized Trip".

- 2026-09-28 (Stage 5A): Public content & travel experience pages:
  - New public pages: /blog (+/blog/:slug articles with related posts), /gallery (lightbox + category filters), /testimonials (DB-driven, sample/demo clearly labelled), /faq (grouped accordion), /about (claim-free story/mission/values/process), /contact (settings-driven details + working form), /customized-trips (full enquiry form, source "Customized Trip"), /honeymoon, /family-holidays, /corporate-group-travel (group enquiry form, source "Corporate / Group Travel").
  - Shared component library extracted to src/components/public.js (Navbar with Explore/More dropdowns, settings-driven Footer, PlannerForm, cards, PageCta). App.js now routes 14 public pages; homepage/detail pages unchanged in behaviour.
  - Backend v5: blog model extended (category, author, SEO), gallery + destination field, testimonials + photo/date/sample flag, enquiry + hotel/transport/special-requirements fields, public GET /api/blog-posts/{slug} with related posts, seed content for blog (3 articles), FAQs (6), gallery (8) — seeds insert only when collections are empty.
  - Internal linking: package → destination guide, homepage category cards → new pages, journal links → /blog.
  - Note: Honeymoon/Family package sections read from packages by category — tag packages in admin to populate them.

## Backlog (prioritized)
- P1: Logo from settings used in public navbar/footer (currently text brand mark).
- P2: Enquiry email notifications (Resend) on new enquiry.
- P2: Admin password change inside settings.
- P2: Blog public pages (`/blog`, `/blog/:slug`).
- P2: Image upload to object storage instead of URL paste.
- P3: Forgot/reset password flow (endpoints scaffolded in playbook).
