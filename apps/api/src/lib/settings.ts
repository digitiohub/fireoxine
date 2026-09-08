import { db } from '@/lib/db';
import type { SettingsDto } from '@fireoxine/types';

/**
 * Site copy and contact details live in the database so the client can change
 * a phone number without a deploy. The API is now the only reader; web and
 * admin receive the map over HTTP.
 */
export async function getSettings(): Promise<SettingsDto> {
  const rows = await db.siteSetting.findMany();
  const map: SettingsDto = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export function settingNumber(settings: SettingsDto, key: string, fallback: number): number {
  const n = Number(settings[key]);
  return Number.isFinite(n) ? n : fallback;
}
