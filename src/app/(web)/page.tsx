import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Instagram } from 'lucide-react';
import { db } from '@/lib/db';
import { getSettings, setting } from '@/lib/settings';
import { getProductCards } from '@/lib/queries';
import { Marquee } from '@/components/site/Marquee';
import { SectionHead } from '@/components/site/SectionHead';
import { Accordion } from '@/components/site/Accordion';
import { ProductRail } from '@/components/product/ProductRail';
import { ClassPanel, ClassLegend } from '@/components/product/ClassPanel';
import { CategoryGrid } from '@/components/site/CategoryGrid';
import { HorizontalTravel } from '@/components/site/HorizontalTravel';

export default async function HomePage() {
  const [settings, categories, hazards, fireClasses, faqs] = await Promise.all([
    getSettings(),
    db.category.findMany({ where: { isActive: true }, orderBy: { position: 'asc' } }),
    db.hazard.findMany({ where: { isActive: true }, orderBy: { position: 'asc' } }),
    db.fireClass.findMany({ orderBy: { position: 'asc' } }),
    db.faq.findMany({
      where: { isActive: true, group: 'GENERAL' },
      orderBy: { position: 'asc' },
    }),
  ]);

  // Rails are chosen by how much they actually have to show. A rail built
  // from a category with one product is a single card adrift in an empty
  // row, which reads as a loading failure rather than a small range.
  const allRails = await Promise.all(
    categories.map(async (category) => ({
      category,
      products: await getProductCards({ categoryId: category.id }, 8),
    }))
  );
  const rails = allRails
    .filter((rail) => rail.products.length >= 2)
    .sort((a, b) => b.products.length - a.products.length)
    .slice(0, 4);

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      {/*
        The wedge holds the red and it holds meaning: the five fire classes,
        reversed out at architectural scale. Earlier this was a half-page red
        field behind the headline, which broke the rationing rule the whole
        world rests on and dropped the sub-line and the primary action onto an
        unreadable ground. The type now sits on newsprint where it belongs.
      */}
      <section className="relative overflow-hidden border-b border-rule">
        <div aria-hidden="true" className="fx-newsprint pointer-events-none absolute inset-0" />

        <div className="relative mx-auto grid max-w-[1600px] items-center gap-12 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div className="px-4 pb-4 pt-16 sm:px-6 sm:pt-20 lg:py-20 lg:pl-10 lg:pr-0">
            <h1 className="fx-stagger fx-display text-[clamp(3.25rem,11vw,8.5rem)]">
              <span className="block" data-fx="arrive">
                {setting(settings, 'home.heroLine1')}
              </span>
              <span className="block" data-fx="arrive">
                {setting(settings, 'home.heroLine2')}
              </span>
              <span className="block" data-fx="arrive">
                {setting(settings, 'home.heroLine3')}
              </span>
            </h1>

            {/*
              The hero lead is the second voice, not a caption. It was set in
              --ink-muted, the token for secondary metadata, which measured a
              passing 5.77:1 but read faint beside a 130px display headline and
              lost further ground against the newsprint tooth behind it.
              Contrast was never the failure; hierarchy was. Full ink, a
              tighter measure, and slightly closer leading make it read as the
              sentence that explains the headline.
            */}
            <p
              className="mt-7 max-w-[40ch] text-lg font-medium leading-snug text-ink sm:text-xl"
              data-fx="arrive"
              style={{ '--fx-i': 3 } as React.CSSProperties}
            >
              {setting(settings, 'home.heroSub')}
            </p>

            <div
              className="mt-9 flex flex-wrap items-center gap-4"
              data-fx="arrive"
              style={{ '--fx-i': 4 } as React.CSSProperties}
            >
              <Link href="/shop/all" className="fx-wedge">
                Shop all products
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/hazard" className="fx-wedge-ghost">
                Find by hazard
              </Link>
            </div>

            <dl
              className="fx-num mt-12 flex flex-wrap gap-x-10 gap-y-5 border-t border-rule pt-6 text-sm"
              data-fx="arrive"
              style={{ '--fx-i': 5 } as React.CSSProperties}
            >
              <div>
                <dt className="fx-stencil text-[0.6rem] text-ink-faint">Product families</dt>
                <dd className="fx-display mt-1.5 text-3xl">{categories.length}</dd>
              </div>
              <div>
                <dt className="fx-stencil text-[0.6rem] text-ink-faint">Hazards mapped</dt>
                <dd className="fx-display mt-1.5 text-3xl">{hazards.length}</dd>
              </div>
              <div>
                <dt className="fx-stencil text-[0.6rem] text-ink-faint">Built to</dt>
                <dd className="fx-display mt-1.5 text-3xl">IS 15683</dd>
              </div>
            </dl>
          </div>

          {/* The wedge. Drives in from the right, carrying the classes. */}
          <div className="fx-drive relative self-stretch bg-wedge lg:[clip-path:polygon(14%_0,100%_0,100%_100%,0_100%)]">
            <div className="flex h-full flex-col justify-center gap-1 px-4 py-12 sm:px-6 lg:py-20 lg:pl-[18%] lg:pr-10">
              <p className="fx-stencil mb-4 text-[0.65rem] text-wedge-ink/75">
                Fire is classified by what is burning
              </p>
              <ul className="fx-stagger">
                {fireClasses.map((fc) => (
                  <li
                    key={fc.id}
                    className="flex items-baseline gap-4 border-t border-wedge-ink/20 py-3 last:border-b sm:gap-6"
                    data-fx="car"
                  >
                    <span className="fx-display w-[1.1em] shrink-0 text-[clamp(2.25rem,6vw,3.75rem)] leading-none text-wedge-ink">
                      {fc.code}
                    </span>
                    <span className="min-w-0">
                      <span className="fx-display block text-base leading-tight text-wedge-ink sm:text-lg">
                        {fc.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-wedge-ink/80">
                        {fc.example}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ collection rail */}
      <section className="border-b border-rule py-16 sm:py-20">
        <HorizontalTravel
          itemCount={categories.length}
          head={
            <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10">
              <SectionHead
                title="Collections"
                lede="Twelve product families, from the general-purpose ABC unit to the fixed installations a building inspection expects to find."
                action={
                  <Link href="/shop" className="fx-wedge-ghost">
                    All collections
                  </Link>
                }
              />
            </div>
          }
        >
          {categories.map((category) => (
            <li
              key={category.id}
              className="w-[72vw] shrink-0 snap-start sm:w-[38vw] lg:w-[23rem]"
            >
              <Link
                href={`/shop/${category.slug}`}
                className="group flex h-full flex-col justify-between border border-rule bg-ground-raised p-6 transition-colors duration-200 hover:border-ink"
              >
                <div>
                  <h3 className="fx-display text-2xl leading-tight">{category.name}</h3>
                  {category.tagline && (
                    <p className="fx-stencil mt-2 text-[0.6rem] text-wedge">{category.tagline}</p>
                  )}
                  <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                    {category.description}
                  </p>
                </div>
                <span className="fx-stencil mt-8 inline-flex items-center gap-2 text-[0.65rem] text-ink">
                  View collection
                  <ArrowRight
                    className="size-3.5 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          ))}
        </HorizontalTravel>
      </section>

      {/* ----------------------------------------------------------- about */}
      <section className="border-b border-rule py-20 sm:py-28">
        <div className="mx-auto grid max-w-[1600px] gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-10">
          <div>
            <p
              aria-hidden="true"
              className="fx-display text-[clamp(4rem,13vw,11rem)] leading-[0.82] text-ink/10"
              data-fx="arrive"
            >
              ABOUT
              <br />
              US
            </p>
          </div>
          <div
            className="border border-rule bg-ground-raised p-8 sm:p-10"
            data-fx="car"
            style={{ '--fx-i': 1 } as React.CSSProperties}
          >
            <h2 className="fx-display text-3xl leading-[1.05] sm:text-4xl">
              We would rather sell you one correct extinguisher than three wrong ones.
            </h2>
            <div className="mt-8 space-y-5 text-[0.95rem] leading-relaxed text-ink-muted">
              <p>
                FireOxine supplies certified fire extinguishers and allied safety equipment to
                businesses, housing societies and households across India. Every unit we list is
                built to a named Indian Standard, and every product page states the fire classes it
                is rated for — and the ones it must never be used on.
              </p>
              <p>
                Most people arrive here because an inspection, an insurer or a licence condition has
                made fire safety their responsibility for the first time. They should not need to
                already know the difference between a Class B and a Class K fire in order to buy
                the right thing. So the catalogue opens two ways: by what the product is, and by
                what is actually at risk.
              </p>
            </div>
            <Link href="/about" className="fx-wedge-ghost mt-8">
              Read our approach
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- category grid */}
      <section className="border-b border-rule py-16 sm:py-20">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <SectionHead
            title={
              <>
                Everything a premises
                <br />
                is required to carry
              </>
            }
            lede="Portable extinguishers, fixed installations, detection, signage and the gear that goes with them."
            align="centre"
          />
          <CategoryGrid categories={categories} className="mt-12" />
        </div>
      </section>

      <Marquee text={setting(settings, 'home.marquee')} />

      {/* ------------------------------------------------- the class panel */}
      <section className="border-b border-rule py-20 sm:py-28">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <SectionHead
            title="Five classes. Start here."
            lede="Fire is classified by what is burning, and the wrong agent on the wrong class makes things worse rather than better. Every product on this site declares both what it covers and what it must not touch."
          />

          {/* Depth is a pointer affordance only. These cells carry no action,
              so making them focusable would add five tab stops that do
              nothing — and nothing is hidden behind the hover, so a keyboard
              reader loses no information by not having it. */}
          <ul className="fx-depth-row fx-stagger mt-12 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-5">
            {fireClasses.map((fc) => (
              <li
                key={fc.id}
                className="fx-depth relative flex flex-col gap-4 bg-ground-raised p-6"
                data-fx="car"
              >
                <span className="fx-display grid size-14 shrink-0 place-items-center border-2 border-ink bg-ink text-2xl text-ground">
                  {fc.code}
                </span>
                <div>
                  <h3 className="fx-display text-lg leading-tight">{fc.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{fc.description}</p>
                  <p className="fx-stencil mt-4 text-[0.6rem] text-ink-faint">For example</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{fc.example}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
            <ClassLegend />
            <Link href="/hazard" className="fx-wedge">
              Match a class to my premises
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- product rails */}
      <section className="border-b border-rule py-16 sm:py-20">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <SectionHead
            title="In stock now"
            lede="Dispatched within three to five working days, anywhere in India."
          />
          <div className="mt-6 divide-y divide-rule">
            {rails.map(({ category, products }) => (
              <ProductRail
                key={category.id}
                title={category.name}
                href={`/shop/${category.slug}`}
                products={products}
              />
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- hazards */}
      <section className="border-b border-rule py-20 sm:py-28">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <SectionHead
            title="What are you protecting?"
            lede="The other door into the catalogue. Pick the room, and we will show you what belongs in it and what must stay out."
            action={
              <Link href="/hazard" className="fx-wedge-ghost">
                All hazards
              </Link>
            }
          />

          <ul className="fx-stagger mt-12 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-5">
            {hazards.map((hazard) => (
              <li key={hazard.id} data-fx="car">
                <Link
                  href={`/hazard/${hazard.slug}`}
                  className="group flex h-full flex-col gap-2 bg-ground-raised p-6 transition-colors duration-200 hover:bg-ground-sunk"
                >
                  <h3 className="fx-display text-lg leading-tight transition-colors group-hover:text-wedge">
                    {hazard.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-muted">{hazard.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------ brand statement */}
      <section className="border-b border-rule py-20 sm:py-28">
        <div className="mx-auto grid max-w-[1600px] gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:px-10">
          <h2
            className="fx-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.92]"
            data-fx="arrive"
          >
            Certification is
            <br />
            not fine print.
          </h2>
          <div
            className="space-y-5 self-end text-[0.95rem] leading-relaxed text-ink-muted"
            data-fx="arrive"
            style={{ '--fx-i': 1 } as React.CSSProperties}
          >
            <p>
              An ISI mark means the unit was made under a BIS licence to a named Indian Standard.
              It is what an inspection accepts and what an insurer expects. We put it on the
              product card, not three clicks deep in a specification tab.
            </p>
            <p>
              Where a product is built to the standard without carrying the mark — as most clean
              agent units are — we say that too, rather than letting an absent badge imply
              something we have not claimed.
            </p>
            <Link href="/shop/all" className="fx-wedge mt-2">
              View the catalogue
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <Marquee text="Certified · ISI marked · IS 15683 · Dispatched across India" tone="wedge" seconds={44} />

      {/* ------------------------------------------------------- instagram */}
      <section className="border-b border-rule py-20 sm:py-24">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <SectionHead
            title="Follow us on Instagram"
            lede="Installation notes, class-selection explainers, and what a failed inspection actually looks like."
            align="centre"
          />

          {/* Nine plates awaiting the client's own photography, uploaded
              through admin. Deliberately designed rather than left empty. */}
          <ul className="fx-stagger mt-12 grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="aspect-square bg-ground-raised"
                data-fx="car"
              >
                <div className="fx-newsprint grid size-full place-items-center bg-ground-sunk">
                  <Instagram className="size-6 text-ink/25" aria-hidden="true" />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 text-center">
            <a
              href={setting(settings, 'social.instagram') || '#'}
              target="_blank"
              rel="noreferrer noopener"
              className="fx-wedge-ghost"
            >
              <Instagram className="size-4" aria-hidden="true" />
              Follow @fireoxine
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- faq */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <h2 className="fx-display text-4xl leading-[0.95] sm:text-5xl">
                Questions
                <br />
                worth asking
              </h2>
              <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-ink-muted">
                The ones that decide whether you buy the right unit. If yours is not here, ask us
                directly — we would rather answer than sell you the wrong thing.
              </p>
              <Link href="/contact" className="fx-wedge-ghost mt-8">
                Ask a question
              </Link>
            </div>

            <Accordion
              items={faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))}
            />
          </div>
        </div>
      </section>
    </>
  );
}
