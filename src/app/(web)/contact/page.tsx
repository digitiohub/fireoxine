import type { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { getSettings, setting } from '@/lib/settings';
import { PageHeader } from '@/components/site/PageHeader';
import { ContactForm } from '@/components/site/ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Talk to FireOxine about product selection, placement plans, refilling and AMC, or trade supply.',
};

export default async function ContactPage() {
  const settings = await getSettings();
  const phone = setting(settings, 'contact.phone');
  const email = setting(settings, 'contact.email');
  const address = setting(settings, 'contact.address');
  const mapUrl = setting(settings, 'contact.mapUrl');

  return (
    <>
      <PageHeader
        title="Get in touch"
        lede="Not sure which unit your premises needs? Send us the floor plan and occupancy type and we will mark up a placement plan. It is free and carries no obligation."
      />

      <div className="mx-auto max-w-[1600px] px-4 py-14 pb-24 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <h2 className="fx-display text-2xl">Reach us directly</h2>

            <dl className="mt-8 space-y-7">
              <div className="flex gap-4">
                <Phone className="mt-0.5 size-4 shrink-0 text-wedge" aria-hidden="true" />
                <div>
                  <dt className="fx-stencil text-[0.6rem] text-ink-faint">Phone</dt>
                  <dd className="mt-1">
                    <a
                      href={`tel:${phone}`}
                      className="fx-num text-base text-ink transition-colors hover:text-wedge"
                    >
                      {phone}
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex gap-4">
                <Mail className="mt-0.5 size-4 shrink-0 text-wedge" aria-hidden="true" />
                <div>
                  <dt className="fx-stencil text-[0.6rem] text-ink-faint">Email</dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${email}`}
                      className="text-base text-ink transition-colors hover:text-wedge"
                    >
                      {email}
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex gap-4">
                <MapPin className="mt-0.5 size-4 shrink-0 text-wedge" aria-hidden="true" />
                <div>
                  <dt className="fx-stencil text-[0.6rem] text-ink-faint">Office</dt>
                  <dd className="mt-1 max-w-[40ch] text-base leading-relaxed text-ink-muted">
                    {address}
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1.5 block text-sm text-ink underline decoration-rule-strong underline-offset-4 transition-colors hover:text-wedge"
                    >
                      View on map
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex gap-4">
                <Clock className="mt-0.5 size-4 shrink-0 text-wedge" aria-hidden="true" />
                <div>
                  <dt className="fx-stencil text-[0.6rem] text-ink-faint">Hours</dt>
                  <dd className="fx-num mt-1 text-base text-ink-muted">
                    Monday to Saturday, 9:30 – 18:30 IST
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-10 border-t border-rule pt-8">
              <h3 className="fx-display text-lg">In an emergency</h3>
              <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-ink-muted">
                This is a supplier, not an emergency service. For a fire in progress call{' '}
                <span className="fx-num font-medium text-ink">101</span> or the national emergency
                number <span className="fx-num font-medium text-ink">112</span>.
              </p>
            </div>
          </div>

          <div className="border border-rule-strong bg-ground-raised p-7 sm:p-9">
            <h2 className="fx-display text-2xl">Send a message</h2>
            <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-ink-muted">
              We reply within one working day.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
