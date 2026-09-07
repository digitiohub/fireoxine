import type { Metadata } from 'next';
import { ShieldCheck, Truck, Headset, IndianRupee } from 'lucide-react';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/site/PageHeader';
import { Accordion } from '@/components/site/Accordion';
import { PartnerForm } from '@/components/site/PartnerForm';

export const metadata: Metadata = {
  title: 'Partner',
  description:
    'Bulk supply, wholesale pricing and dedicated trade support for retailers, distributors, contractors and AMC service firms.',
};

const BENEFITS = [
  [ShieldCheck, 'Certified stock', 'ISI-marked units manufactured under BIS licence to IS 15683, with licence documentation available to registered partners.'],
  [Truck, 'Supply you can plan around', 'Stocked SKUs dispatch in three to five working days, with a written dispatch date on every proforma.'],
  [Headset, 'A direct line', 'A named contact for orders, documentation and escalations. Not a shared inbox.'],
  [IndianRupee, 'Trade pricing', 'Volume-banded wholesale rates, with terms reviewed as your annual commitment grows.'],
] as const;

const AUDIENCE = [
  ['Retailers and hardware stores', 'Counter stock across the common capacities, plus signage and blankets as attach sales.'],
  ['Distributors and wholesalers', 'Territory pricing, bulk cylinder supply and private labelling above agreed volumes.'],
  ['Electrical and safety contractors', 'Project quantities against a bill of materials, delivered to site.'],
  ['AMC and refilling firms', 'Replacement units, spares and refill agent supplied on a running account.'],
];

export default async function PartnerPage() {
  const faqs = await db.faq.findMany({
    where: { isActive: true, group: 'PARTNER' },
    orderBy: { position: 'asc' },
  });

  return (
    <>
      <PageHeader
        title={
          <>
            Supply
            <br />
            partners
          </>
        }
        lede="Bulk supply, consistent certification and a contact who answers. For retailers, distributors, contractors and service firms across India."
        action={
          <a href="#enquiry" className="fx-wedge">
            Make an enquiry
          </a>
        }
      />

      {/* Benefits */}
      <section className="border-b border-rule py-16 sm:py-20" aria-labelledby="why">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
          <h2 id="why" className="fx-display text-3xl sm:text-4xl">
            What you get
          </h2>
          <ul className="mt-10 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(([Icon, title, body]) => (
              <li key={title} className="bg-ground-raised p-7">
                <Icon className="size-5 text-wedge" aria-hidden="true" />
                <h3 className="fx-display mt-4 text-lg leading-tight">{title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Audience */}
      <section className="border-b border-rule py-16 sm:py-20" aria-labelledby="who">
        <div className="mx-auto grid max-w-[1600px] gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-10">
          <h2 id="who" className="fx-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[0.95]">
            Who we
            <br />
            supply
          </h2>
          <dl className="divide-y divide-rule border-y border-rule">
            {AUDIENCE.map(([term, detail]) => (
              <div key={term} className="py-5">
                <dt className="fx-display text-lg">{term}</dt>
                <dd className="mt-1.5 max-w-[64ch] text-sm leading-relaxed text-ink-muted">
                  {detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Enquiry */}
      <section id="enquiry" className="scroll-mt-20 border-b border-rule py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1600px] gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:px-10">
          <div>
            <h2 className="fx-display text-3xl sm:text-4xl">Trade enquiry</h2>
            <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-ink-muted">
              Tell us what you sell and roughly what volume you move. Our trade team replies within
              two working days with pricing and MOQ for your specific mix.
            </p>
            <div className="mt-10">
              <PartnerForm />
            </div>
          </div>

          <aside className="self-start border border-rule-strong bg-ground-raised p-7">
            <h3 className="fx-display text-xl">Before you write</h3>
            <ul className="mt-5 space-y-4 text-sm leading-relaxed text-ink-muted">
              <li>
                <span className="fx-stencil block text-[0.6rem] text-ink-faint">MOQ</span>
                Fifty units per SKU on most portable extinguishers, lower on hose reels, cabinets
                and signage. First orders in a new territory are usually taken below MOQ.
              </li>
              <li>
                <span className="fx-stencil block text-[0.6rem] text-ink-faint">Terms</span>
                First order against advance. Thirty-day credit from the second order for partners
                with a signed agreement and GST registration.
              </li>
              <li>
                <span className="fx-stencil block text-[0.6rem] text-ink-faint">Documentation</span>
                BIS licence documentation, test certificates and product sheets are available to
                registered partners on request.
              </li>
            </ul>
          </aside>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1600px] gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-10">
          <h2 className="fx-display text-[clamp(2rem,4.5vw,3.5rem)] leading-[0.95]">
            Trade
            <br />
            questions
          </h2>
          <Accordion
            items={faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))}
          />
        </div>
      </section>
    </>
  );
}
