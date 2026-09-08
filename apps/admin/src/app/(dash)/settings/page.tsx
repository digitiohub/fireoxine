import type { Metadata } from 'next';
import { apiGetOr } from '@/lib/api';
import { SettingsForm } from '@/components/SettingsForm';
import type { SettingRowDto } from '@fireoxine/types';

export const metadata: Metadata = { title: 'Settings · Admin' };

const GROUP_LABELS: Record<string, string> = {
  contact: 'Contact details',
  social: 'Social links',
  home: 'Home page copy',
  shipping: 'Shipping',
  about: 'About page',
  general: 'Company factsheet',
};

const GROUP_NOTES: Record<string, string> = {
  home: 'The hero sets three words, one per line. Short words hold the display size best.',
  shipping: 'Both values are in paise. 500000 is ₹5,000.',
  about: 'Copy for /about. List fields take one item per line; the story field takes a blank line between paragraphs.',
  general: 'The registered particulars printed in the factsheet on /about.',
};

export default async function AdminSettingsPage() {
  const settings = await apiGetOr<SettingRowDto[]>('/api/admin/settings', []);

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
