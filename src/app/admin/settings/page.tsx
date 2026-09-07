import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { SettingsForm } from '@/components/admin/SettingsForm';

export const metadata: Metadata = { title: 'Settings · Admin' };

const GROUP_LABELS: Record<string, string> = {
  contact: 'Contact details',
  social: 'Social links',
  home: 'Home page copy',
  shipping: 'Shipping',
  general: 'General',
};

const GROUP_NOTES: Record<string, string> = {
  home: 'The hero sets three words, one per line. Short words hold the display size best.',
  shipping: 'Both values are in paise. 500000 is ₹5,000.',
};

export default async function AdminSettingsPage() {
  const settings = await db.siteSetting.findMany({ orderBy: { key: 'asc' } });

  const grouped = new Map<string, typeof settings>();
  for (const setting of settings) {
    const list = grouped.get(setting.group) ?? [];
    list.push(setting);
    grouped.set(setting.group, list);
  }

  return (
    <div>
      <h1 className="fx-display text-4xl">Settings</h1>
      <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-ink-muted">
        Contact details and home page copy live here rather than in the code, so you can change a
        phone number without a deploy.
      </p>

      <div className="mt-10">
        <SettingsForm
          groups={[...grouped.entries()].map(([group, rows]) => ({
            group,
            label: GROUP_LABELS[group] ?? group,
            note: GROUP_NOTES[group],
            rows: rows.map((r) => ({ key: r.key, label: r.label, value: r.value })),
          }))}
        />
      </div>
    </div>
  );
}
