import type { Metadata } from 'next';
import Link from 'next/link';
import { apiGetOr } from '@/lib/api';
import { setting } from '@/lib/settings';
import type { FireClassDto, SettingsDto } from '@fireoxine/types';
import { Marquee } from '@/components/site/Marquee';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Fire Oxine Safety Industries — manufacturer and trader of fire safety products from Bhandup West, Mumbai, since 2006.',
};

/** Settings hold list fields as one item per line. */
function lines(value: string): string[] {
  return value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Story fields hold paragraphs separated by a blank line. */
function paragraphs(value: string): string[] {
  return value
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * The source publishes an ISO certificate with an expiry date that has passed.
 * Printing it as a live certification would be a false claim, so the badge
 * states the dates and says plainly whether it is current. Parses the
 * "07-Oct-2020" form the profile uses.
 */
function isExpired(dmy: string): boolean | null {
  const parsed = Date.parse(dmy.replace(/-/g, ' '));
  if (Number.isNaN(parsed)) return null;
  return parsed < Date.now();
}

export default async function AboutPage() {
  const [fireClasses, settings] = await Promise.all([
    apiGetOr<FireClassDto[]>('/api/catalogue/fire-classes', [], {
      anonymous: true,
      revalidate: 300,
    }),
    apiGetOr<SettingsDto>('/api/settings', {}, { anonymous: true, revalidate: 300 }),
  ]);
  const s = (key: string) => setting(settings, key);

  const established = s('company.established');
  const isoStandard = s('about.isoStandard');
  const isoIssued = s('about.isoIssued');
  const isoExpiry = s('about.isoExpiry');
  const isoExpired = isoExpiry ? isExpired(isoExpiry) : null;

  // Left column label, right column value — the profile's own factsheet.
  const factsheet: [string, string][] = (
    [
      ['Nature of business', s('company.natureOfBusiness')],
      ['Additional business', s('company.additionalBusiness')],
      ['Company CEO', s('company.ceo')],
      ['Year established', established],
      ['Legal status of firm', s('company.legalStatus')],
      ['Registered address', s('contact.address')],
      ['Total employees', s('company.employees')],
      ['Annual turnover', s('company.turnover')],
      ['GST number', s('company.gst')],
      ['GST registration date', s('company.gstDate')],
      ['Import Export Code (IEC)', s('company.iec')],
      ['Banker', s('company.banker')],
      ['Company USP', s('company.usp')],
      ['Competitive advantage', s('company.advantage')],
      ['Quality measures / testing', s('company.qualityTesting')],
      ['Customised packaging', s('company.customPackaging')],
      ['Payment modes', s('company.paymentModes')],
      ['Shipment mode', s('company.shipmentMode')],
    ] as [string, string][]
  ).filter(([, v]) => v);

  const whyUs = lines(s('about.whyUsFactors'));
  const infraUnits = lines(s('about.infrastructureUnits'));
  const teamRoles = lines(s('about.teamRoles'));
  const clients = lines(s('about.clients'));
  const brands = lines(s('about.brands'));

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
          <p className="mt-8 max-w-[52ch] text-lg leading-relaxed text-ink-muted">{s('about.lede')}</p>
          {established && (
            <p className="fx-stencil mt-6 text-xs text-ink-faint">
              Manufacturer · Bhandup West, Mumbai · Since <span className="fx-num">{established}</span>
            </p>
          )}
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
            {paragraphs(s('about.story')).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Why us / infrastructure — the profile's two operating sections */}
      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-[1600px] gap-px bg-rule lg:grid-cols-2">
          <div className="bg-ground px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
            <h2 className="fx-display text-3xl">
              Why <span className="text-wedge">us</span>
            </h2>
            <p className="mt-5 max-w-[52ch] text-[0.95rem] leading-relaxed text-ink-muted">
              {s('about.whyUsBody')}
            </p>
            {whyUs.length > 0 && (
              <ul className="mt-7 space-y-2.5">
                {whyUs.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-ink-muted">
                    <span aria-hidden="true" className="mt-[0.45rem] size-1.5 shrink-0 bg-wedge" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-ground px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
            <h2 className="fx-display text-3xl">
              Our <span className="text-wedge">infrastructure</span>
            </h2>
            <p className="mt-5 max-w-[52ch] text-[0.95rem] leading-relaxed text-ink-muted">
              {s('about.infrastructureBody')}
            </p>
            {infraUnits.length > 0 && (
              <ol className="mt-7 grid gap-px border border-rule bg-rule sm:grid-cols-2">
                {infraUnits.map((unit, i) => (
                  <li key={unit} className="bg-ground-raised p-4">
                    <span className="fx-display fx-num text-xl text-wedge">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="mt-1 text-sm text-ink">{unit}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>

      <Marquee text="Rated · Certified · Refillable · In date" />

      {/* Quality, team and certification */}
      <section className="border-b border-rule py-20 sm:py-28">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
            <div className="space-y-10">
              <div>
                <h2 className="fx-display text-[clamp(2rem,4vw,3rem)] leading-[0.95]">
                  Customer satisfaction
                </h2>
                <p className="mt-5 max-w-[70ch] text-[0.95rem] leading-relaxed text-ink-muted">
                  {s('about.qualityBody')}
                </p>
              </div>

              <div>
                <h2 className="fx-display text-[clamp(2rem,4vw,3rem)] leading-[0.95]">Our team</h2>
                <p className="mt-5 max-w-[70ch] text-[0.95rem] leading-relaxed text-ink-muted">
                  {s('about.teamBody')}
                </p>
                {teamRoles.length > 0 && (
                  <ul className="mt-7 flex flex-wrap gap-2">
                    {teamRoles.map((role) => (
                      <li
                        key={role}
                        className="fx-stencil border border-rule-strong px-3 py-1.5 text-[0.65rem] text-ink-muted"
                      >
                        {role}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Certification. Dates are printed because one of them matters. */}
            {isoStandard && (
              <aside className="self-start border border-rule-strong bg-ground-raised p-7">
                <h2 className="fx-stencil text-xs text-ink-faint">Certification</h2>
                <p className="fx-display mt-3 text-3xl">{isoStandard}</p>
                <dl className="mt-5 space-y-2 text-sm">
                  {isoIssued && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-faint">Issued</dt>
                      <dd className="fx-num text-ink-muted">{isoIssued}</dd>
                    </div>
                  )}
                  {isoExpiry && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-faint">Expiry</dt>
                      <dd className="fx-num text-ink-muted">{isoExpiry}</dd>
                    </div>
                  )}
                </dl>
                {isoExpired === true && (
                  <p className="mt-5 border-t border-rule pt-4 text-sm leading-relaxed text-wedge">
                    This certificate has lapsed. We state it as published rather than imply a
                    current certification — ask us for the renewal status before you specify.
                  </p>
                )}
                {brands.length > 0 && (
                  <div className="mt-7 border-t border-rule pt-5">
                    <h3 className="fx-stencil text-xs text-ink-faint">Brands we deal in</h3>
                    <p className="mt-2 text-sm text-ink-muted">{brands.join(' · ')}</p>
                  </div>
                )}
              </aside>
            )}
          </div>
        </div>
      </section>

      {/* Clientele */}
      {clients.length > 0 && (
        <section className="border-b border-rule py-20 sm:py-28">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
            <h2 className="fx-display text-[clamp(2.25rem,5vw,4rem)] leading-[0.95]">
              Our
              <br />
              clientele
            </h2>
            <p className="mt-5 max-w-[68ch] text-base leading-relaxed text-ink-muted">
              {s('about.clienteleBody')}
            </p>
            <ul className="mt-12 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => (
                <li key={client} className="fx-display bg-ground-raised p-6 text-lg leading-tight">
                  {client}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Factsheet */}
      <section className="border-b border-rule py-20 sm:py-28">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <h2 className="fx-display text-[clamp(2.25rem,5vw,4rem)] leading-[0.95]">
            Factsheet
          </h2>
          <p className="mt-5 max-w-[68ch] text-base leading-relaxed text-ink-muted">
            The registered particulars of the firm, as published on our company profile.
          </p>
          <dl className="mt-12 divide-y divide-rule border-y border-rule">
            {factsheet.map(([label, value]) => (
              <div key={label} className="grid gap-1 py-4 sm:grid-cols-[18rem_1fr] sm:gap-8">
                <dt className="fx-stencil text-[0.65rem] text-ink-faint sm:pt-1">{label}</dt>
                <dd className="text-sm leading-relaxed text-ink-muted">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Classes */}
      <section className="py-20 sm:py-28">
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
