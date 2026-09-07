# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript + Tailwind v4 + shadcn-style tokens on the frontend; Prisma ORM with SQLite for local development and Postgres for production; Auth.js (credentials) with role-based access for customer and admin. Chosen by the user from an offered set, to mirror the reference site's frontend stack while keeping the backend self-contained and runnable with no external accounts.

## Users

- **Primary — the safety buyer.** A facilities manager, building society secretary, restaurant or factory owner in India who must equip or re-equip a premises with fire extinguishers. They arrive under a compliance deadline or after an inspection, need to know which class of extinguisher suits their hazard, and need proof the product is certified. They are not fire professionals; they are people made responsible for fire safety.
- **Secondary — the trade partner.** Retailers, distributors, electrical and safety contractors, and AMC service firms buying in volume. They arrive at the partner route, care about MOQ, wholesale pricing, certification paperwork, and supply reliability.
- **Tertiary — the returning account holder.** Reorders refills and additional units, tracks orders, keeps addresses and past purchases.

## Product Purpose

FireOxine sells fire extinguishers and allied fire-safety equipment direct to businesses and households, with a catalogue organised by fire class and hazard rather than by SKU jargon. Success is a buyer who arrives not knowing whether they need ABC dry powder or CO2, and leaves having bought the correct, certified unit for their actual premises.

## Positioning

The catalogue is navigable two ways at once: by product family (the way a supplier thinks) and by hazard — kitchen, server room, vehicle, workshop, warehouse (the way a buyer thinks). The buyer does not have to already know the answer to find it. Certification and fire-class fitness are treated as primary product data shown on the card, not as fine print buried in a spec sheet.

## Operating Context

- Buying is often triggered externally: a fire-department inspection, an insurance renewal, a licence condition, a society AGM resolution. Urgency and compliance language are part of the real scene.
- Extinguishers are rated by fire class (A, B, C, D, K/F) and by extinguishing medium (ABC dry powder, CO2, foam/AFFF, water, clean agent, wet chemical). Capacity is in kilograms or litres. This vocabulary is load-bearing and must be correct throughout.
- Indian market: pricing in INR, BIS/ISI certification is the recognised trust mark, GST applies and is quoted inclusive.
- Products need periodic refilling and pressure testing, so customers return. Order history matters.
- Photography of the actual products does not exist yet. All product imagery will be uploaded by the client through the admin panel after handover.

## Capabilities and Constraints

**Confirmed functionality (mirroring the reference architecture at jbayurveda.in):**
- Public: home, shop index, category listing, all-products listing with filters, product detail with variant/capacity selection, shop-by-hazard, about, partner (B2B enquiry), contact, account.
- Commerce: cart, checkout, order placement, customer accounts, order history, wishlist/save-for-later.
- Admin: authenticated back office for products, variants, categories, hazards, orders, enquiries, and — specifically required — product image upload.
- Light and dark theme toggle, as the reference has.

**Constraints:**
- No product photography at build time. Every product image must degrade to a designed placeholder that does not look broken, and must be replaceable through admin upload without a code change.
- Must run locally with no third-party accounts or API keys.
- Fire-class and certification claims are product facts; do not invent certification numbers, test results, or approvals.

**Explicitly undecided:** payment gateway (checkout is built to place orders; no live payment processor is wired), shipping-rate logic, real company address and phone.

## Brand Commitments

- Name: **FireOxine**, chosen by the user.
- Page architecture and layout are modelled on https://jbayurveda.in/ at the user's explicit direction: centred-logo header with split navigation, theme toggle, cart; hero with large stacked display type; category collection cards; about section with oversized outline type; category grid; per-category product rails; marquee statement strip; FAQ accordion; three-column footer under an oversized animated wordmark.

## Evidence on Hand

None. There is no real company data: no customers, testimonials, press, certifications, benchmarks, real address, or product photography. Catalogue content authored for this build is illustrative and must be labelled as such at handover. Fire-class and extinguishing-medium information is general domain fact, not a company claim, and is accurate.

## Product Principles

1. **The buyer does not know the vocabulary.** Every place a fire class or medium appears, it is legible to someone learning it here. Never make correct selection depend on prior expertise.
2. **Certification is a product attribute, not a footnote.** ISI/BIS marks, fire-class ratings, and capacity ride on the card, the listing, and the detail page.
3. **Two doors to the same catalogue.** Product family and hazard are equal-status navigation, never a primary and an afterthought.
4. **The image is not the product.** The design must be complete and convincing before a single photograph exists, because none will exist until after handover.
5. **Urgency without alarm.** The buying trigger is often a compliance deadline; the interface should feel calm, authoritative, and fast, never like it is shouting fire.

## Accessibility & Inclusion

Safety information must not depend on colour alone: fire-class indicators carry a letter and label, never a colour swatch by itself. Both themes must hold contrast, since the reference architecture ships a theme toggle.
