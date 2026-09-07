import { db } from '@/lib/db';

export type Settings = Record<string, string>;

/**
 * Site copy and contact details live in the database so the client can change
 * a phone number without a deploy.
 */
export async function getSettings(): Promise<Settings> {
  const rows = await db.siteSetting.findMany();
  const map: Settings = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export const SETTING_FALLBACKS: Settings = {
  'contact.phone': '9820000000',
  'contact.email': 'hello@fireoxine.in',
  'contact.address': 'Mumbai, Maharashtra',
  'contact.mapUrl': '#',
  'home.heroLine1': 'KNOW',
  'home.heroLine2': 'WHAT',
  'home.heroLine3': 'BURNS',
  'home.heroSub': 'Certified fire extinguishers, chosen by what is actually at risk.',
  'home.marquee': 'Know what burns. Carry what stops it.',
  'shipping.freeAbovePaise': '500000',
  'shipping.flatPaise': '15000',
};

export function setting(settings: Settings, key: string): string {
  return settings[key] ?? SETTING_FALLBACKS[key] ?? '';
}
