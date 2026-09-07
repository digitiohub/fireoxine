'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Check, TriangleAlert } from 'lucide-react';
import { partnerAction, type FormState } from '@/actions/forms';

const BUSINESS_TYPES = [
  'Retailer / hardware store',
  'Distributor / wholesaler',
  'Electrical or safety contractor',
  'AMC or refilling service',
  'Corporate bulk buyer',
  'Other',
];

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="fx-wedge mt-8">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Sending
        </>
      ) : (
        'Submit enquiry'
      )}
    </button>
  );
}

export function PartnerForm() {
  const [state, action] = useActionState<FormState, FormData>(partnerAction, {});

  if (state.ok) {
    return (
      <div className="border border-rule-strong bg-ground-raised p-8">
        <span className="grid size-10 place-items-center bg-wedge text-wedge-ink">
          <Check className="size-5" aria-hidden="true" />
        </span>
        <h3 className="fx-display mt-5 text-2xl">Enquiry received</h3>
        <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-ink-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate>
      {state.error && (
        <p
          role="alert"
          className="mb-6 flex gap-2.5 border border-wedge bg-wedge/[0.06] p-3 text-sm text-ink"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-wedge" aria-hidden="true" />
          {state.error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="businessName" className="fx-label">
            Business name
          </label>
          <input id="businessName" name="businessName" required className="fx-field" />
        </div>
        <div>
          <label htmlFor="contactPerson" className="fx-label">
            Contact person
          </label>
          <input
            id="contactPerson"
            name="contactPerson"
            required
            autoComplete="name"
            className="fx-field"
          />
        </div>
        <div>
          <label htmlFor="partner-email" className="fx-label">
            Email
          </label>
          <input
            id="partner-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="fx-field"
          />
        </div>
        <div>
          <label htmlFor="partner-phone" className="fx-label">
            Mobile number
          </label>
          <input
            id="partner-phone"
            name="phone"
            required
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="10 digits"
            className="fx-field fx-num"
          />
        </div>
        <div>
          <label htmlFor="businessType" className="fx-label">
            Business type
          </label>
          <select id="businessType" name="businessType" required defaultValue="" className="fx-field">
            <option value="" disabled>
              Select one
            </option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="monthlyVolume" className="fx-label">
            Expected monthly volume <span className="text-ink-faint">(optional)</span>
          </label>
          <input
            id="monthlyVolume"
            name="monthlyVolume"
            placeholder="e.g. 200 units"
            className="fx-field"
          />
        </div>
        <div>
          <label htmlFor="partner-city" className="fx-label">
            City
          </label>
          <input
            id="partner-city"
            name="city"
            required
            autoComplete="address-level2"
            className="fx-field"
          />
        </div>
        <div>
          <label htmlFor="partner-state" className="fx-label">
            State
          </label>
          <input
            id="partner-state"
            name="state"
            required
            autoComplete="address-level1"
            className="fx-field"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="gstNumber" className="fx-label">
            GST number <span className="text-ink-faint">(optional)</span>
          </label>
          <input id="gstNumber" name="gstNumber" className="fx-field fx-num" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="partner-message" className="fx-label">
            What are you looking to stock? <span className="text-ink-faint">(optional)</span>
          </label>
          <textarea
            id="partner-message"
            name="message"
            rows={4}
            maxLength={1000}
            placeholder="Product mix, territory, whether you need private labelling."
            className="fx-field resize-y"
          />
        </div>
      </div>

      <Submit />
    </form>
  );
}
