import Link from 'next/link';
import { Phone, Mail, MapPin, Instagram, Linkedin, Facebook, Youtube } from 'lucide-react';
import { NewsletterForm } from '@/components/site/NewsletterForm';
import { setting, type Settings } from '@/lib/settings';

const WORDMARK = 'FIREOXINE';

const SOCIALS = [
  { key: 'social.instagram', label: 'Instagram', Icon: Instagram },
  { key: 'social.linkedin', label: 'LinkedIn', Icon: Linkedin },
  { key: 'social.facebook', label: 'Facebook', Icon: Facebook },
  { key: 'social.youtube', label: 'YouTube', Icon: Youtube },
] as const;

export function Footer({ settings }: { settings: Settings }) {
  const phone = setting(settings, 'contact.phone');
  const email = setting(settings, 'contact.email');
  const address = setting(settings, 'contact.address');
  const mapUrl = setting(settings, 'contact.mapUrl');

  return (
    <footer className="mt-24 border-t border-rule bg-ground-sunk">
      {/* The oversized wordmark, letter by letter, the way the reference
          site sets its own. Purely typographic, so it needs no asset. */}
      <div
        className="flex justify-between overflow-hidden px-4 pt-14 sm:px-6 lg:px-10"
        aria-hidden="true"
      >
        {WORDMARK.split('').map((letter, i) => (
          <span
            key={i}
            className="fx-display select-none text-[clamp(2.2rem,10.5vw,9.5rem)] leading-[0.8] text-ink/12"
          >
            {letter}
          </span>
        ))}
      </div>

      <div className="mx-auto max-w-[1600px] px-4 pb-12 pt-10 sm:px-6 lg:px-10">
        <div className="grid gap-10 border-t border-rule pt-10 md:grid-cols-3 md:gap-0">
          <div className="md:pr-10">
            <h2 className="fx-stencil mb-5 text-xs text-ink-faint">Contact us</h2>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-2.5 text-ink-muted transition-colors hover:text-ink"
                >
                  <Phone className="size-3.5 shrink-0 text-wedge" />
                  <span className="fx-num">{phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2.5 text-ink-muted transition-colors hover:text-ink"
                >
                  <Mail className="size-3.5 shrink-0 text-wedge" />
                  {email}
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-ink-muted">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-wedge" />
                <span>
                  {address}
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-1 block underline decoration-rule-strong transition-colors hover:text-ink"
                  >
                    View on map
                  </a>
                </span>
              </li>
            </ul>

            <div className="mt-6 flex gap-2">
              {SOCIALS.map(({ key, label, Icon }) => {
                const href = setting(settings, key);
                if (!href) return null;
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={label}
                    className="grid size-9 place-items-center border border-rule-strong text-ink-muted transition-colors hover:border-ink hover:bg-ink hover:text-ground"
                  >
                    <Icon className="size-4" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="border-rule md:border-x md:px-10">
            <h2 className="fx-stencil mb-5 text-xs text-ink-faint">Newsletter</h2>
            <p className="mb-4 max-w-[38ch] text-sm leading-relaxed text-ink-muted">
              Refill reminders, standard changes and new stock. Roughly once a month, and never
              more than that.
            </p>
            <NewsletterForm />
          </div>

          <div className="md:pl-10">
            <h2 className="fx-stencil mb-5 text-xs text-ink-faint">Quick links</h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              {[
                ['Home', '/'],
                ['All products', '/shop/all'],
                ['Collections', '/shop'],
                ['Shop by hazard', '/hazard'],
                ['About', '/about'],
                ['Partner', '/partner'],
                ['Contact', '/contact'],
                ['Account', '/account'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-ink-muted transition-colors hover:text-ink"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-rule pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p className="fx-num">
            © {new Date().getFullYear()} FireOxine. All rights reserved.
          </p>
          <p className="max-w-[60ch] sm:text-right">
            Fire-class information on this site follows IS 2190. It is general guidance, not a
            substitute for a site-specific fire risk assessment.
          </p>
        </div>
      </div>
    </footer>
  );
}
