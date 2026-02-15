import { DateTime } from 'luxon';

/**
 * Convert local time to UTC
 * @param localTime Time in HH:mm format
 * @param timezone IANA timezone (e.g., "Asia/Kolkata")
 * @returns UTC time in HH:mm format
 */
export function convertToUTC(localTime: string, timezone: string): string {
  const [hours, minutes] = localTime.split(':').map(Number);
  const date = DateTime.fromObject(
    { hour: hours, minute: minutes },
    { zone: timezone }
  );
  return date.toUTC().toFormat('HH:mm');
}

/**
 * Convert UTC time to local timezone
 * @param utcTime Time in HH:mm format (UTC)
 * @param timezone IANA timezone (e.g., "Asia/Kolkata")
 * @returns Local time in HH:mm format
 */
export function convertToLocal(utcTime: string, timezone: string): string {
  const [hours, minutes] = utcTime.split(':').map(Number);
  const date = DateTime.fromObject(
    { hour: hours, minute: minutes },
    { zone: 'UTC' }
  );
  return date.setZone(timezone).toFormat('HH:mm');
}

/**
 * Get user's current timezone
 * @returns IANA timezone string
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Common timezones for the region
 */
export const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'UTC', label: 'UTC' },
];
