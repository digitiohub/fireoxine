# FireOxine

A fire-safety e-commerce site: certified extinguishers and allied equipment,
catalogued by product family **and** by the hazard being protected.

Built on the page architecture of https://jbayurveda.in/ at the client's
direction — the same section sequence, header, footer and route structure — in
an original visual world (see `DESIGN.md`).

## Running it

```bash
npm install
npm run db:reset      # creates prisma/dev.db, pushes schema, seeds catalogue
npm run dev
```

Nothing external is required: SQLite file database, credential auth, local
file uploads. No API keys, no third-party accounts.

### Sign-ins created by the seed

| Role     | Email                  | Password       |
| -------- | ---------------------- | -------------- |
| Admin    | `admin@fireoxine.in`   | `admin1234`    |
| Customer | `customer@example.com` | `customer1234` |

Change both before this goes anywhere public.

## Placeholder artwork

The catalogue ships with original illustrated placeholders — 15 product
renders and 12 collection banners, drawn by `tools/artwork/`, colour-coded to
each extinguishing medium. They are demo furniture, designed to be replaced.
See [PLACEHOLDER-ARTWORK.md](PLACEHOLDER-ARTWORK.md), or strip them entirely
with `npm run placeholders:off`.

## Adding product photography

Products seed with **zero** images, and the design is built to hold that: a
stencilled newsprint plate carrying the SKU, which reads as awaiting its
photograph rather than as a broken box. The illustrated placeholders sit on
top of that state for demo purposes and come off in one command.

To add real photography:

1. Sign in as the admin and open **/admin**. The dashboard leads with a count
   of products that still have no photograph.
2. **Products → any product → Photographs.** Drag files in or use the picker.
   JPEG, PNG, WebP or AVIF, up to 8 MB each, multiple at once.
3. The first image uploaded becomes the **primary** — the one used on cards,
   listings and the cart. Change it any time with *Set primary*.
4. **Collections** does the same for product-family artwork. Leaving a
   collection without artwork is a valid choice; the site sets the collection
   name at large scale on newsprint instead.

Files land in `public/uploads/` and are referenced by database row, so no code
change is ever needed to add, replace or remove an image.

## Routes and layout

```
src/app/
  (web)/        every public-facing page
  admin/        the back office
  api/          route handlers
  layout.tsx    root shell: header, footer, theme, scroll choreography
```

`(web)` is a **route group**. The parentheses are what make it one: it groups
the storefront into a single folder for navigation without appearing in any
URL. The home page stays at `/`, not `/web`. Renaming it to `web` without the
parentheses would push every public page behind a `/web/` prefix and leave
nothing at the root.

**Storefront** — `/` · `/shop` · `/shop/all` · `/shop/[category]` ·
`/hazard` · `/hazard/[slug]` · `/product/[slug]` · `/about` · `/partner` ·
`/contact` · `/account` · `/cart` · `/checkout` · `/order/[orderNumber]`

**Admin** — `/admin` · `/admin/products` (+ `/new`, `/[id]`) ·
`/admin/categories` · `/admin/orders` · `/admin/enquiries` · `/admin/settings`

`/hazard` is this project's equivalent of the reference site's
"shop by concern".

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
- **Site copy lives in `SiteSetting`**, editable at `/admin/settings`, so the
  phone number and hero words change without a deploy.

## Before this goes live

- [ ] Change both seeded passwords, and set a real `AUTH_SECRET`.
- [ ] Replace the seeded catalogue with the real product range. Names, SKUs,
      prices and stock in `prisma/seed.ts` are illustrative placeholders.
      Fire-class and standard data is accurate domain fact and can stay.
- [ ] Replace the placeholder contact details in `/admin/settings`.
- [ ] Add the real BIS licence numbers. **Nothing in this build invents a
      certification number, test result or approval**, and nothing should.
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
