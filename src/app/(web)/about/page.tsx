import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Marquee } from '@/components/site/Marquee';
import { ClassPanel } from '@/components/product/ClassPanel';

export const metadata: Metadata = {
  title: 'About',
  description:
    'FireOxine supplies certified fire extinguishers and allied safety equipment across India, catalogued by hazard as well as by product family.',
};

const VALUES = [
  [
    'Correctness first',
    'The wrong agent on the wrong class makes a fire worse. We would rather lose a sale than let someone buy a water extinguisher for a fryer.',
  ],
  [
    'Certification in the open',
    'ISI marks and Indian Standard numbers sit on the product card. Where a unit is built to standard without carrying the mark, we say so rather than let an absent badge imply a claim.',
  ],
  [
    'Two doors to one catalogue',
    'Product family for people who know what they want; hazard for everyone else. Neither is the afterthought.',
  ],
  [
    'Plain language',
    'Class B is “flammable liquids — petrol, diesel, paint, solvent”, not “Class B”. Nobody should need prior expertise to buy correctly.',
  ],
  [
    'The unit after the sale',
    'Extinguishers need pressure checks and refills on a cycle. We keep your order history so the next one is easy, and we service what we sell.',
  ],
];

export default async function AboutPage() {
  const fireClasses = await db.fireClass.findMany({ orderBy: { position: 'asc' } });

  return (
    <>
      {/* Hero, stacked the way the reference site stacks its own */}
      <section className="relative overflow-hidden border-b border-rule">
        <div
          aria-hidden="true"
          className="fx-drive pointer-events-none absolute inset-y-0 left-0 w-[46%] bg-wedge"
          style={{ clipPath: 'polygon(0 0, 100% 0, 58% 100%, 0 100%)' }}
        />
        <div aria-hidden="true" className="fx-newsprint pointer-events-none absolute inset-0 opacity-70" />

        <div className="relative mx-auto max-w-[1600px] px-4 py-24 sm:px-6 sm:py-32 lg:px-10">
          <h1 className="fx-display text-[clamp(2.75rem,9.5vw,8rem)] leading-[0.88]">
            <span className="block text-wedge-ink">KNOW</span>
            <span className="block text-wedge-ink">THE</span>
            <span className="block">DIFFERENCE.</span>
          </h1>
          <p className="mt-8 max-w-[52ch] text-lg leading-relaxed text-ink-muted">
            Most people buying a fire extinguisher have been made responsible for fire safety by an
            inspection, an insurer or a licence — not by choice. FireOxine is built for them.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="border-b border-rule py-20 sm:py-28">
        <div className="mx-auto grid max-w-[1600px] gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-10">
          <h2 className="fx-display text-[clamp(2.25rem,5vw,4rem)] leading-[0.95]">
            Our
            <br />
            story
          </h2>
          <div className="max-w-[70ch] space-y-5 text-[0.95rem] leading-relaxed text-ink-muted">
            <p>
              FireOxine supplies fire extinguishers and allied fire-safety equipment to businesses,
              housing societies and households across India. Portable extinguishers, fixed
              installations, detection, signage and the gear that goes with them.
            </p>
            <p>
              The catalogue is organised twice over. Once the way a supplier thinks — by product
              family, by extinguishing medium, by capacity. And once the way a buyer thinks — by the
              room they are protecting. A restaurant owner who has just been told their kitchen
              needs a K-class unit does not want to browse a list of chemical agents. They want to
              click “commercial kitchen” and see what belongs there.
            </p>
            <p>
              Every product page states the fire classes the unit is rated for and, just as
              importantly, the classes it must never be used on. That second half is the part most
              catalogues leave out, and it is the part that matters when someone is standing in
              front of a fire with the wrong cylinder in their hands.
            </p>
          </div>
        </div>
      </section>

      {/* Mission / vision */}
      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-[1600px] gap-px bg-rule lg:grid-cols-2">
          <div className="bg-ground px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
            <h2 className="fx-display text-3xl">
              Our <span className="text-wedge">mission</span>
            </h2>
            <p className="mt-5 max-w-[52ch] text-[0.95rem] leading-relaxed text-ink-muted">
              To make correct fire protection buyable by people who are not fire professionals — by
              putting fire class, certification and fitness for purpose on the face of every
              product, in language anyone can act on.
            </p>
          </div>
          <div className="bg-ground px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
            <h2 className="fx-display text-3xl">
              Our <span className="text-wedge">vision</span>
            </h2>
            <p className="mt-5 max-w-[52ch] text-[0.95rem] leading-relaxed text-ink-muted">
              A country where the extinguisher on the wall is the right one for the room it is in,
              is in date, and is reachable — because the person who bought it understood what they
              were buying.
            </p>
          </div>
        </div>
      </section>

      <Marquee text="Rated · Certified · Refillable · In date" />

      {/* Classes */}
      <section className="border-b border-rule py-20 sm:py-28">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <h2 className="fx-display text-[clamp(2.25rem,5vw,4rem)] leading-[0.95]">
            The five classes
            <br />
            everything rests on
          </h2>
          <p className="mt-5 max-w-[68ch] text-base leading-relaxed text-ink-muted">
            India follows IS 2190, which classifies fire by what is burning. Note that Class C here
            means flammable gases — not energised electrical equipment, which is the American
            meaning of C and the single most common error in Indian fire-safety copy. We treat
            electrical as a separate property of the product, because that is what it is.
          </p>

          <dl className="mt-12 divide-y divide-rule border-y border-rule">
            {fireClasses.map((fc) => (
              <div key={fc.id} className="grid gap-4 py-7 sm:grid-cols-[5rem_1fr] sm:gap-8">
                <dt>
                  <span className="fx-display grid size-14 place-items-center border-2 border-ink bg-ink text-2xl text-ground">
                    {fc.code}
                  </span>
                </dt>
                <dd>
                  <h3 className="fx-display text-xl">{fc.label}</h3>
                  <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-ink-muted">
                    {fc.description}
                  </p>
                  <p className="mt-2 text-sm text-ink-faint">
                    <span className="fx-stencil text-[0.6rem]">Example — </span>
                    {fc.example}
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <h2 className="fx-display text-[clamp(2.25rem,5vw,4rem)] leading-[0.95]">
            How we
            <br />
            operate
          </h2>

          <ol className="mt-12 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map(([title, body], i) => (
              <li key={title} className="bg-ground-raised p-7">
                <p className="fx-display fx-num text-3xl text-wedge">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="fx-display mt-4 text-xl leading-tight">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link href="/shop/all" className="fx-wedge">
              Browse the catalogue
            </Link>
            <Link href="/partner" className="fx-wedge-ghost">
              Trade and bulk supply
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
