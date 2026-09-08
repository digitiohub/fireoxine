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
# A local Postgres. The app runs the same engine everywhere — see below.
docker run -d --name fireoxine-pg -p 5432:5432 \
  -e POSTGRES_USER=fireoxine -e POSTGRES_PASSWORD=fireoxine \
  -e POSTGRES_DB=fireoxine postgres:16-alpine

npm install
npm run db:reset      # migrates, restores images, seeds the catalogue
npm run dev           # runs all three apps together
```

Then: storefront on <http://localhost:3000>, back office on
<http://localhost:3001>, API on <http://localhost:3002>.

Run one at a time with `npm run dev:api`, `dev:web` or `dev:admin` — but the
API has to be up for the other two to show anything, because they have no
other source of data.

Each app reads its own `.env`; see `.env.example` for what each one needs.
Beyond Postgres nothing external is required: credential auth, local file
uploads, no API keys and no third-party accounts.

**Postgres in development as well as production.** This used to be SQLite
locally. Running one engine on your laptop and another in front of customers
is how a query that passes review fails in production — the two disagree on
case sensitivity, on transaction isolation and on concurrent writes, and this
codebase depends on all three. The catalogue search is the concrete example:
`contains` compiles to a case-sensitive `LIKE` on Postgres and a
case-insensitive one on SQLite, so searching "extinguisher" would have quietly
matched nothing in production.

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

## Deploying to Coolify

Four resources: one Postgres and three applications, all built from this one
repository by picking a different Dockerfile stage.

### 1 · Postgres

**New Resource → Database → PostgreSQL.** Once it is running, open it and copy
the **internal** connection URL — the one using the service name, not
`localhost`. It looks like:

```
postgresql://postgres:<password>@<service-name>:5432/postgres
```

Keep all four resources in the **same Coolify project and environment**, so
they share a Docker network and can address each other by service name. The
database never needs a public port.

### 2 · The API

**New Resource → Application → your Git repository.**

| Setting | Value |
| --- | --- |
| Build Pack | `Dockerfile` |
| Dockerfile Location | `/Dockerfile` |
| Docker Build Stage Target | `api` |
| Ports Exposes | `3002` |

Environment variables:

```
DATABASE_URL=postgresql://postgres:<password>@<service-name>:5432/postgres
AUTH_SECRET=<openssl rand -base64 32>
```

**Storages → Add.** Mount a persistent volume at:

```
/app/apps/api/public/uploads
```

Without it, every redeploy destroys every photograph the client has uploaded.
This is the single most important setting on the page.

Give the API a domain only if you want media served from a nice hostname — you
do, because visitors' browsers load images directly from it. Something like
`api.fireoxine.in`.

### 3 · The storefront and the back office

Two more applications from the same repository, identical except for the
target, port and variables.

| | web | admin |
| --- | --- | --- |
| Docker Build Stage Target | `web` | `admin` |
| Ports Exposes | `3000` | `3001` |
| Domain | `fireoxine.in` | `admin.fireoxine.in` |

```
# web
API_URL=http://<api-service-name>:3002
NEXT_PUBLIC_MEDIA_URL=https://api.fireoxine.in

# admin
API_URL=http://<api-service-name>:3002
NEXT_PUBLIC_MEDIA_URL=https://api.fireoxine.in
WEB_URL=https://fireoxine.in
```

Those two URLs are **not interchangeable and rarely the same host**:

- `API_URL` is server-to-server, inside Coolify's network. Internal name, plain
  HTTP, no public exposure needed.
- `NEXT_PUBLIC_MEDIA_URL` is baked into the HTML and resolved by the visitor's
  browser. It must be publicly reachable over HTTPS, or every product image
  breaks while the pages themselves look fine.

`NEXT_PUBLIC_*` variables are inlined at **build** time, not read at run time,
so changing it means redeploying web and admin — restarting them is not enough.

**Restrict the admin app.** It is a separate deployment precisely so it can be
locked down: put it behind Coolify's Basic Auth, an IP allowlist, or a VPN. The
guard in the app is a lock on the door, not the door.

### 4 · Seed the database

The build never touches a database — that is why the images can build in any
order — so migrating and seeding are one-off commands run **once**, after the
API is up. Open the API application in Coolify and use its **Terminal** (or
`Execute Command`), then:

```bash
npx prisma migrate deploy                    # create the 14 tables
npx tsx prisma/fetch-catalogue-images.ts     # 270 photographs onto the volume
npx tsx prisma/seed.ts                       # 7 categories, 132 products, settings
```

Or the same three as one command:

```bash
npm run db:provision
```

Expect roughly this back:

```
Images: 270 downloaded, 0 already present, 0 failed (270 total).
Seeded: { categories: 7, hazards: 10, fireClasses: 5, products: 132,
          variants: 132, images: 270, faqs: 14, settings: 51, users: 2 }
```

**Order matters.** Migrate before seeding, and fetch images before seeding —
the seed writes rows pointing at `/uploads/…`, and a row whose file is missing
renders the "photograph pending" plate instead of a photograph.

Then change both seeded passwords immediately: the seed creates
`admin@fireoxine.in` / `admin1234`.

### Re-seeding, and what it destroys

`prisma/seed.ts` **deletes every row it manages before inserting** — products,
categories, settings, orders and users included. It is a first-run command, not
an update. Once the client has edited copy or taken an order, do not run it
again; change things in the back office instead.

To deploy a schema change later, `npx prisma migrate deploy` on its own is the
whole step. It applies only new migrations and touches no data.

### If the image download is blocked

`fetch-catalogue-images.ts` pulls the 270 photographs from the source listing's
CDN. If your server cannot reach it, copy them up from your machine instead —
the volume is just a directory:

```bash
docker cp apps/api/public/uploads/. <api-container>:/app/apps/api/public/uploads/
```

Then run the migrate and seed steps as above, skipping the fetch.

### Health check

```
GET https://api.fireoxine.in/api/health
→ {"ok":true,"data":{"service":"fireoxine-api","products":132,...}}
```

A `products` count of 0 means the seed has not run. A 500 means `DATABASE_URL`
is wrong or the migration has not been applied.

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
- [ ] Back up Postgres and the uploads volume. Coolify can schedule database
      backups; the volume is not covered by them and holds every photograph.
- [ ] Wire a payment gateway. Checkout currently places an order and confirms
      by phone; no payment is taken.
- [ ] Send transactional email. **Nothing sends email today** — no order
      confirmation to the customer, no new-enquiry alert to you. The order
      page deliberately promises a phone call rather than an email, because
      that is what actually happens; change that copy when email exists.
- [ ] Rate-limit sign-in and the contact, partner and newsletter forms. There
      is no throttling, so all four are open to spam and credential stuffing.
- [x] Migration history exists in `prisma/migrations/`, applied in production
      with `prisma migrate deploy`.
- [ ] Add a cleanup job for orphaned guest carts (`CartItem` rows with a
      `sessionId` whose cookie has expired).
- [ ] Move uploads to object storage if deploying to a platform with an
      ephemeral filesystem (Vercel included) — `apps/api/public/uploads` will not
      survive a redeploy there.
