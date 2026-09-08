'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, TriangleAlert } from 'lucide-react';
import { saveProduct, type AdminState } from '@/actions/admin';

type Option = { id: string; name: string };
type ClassOption = { code: string; label: string };

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  medium: string;
  standardCode: string;
  warrantyNote: string;
  refillMonths: string;
  electricalRatingKv: string;
  isIsiMarked: boolean;
  safeOnLiveElectrical: boolean;
  isFeatured: boolean;
  isActive: boolean;
  classStates: Record<string, 'covers' | 'prohibited' | 'unstated'>;
  hazardIds: string[];
};

const MEDIUMS = [
  ['ABC_POWDER', 'ABC dry powder'],
  ['BC_POWDER', 'BC dry powder'],
  ['CO2', 'Carbon dioxide'],
  ['MECHANICAL_FOAM', 'Mechanical foam (AFFF)'],
  ['WATER', 'Water'],
  ['WATER_MIST', 'Water mist'],
  ['CLEAN_AGENT', 'Clean agent'],
  ['WET_CHEMICAL', 'Wet chemical'],
  ['D_CLASS_POWDER', 'Class D powder'],
  ['NOT_APPLICABLE', 'Not applicable'],
];

function Submit({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="fx-wedge">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Saving
        </>
      ) : isNew ? (
        'Create product'
      ) : (
        'Save changes'
      )}
    </button>
  );
}

export function ProductForm({
  values,
  categories,
  hazards,
  fireClasses,
}: {
  values: ProductFormValues;
  categories: Option[];
  hazards: Option[];
  fireClasses: ClassOption[];
}) {
  const router = useRouter();
  const [state, action] = useActionState<AdminState, FormData>(saveProduct, {});

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? 'Saved.');
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} noValidate className="space-y-10">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      {state.error && (
        <p
          role="alert"
          className="flex gap-2.5 border border-wedge bg-wedge/[0.06] p-3 text-sm text-ink"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-wedge" aria-hidden="true" />
          {state.error}
        </p>
      )}

      <fieldset>
        <legend className="fx-display mb-5 text-xl">Basics</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="fx-label">
              Product name
            </label>
            <input id="name" name="name" required defaultValue={values.name} className="fx-field" />
          </div>
          <div>
            <label htmlFor="slug" className="fx-label">
              URL slug <span className="text-ink-faint">(blank to generate)</span>
            </label>
            <input id="slug" name="slug" defaultValue={values.slug} className="fx-field" />
          </div>
          <div>
            <label htmlFor="sku" className="fx-label">
              SKU
            </label>
            <input id="sku" name="sku" required defaultValue={values.sku} className="fx-field fx-num" />
          </div>
          <div>
            <label htmlFor="categoryId" className="fx-label">
              Product family
            </label>
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={values.categoryId}
              className="fx-field"
            >
              <option value="" disabled>
                Choose one
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="medium" className="fx-label">
              Extinguishing medium
            </label>
            <select id="medium" name="medium" defaultValue={values.medium} className="fx-field">
              {MEDIUMS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="shortDescription" className="fx-label">
              One-line summary <span className="text-ink-faint">(shown on cards)</span>
            </label>
            <input
              id="shortDescription"
              name="shortDescription"
              required
              defaultValue={values.shortDescription}
              className="fx-field"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="description" className="fx-label">
              Full description <span className="text-ink-faint">(blank line separates paragraphs)</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={8}
              defaultValue={values.description}
              className="fx-field resize-y"
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="fx-display mb-2 text-xl">Fire class coverage</legend>
        <p className="mb-5 max-w-[70ch] text-sm leading-relaxed text-ink-muted">
          “Prohibited” is not the same as leaving a class unstated. Unstated means we make no claim;
          prohibited publishes an explicit warning on the product page and the card. Use prohibited
          wherever the manufacturer says the agent is dangerous on that class.
        </p>

        <div className="overflow-x-auto border border-rule">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b border-rule bg-ground-sunk text-left">
                <th className="fx-stencil px-4 py-3 text-[0.6rem] text-ink-faint">Class</th>
                <th className="fx-stencil px-4 py-3 text-[0.6rem] text-ink-faint">Rated for</th>
                <th className="fx-stencil px-4 py-3 text-[0.6rem] text-ink-faint">Never use on</th>
                <th className="fx-stencil px-4 py-3 text-[0.6rem] text-ink-faint">No claim</th>
              </tr>
            </thead>
            <tbody>
              {fireClasses.map((fc) => {
                const current = values.classStates[fc.code] ?? 'unstated';
                return (
                  <tr key={fc.code} className="border-b border-rule last:border-0">
                    <td className="px-4 py-3">
                      <span className="fx-display mr-2 inline-grid size-7 place-items-center border border-ink bg-ink text-xs text-ground">
                        {fc.code}
                      </span>
                      <span className="text-ink-muted">{fc.label}</span>
                    </td>
                    {(['covers', 'prohibited', 'unstated'] as const).map((value) => (
                      <td key={value} className="px-4 py-3">
                        <label className="inline-flex cursor-pointer items-center">
                          <input
                            type="radio"
                            name={`class:${fc.code}`}
                            value={value}
                            defaultChecked={current === value}
                            className="size-4 accent-[var(--wedge)]"
                          />
                          <span className="sr-only">
                            {fc.label} — {value}
                          </span>
                        </label>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </fieldset>

      <fieldset>
        <legend className="fx-display mb-2 text-xl">Certification and handling</legend>
        <p className="mb-5 max-w-[70ch] text-sm leading-relaxed text-ink-muted">
          “Safe on live electrical” is deliberately separate from the class table. Under IS 2190
          electrical is a hazard condition, not a fire class, and showing it as a letter would be
          wrong.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="standardCode" className="fx-label">
              Indian Standard <span className="text-ink-faint">(e.g. IS 15683)</span>
            </label>
            <input
              id="standardCode"
              name="standardCode"
              defaultValue={values.standardCode}
              className="fx-field fx-num"
            />
          </div>
          <div>
            <label htmlFor="electricalRatingKv" className="fx-label">
              Dielectric rating in kV <span className="text-ink-faint">(optional)</span>
            </label>
            <input
              id="electricalRatingKv"
              name="electricalRatingKv"
              type="number"
              min="0"
              defaultValue={values.electricalRatingKv}
              className="fx-field fx-num"
            />
          </div>
          <div>
            <label htmlFor="refillMonths" className="fx-label">
              Refill interval in months <span className="text-ink-faint">(optional)</span>
            </label>
            <input
              id="refillMonths"
              name="refillMonths"
              type="number"
              min="0"
              defaultValue={values.refillMonths}
              className="fx-field fx-num"
            />
          </div>
          <div>
            <label htmlFor="warrantyNote" className="fx-label">
              Warranty note <span className="text-ink-faint">(optional)</span>
            </label>
            <input
              id="warrantyNote"
              name="warrantyNote"
              defaultValue={values.warrantyNote}
              className="fx-field"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {(
            [
              ['isIsiMarked', 'ISI marked', values.isIsiMarked],
              ['safeOnLiveElectrical', 'Safe on live electrical equipment', values.safeOnLiveElectrical],
              ['isFeatured', 'Feature on the home page', values.isFeatured],
              ['isActive', 'Visible on the site', values.isActive],
            ] as const
          ).map(([name, label, checked]) => (
            <label key={name} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-muted">
              <input
                type="checkbox"
                name={name}
                defaultChecked={checked}
                className="size-4 shrink-0 appearance-none border border-rule-strong bg-ground-raised checked:border-wedge checked:bg-wedge"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="fx-display mb-2 text-xl">Hazards</legend>
        <p className="mb-5 max-w-[70ch] text-sm leading-relaxed text-ink-muted">
          Which spaces should list this product? This drives the “shop by hazard” pages.
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {hazards.map((h) => (
            <label key={h.id} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-muted">
              <input
                type="checkbox"
                name="hazard"
                value={h.id}
                defaultChecked={values.hazardIds.includes(h.id)}
                className="size-4 shrink-0 appearance-none border border-rule-strong bg-ground-raised checked:border-wedge checked:bg-wedge"
              />
              {h.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="border-t border-rule pt-6">
        <Submit isNew={!values.id} />
      </div>
    </form>
  );
}
