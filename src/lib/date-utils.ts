/**
 * Shared date utilities that work consistently across server and client.
 * Use YYYY-MM-DD strings to avoid timezone serialization issues when
 * passing dates from server components to client components.
 */

/** Format a Date to YYYY-MM-DD using local timezone */
export function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parse YYYY-MM-DD string to Date at local midnight */
export function parseDateStr(str: string): Date {
  const [year, month, day] = str.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Check if a YYYY-MM-DD string is today (local timezone) */
export function isDateToday(dateStr: string): boolean {
  return dateStr === formatDateStr(new Date());
}

/**
 * Compute blocked date strings from raw time blocks.
 * MUST run on the client for correct timezone interpretation.
 */
export function computeBlockedDateStrings(
  blocks: { start_datetime: string; end_datetime: string }[]
): string[] {
  const dates: string[] = [];
  for (const block of blocks) {
    const start = new Date(block.start_datetime);
    const end = new Date(block.end_datetime);
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);
    while (current <= endDay) {
      dates.push(formatDateStr(current));
      current.setDate(current.getDate() + 1);
    }
  }
  return [...new Set(dates)];
}

/**
 * Extract unique YYYY-MM-DD strings from ISO datetime strings.
 * MUST run on the client for correct timezone interpretation.
 */
export function extractDateStrings(isoStrings: string[]): string[] {
  return [...new Set(isoStrings.map((iso) => formatDateStr(new Date(iso))))];
}
