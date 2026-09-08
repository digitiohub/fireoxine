import type { Metadata } from 'next';
import { apiGetOr } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { EnquiryStatusSelect } from '@/components/EnquiryStatusSelect';
import type { EnquiryStatus } from '@fireoxine/types';

type Partner = {
  id: string;
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessType: string;
  city: string;
  state: string;
  gstNumber: string | null;
  monthlyVolume: string | null;
  message: string | null;
  status: EnquiryStatus;
  createdAt: string;
};
type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
};
type Subscriber = { id: string; email: string; createdAt: string };
type Inbox = { partners: Partner[]; messages: Message[]; subscribers: Subscriber[] };

export const metadata: Metadata = { title: 'Enquiries · Admin' };

export default async function AdminEnquiriesPage() {
  const { partners, messages, subscribers } = await apiGetOr<Inbox>('/api/admin/enquiries', {
    partners: [],
    messages: [],
    subscribers: [],
  });

  return (
    <div>
      <h1 className="fx-display text-4xl">Enquiries</h1>

      <section className="mt-10" aria-labelledby="partners">
        <h2 id="partners" className="fx-display mb-5 border-b border-rule pb-3 text-2xl">
          Trade enquiries{' '}
          <span className="fx-num text-base text-ink-faint">({partners.length})</span>
        </h2>

        {partners.length === 0 ? (
          <p className="border border-rule bg-ground-raised px-5 py-10 text-center text-sm text-ink-muted">
            No trade enquiries yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {partners.map((enquiry) => (
              <li key={enquiry.id} className="border border-rule bg-ground-raised p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="fx-display text-lg">{enquiry.businessName}</h3>
                    <p className="mt-1 text-sm text-ink-muted">
                      {enquiry.contactPerson} · {enquiry.businessType}
                    </p>
                    <p className="fx-num mt-0.5 text-xs text-ink-faint">
                      {enquiry.email} · {enquiry.phone} · {enquiry.city}, {enquiry.state}
                      {enquiry.gstNumber && ` · GST ${enquiry.gstNumber}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="fx-num text-xs text-ink-faint">
                      {formatDate(enquiry.createdAt)}
                    </span>
                    <EnquiryStatusSelect kind="partner" id={enquiry.id} status={enquiry.status} />
                  </div>
                </div>
                {enquiry.monthlyVolume && (
                  <p className="fx-num mt-3 text-xs text-ink-muted">
                    Expected volume: {enquiry.monthlyVolume}
                  </p>
                )}
                {enquiry.message && (
                  <p className="mt-3 max-w-[76ch] border-t border-rule pt-3 text-sm leading-relaxed text-ink-muted">
                    {enquiry.message}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14" aria-labelledby="messages">
        <h2 id="messages" className="fx-display mb-5 border-b border-rule pb-3 text-2xl">
          Contact messages{' '}
          <span className="fx-num text-base text-ink-faint">({messages.length})</span>
        </h2>

        {messages.length === 0 ? (
          <p className="border border-rule bg-ground-raised px-5 py-10 text-center text-sm text-ink-muted">
            No messages yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {messages.map((message) => (
              <li key={message.id} className="border border-rule bg-ground-raised p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="fx-display text-lg">{message.subject}</h3>
                    <p className="fx-num mt-1 text-xs text-ink-faint">
                      {message.name} · {message.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="fx-num text-xs text-ink-faint">
                      {formatDate(message.createdAt)}
                    </span>
                    <EnquiryStatusSelect kind="contact" id={message.id} status={message.status} />
                  </div>
                </div>
                <p className="mt-3 max-w-[76ch] border-t border-rule pt-3 text-sm leading-relaxed text-ink-muted">
                  {message.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14" aria-labelledby="subscribers">
        <h2 id="subscribers" className="fx-display mb-5 border-b border-rule pb-3 text-2xl">
          Newsletter{' '}
          <span className="fx-num text-base text-ink-faint">({subscribers.length})</span>
        </h2>
        {subscribers.length === 0 ? (
          <p className="border border-rule bg-ground-raised px-5 py-10 text-center text-sm text-ink-muted">
            No subscribers yet.
          </p>
        ) : (
          <ul className="fx-num grid gap-2 border border-rule bg-ground-raised p-5 text-sm text-ink-muted sm:grid-cols-2 lg:grid-cols-3">
            {subscribers.map((s) => (
              <li key={s.id}>{s.email}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
