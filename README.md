# FireOxine

A fire-safety e-commerce site: certified extinguishers and allied equipment,
catalogued by product family **and** by the hazard being protected.

Built on the page architecture of https://jbayurveda.in/ at the client's
direction — the same section sequence, header, footer and route structure — in
an original visual world (see `DESIGN.md`).

## Three apps

FireOxine is a small monorepo of three separately deployable Next.js apps and
two shared packages.

```
apps/
  api/      :3002  the ONLY service with database access; also serves media
  web/      :3000  the storefront, an HTTP client of the API
  admin/    :3001  the back office, an HTTP client of the API
packages/
  types/           the API contract: DTOs, enums, money and label helpers
  ui/              the design system: globals.css, theme, shared primitives
prisma/            schema, seed, imported catalogue
```

The rule that holds the shape: **only `apps/api` imports Prisma.** The
storefront and the back office reach the catalogue over HTTP and share nothing
but the two packages. That buys three things — the back office can be kept off
the public internet entirely, the storefront can be scaled without scaling
database connections, and the filtering, pricing and stock rules exist in one
place rather than two.

## Running it

```bash
npm install
npm run db:reset      # creates prisma/dev.db, restores images, seeds catalogue
npm run dev           # runs all three apps together
```

Then: storefront on <http://localhost:3000>, back office on
<http://localhost:3001>, API on <http://localhost:3002>.

Run one at a time with `npm run dev:api`, `dev:web` or `dev:admin` — but the
API has to be up for the other two to show anything, because they have no
other source of data.

Each app reads its own `.env`; see `.env.example` for what each one needs.
Nothing external is required: SQLite file database, credential auth, local
file uploads. No API keys, no third-party accounts.

> **Never run `npm run build` while `npm run dev` is live.** It overwrites
> `.next` underneath the dev servers and corrupts their module graphs. Use
> `npm run build:check`, which builds into `.next-check` instead.

### Sign-ins created by the seed

| Role     | Email                  | Password       | Where            |
| -------- | ---------------------- | -------------- | ---------------- |
| Admin    | `admin@fireoxine.in`   | `admin1234`    | `:3001` (admin)  |
| Customer | `customer@example.com` | `customer1234` | `:3000` (web)    |

Change both before this goes anywhere public.

**The two sign-ins are separate.** The API issues a scoped token: an
`admin`-scoped token is only minted for a user whose role is `ADMIN`, and an
admin route rejects a `web`-scoped token even when it belongs to an admin. Each
app stores its token in its own httpOnly cookie (`fx_admin_session` /
`fx_web_session`) on its own origin, so neither session can be replayed against
the other. The browser never holds a token, and never calls the API directly.

## The catalogue

The seed loads the **real Fire Oxine Safety Industries catalogue**, imported
from the company's live listing at https://www.fireoxinesafetyindustries.in/ —
132 products across 7 families, with their own descriptions, specification
tables, prices and 270 photographs.

```bash
npm run images:fetch   # restore apps/api/public/uploads (gitignored)
npm run db:seed        # load categories, products, images, settings
```

The API serves those files at `/uploads`, and both front ends render them from
`NEXT_PUBLIC_MEDIA_URL` — so there is one copy on disk and no sync step
between three deployments.

`npm run db:reset` does both, in that order. Product data lives in
`prisma/catalogue-data.ts`; it is generated, so edit through the **back
office** rather than by hand.

What is **not** from the source listing, and why:

- **Fire-class coverage and prohibition** are derived from each product's
  extinguishing medium using the IS 2190 rules in `prisma/seed.ts`. The source
  states classes only loosely, and this is the safety-critical claim on the
  page, so it is not trusted from listing copy.
- **The hazard axis** (`/hazard`) is this site's own; products are mapped onto
  it at import.
- **Stock figures** are provisional — the source quotes none. Set them in admin.
- **`contact.email`** is a placeholder. The source publishes a phone number and
  an enquiry form, no address. Confirm it before launch; it is rendered in the
  footer and on `/contact`.
- **No ISI mark or licence number is claimed** for any product. The source
  advertises none, so `isIsiMarked` is false throughout; set it per product
  against the real BIS licence.

Six products the source lists as *Price on Request* are seeded **inactive**
rather than shown with an invented price. Price them in admin and switch them
on.

### About page

`/about` carries the company profile — story, why us, infrastructure, quality,
team, clientele, brands, the ISO certificate and the full registered factsheet
— all of it from the source profile page. None of it is hardcoded: it lives in
`SiteSetting` under the **About page** and **Company factsheet** groups and is
editable in the back office at `/settings`. List fields take one item per line; the story
field takes a blank line between paragraphs.

## Placeholder artwork

The original illustrated placeholders — 15 product renders and 12 collection
banners drawn by `tools/artwork/`, colour-coded to each extinguishing medium —
predate the real import and are no longer attached. They remain in
`public/placeholders/` for reference; see
[PLACEHOLDER-ARTWORK.md](PLACEHOLDER-ARTWORK.md).

## Adding or replacing product photography

Imported photographs land in `apps/api/public/uploads/` and are referenced by
database row, so no code change is needed to add, replace or remove one.

1. Sign in at **<http://localhost:3001>**. The dashboard leads with a count of
   products that still have no photograph.
2. **Products → any product → Photographs.** Drag files in or use the picker.
   JPEG, PNG, WebP or AVIF, up to 8 MB each, multiple at once.
3. The first image uploaded becomes the **primary** — the one used on cards,
   listings and the cart. Change it any time with *Set primary*.
4. **Collections** does the same for product-family artwork.

Where a product has no image at all, the design holds that state on purpose: a
stencilled newsprint plate carrying the SKU, which reads as awaiting its
photograph rather than as a broken box.

## Routes and layout

Each app is rooted at `/`, so the back office is `/products`, not
`/admin/products` — it is its own deployment now, not a section of the site.

**Storefront** (`apps/web`, :3000) — `/` · `/shop` · `/shop/all` ·
`/shop/[category]` · `/hazard` · `/hazard/[slug]` · `/product/[slug]` ·
`/about` · `/partner` · `/contact` · `/account` · `/cart` · `/checkout` ·
`/order/[orderNumber]`

`/hazard` is this project's equivalent of the reference site's
"shop by concern".

**Back office** (`apps/admin`, :3001) — `/login` · `/` · `/products`
(+ `/new`, `/[id]`) · `/categories` · `/orders` · `/enquiries` · `/settings`

Every authenticated page sits inside the `(dash)` route group, whose layout
holds the guard — so a new page cannot be added unprotected by accident.

**API** (`apps/api`, :3002) — the whole contract:

```
/api/health
/api/auth/login | register | me
/api/shell                            everything the storefront layout needs
/api/settings · /api/faqs
/api/catalogue/home                   the whole home page in one call
/api/catalogue/products[/:slug]       list + facets, or detail + related
/api/catalogue/categories[/:slug]     list, or category + products + facets
/api/catalogue/hazards[/:slug]        the same, on the hazard axis
/api/catalogue/fire-classes
/api/cart · /api/cart/items[/:id] · /api/cart/merge
/api/wishlist · /api/wishlist/toggle
/api/orders[/:orderNumber] · /api/account
/api/forms/contact | partner | newsletter
/api/admin/stats | taxonomy | products | variants | images | categories
         | orders | enquiries | settings          (ADMIN + admin scope only)
```

Every route answers in one envelope — `{ ok: true, data }` or
`{ ok: false, error }` — so a client never has to infer meaning from a status
code alone.

### Why some routes bundle several queries

`/api/shell` and `/api/catalogue/home` each return what a whole page needs.
Over a function call, six queries cost nothing much; over HTTP they are six
round trips on the site's busiest pages. Bundling those two is the deliberate
exception to one-resource-per-route.

### Where the client/server line falls

Client components never call the API. They call a server action in their own
app, which reads the httpOnly cookie and calls the API with it. That keeps the
token out of JavaScript entirely and means neither front end needs CORS. The
one exception is `apps/admin/src/app/api/upload/route.ts`, a credential-
attaching proxy for the file picker — a browser cannot attach an httpOnly
cookie to a cross-origin upload, so that request is forwarded server-side. It
streams the form through untouched; the API still does all the validation.

## How the data model earns its keep

- **Money is integer paise everywhere.** Never a float. Prices are entered in
  rupees in admin and converted at the boundary.
- **`ProductFireClass` records coverage *and* prohibition.** `covers: false`
  publishes an explicit "never use on" warning. A class simply left out means
  "no claim made", which is deliberately different from a prohibition —
  flattening those two together is how a catalogue gets someone hurt.
- **Electrical safety is not a fire class.** Under IS 2190 the classes are A,
  B, C, D and K, and "electrical" is a hazard condition. It is modelled as
  `safeOnLiveElectrical` plus an optional kV rating, never as a letter.
- **Order lines are denormalised on purpose.** Product name, variant label,
  SKU and unit price are copied onto `OrderItem`, and the shipping address is
  copied onto `Order`, so an invoice still reads correctly after the catalogue
  is renamed, repriced, or the customer edits their address book.
- **Checkout is one transaction.** Order, lines, stock decrement and cart
  clear all commit together or not at all.
- **Site copy lives in `SiteSetting`**, editable at `/settings` in the back
  office, so the phone number and hero words change without a deploy.

## Before this goes live

- [ ] Change both seeded passwords, and set a real `AUTH_SECRET` — the API
      refuses to start without one, and it signs every session token.
- [ ] **Do not expose `apps/admin` publicly.** Put it behind a VPN or an IP
      allowlist. The compose file binds it to `127.0.0.1` for that reason.
- [ ] Set `API_URL` on web and admin to the API's internal address, and
      `NEXT_PUBLIC_MEDIA_URL` to the address a visitor's browser can reach it
      at. They are usually not the same host.
- [x] The catalogue is the company's real product range, imported from its
      live listing. Fire-class and standard data remains accurate domain fact.
- [ ] Set real **stock** figures and price the six *Price on Request* products
      in the back office; they ship inactive. SKUs are generated (`FX-EXT-001`…) —
      replace them if the company uses its own codes.
- [x] Real contact details, GST number and IEC are seeded from the company
      profile. **Still to confirm: the email address** — the source publishes
      none, so `contact.email` is a placeholder.
- [ ] Add the real BIS licence numbers. **Nothing in this build invents a
      certification number, test result or approval**, and nothing should.
- [ ] **The ISO 9001:2015 certificate on `/about` expired on 07-Oct-2020.** It
      is printed with both dates and labelled as lapsed, because showing it as
      current would be a false certification claim. Replace the three
      `about.iso*` settings with the renewed certificate, or clear
      `about.isoStandard` to drop the panel entirely.
- [ ] Wire a payment gateway. Checkout currently places an order and confirms
      by phone; no payment is taken.
- [ ] Send transactional email. **Nothing sends email today** — no order
      confirmation to the customer, no new-enquiry alert to you. The order
      page deliberately promises a phone call rather than an email, because
      that is what actually happens; change that copy when email exists.
- [ ] Rate-limit sign-in and the contact, partner and newsletter forms. There
      is no throttling, so all four are open to spam and credential stuffing.
- [ ] Create a migration history. The schema was applied with `prisma db push`
      and `prisma/migrations/` is empty; run `prisma migrate dev` once against
      the final schema before the first deploy so production has a migration
      path.
- [ ] Add a cleanup job for orphaned guest carts (`CartItem` rows with a
      `sessionId` whose cookie has expired).
- [ ] Move uploads to object storage if deploying to a platform with an
      ephemeral filesystem (Vercel included) — `public/uploads` will not
      survive a redeploy there.
- [ ] Switch `datasource db` to `postgresql` for production.
