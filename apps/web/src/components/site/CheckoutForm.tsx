'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, TriangleAlert } from 'lucide-react';
import { placeOrderAction, type CheckoutState } from '@/actions/checkout';

type Defaults = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="fx-wedge mt-8 w-full justify-center">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Placing order
        </>
      ) : (
        'Place order'
      )}
    </button>
  );
}

export function CheckoutForm({
  defaults,
  signedIn,
}: {
  defaults: Defaults;
  signedIn: boolean;
}) {
  const [state, action] = useActionState<CheckoutState, FormData>(placeOrderAction, {});

  return (
    <form action={action} noValidate>
      {state.error && (
        <div
          role="alert"
          className="mb-8 flex gap-3 border border-wedge bg-wedge/[0.06] p-4 text-sm text-ink"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-wedge" aria-hidden="true" />
          {state.error}
        </div>
      )}

      <fieldset>
        <legend className="fx-display mb-5 text-xl">Who is receiving this</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="fullName" className="fx-label">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              required
              autoComplete="name"
              defaultValue={defaults.fullName}
              className="fx-field"
            />
          </div>
          <div>
            <label htmlFor="phone" className="fx-label">
              Mobile number
            </label>
            <input
              id="phone"
              name="phone"
              required
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="10 digits"
              defaultValue={defaults.phone}
              className="fx-field fx-num"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="email" className="fx-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={defaults.email}
              className="fx-field"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="mt-10">
        <legend className="fx-display mb-5 text-xl">Where it goes</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="line1" className="fx-label">
              Building and street
            </label>
            <input
              id="line1"
              name="line1"
              required
              autoComplete="address-line1"
              defaultValue={defaults.line1}
              className="fx-field"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="line2" className="fx-label">
              Area, landmark <span className="text-ink-faint">(optional)</span>
            </label>
            <input
              id="line2"
              name="line2"
              autoComplete="address-line2"
              defaultValue={defaults.line2}
              className="fx-field"
            />
          </div>
          <div>
            <label htmlFor="city" className="fx-label">
              City
            </label>
            <input
              id="city"
              name="city"
              required
              autoComplete="address-level2"
              defaultValue={defaults.city}
              className="fx-field"
            />
          </div>
          <div>
            <label htmlFor="state" className="fx-label">
              State
            </label>
            <input
              id="state"
              name="state"
              required
              autoComplete="address-level1"
              defaultValue={defaults.state}
              className="fx-field"
            />
          </div>
          <div>
            <label htmlFor="pincode" className="fx-label">
              PIN code
            </label>
            <input
              id="pincode"
              name="pincode"
              required
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="6 digits"
              defaultValue={defaults.pincode}
              className="fx-field fx-num"
            />
          </div>
        </div>

        {signedIn && (
          <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm text-ink-muted">
            <input
              type="checkbox"
              name="saveAddress"
              value="1"
              className="size-4 shrink-0 appearance-none border border-rule-strong bg-ground-raised checked:border-wedge checked:bg-wedge"
            />
            Save this address to my account
          </label>
        )}
      </fieldset>

      <fieldset className="mt-10">
        <legend className="fx-display mb-5 text-xl">Anything we should know</legend>
        <label htmlFor="notes" className="fx-label">
          Delivery or installation notes <span className="text-ink-faint">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          maxLength={500}
          placeholder="Gate access, floor, preferred delivery window, or the inspection date you are working to."
          className="fx-field resize-y"
        />
      </fieldset>

      <Submit />
    </form>
  );
}
