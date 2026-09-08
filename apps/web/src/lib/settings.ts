import type { SettingsDto } from '@fireoxine/types';

export type Settings = SettingsDto;

/**
 * Settings arrive from the API with the page. This module only holds the
 * fallbacks and the reader, so a page still renders sensibly when the API is
 * unreachable and the map comes back empty.
 */
export const SETTING_FALLBACKS: Settings = {
  'contact.phone': '07942866992',
  'contact.email': 'info@fireoxinesafetyindustries.in',
  'contact.address': 'Bhandup West, Mumbai - 400078, Maharashtra',
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
