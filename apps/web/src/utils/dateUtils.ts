/**
 * Utility to format English date strings (e.g., "02 – 04 Oct 2026", "Fri 02 Oct", "20 Oct 2024")
 * into localized Vietnamese equivalents when lang === 'vi'.
 */

const MONTH_MAP_VI: Record<string, string> = {
  Jan: 'Thg 1',
  Feb: 'Thg 2',
  Mar: 'Thg 3',
  Apr: 'Thg 4',
  May: 'Thg 5',
  Jun: 'Thg 6',
  Jul: 'Thg 7',
  Aug: 'Thg 8',
  Sep: 'Thg 9',
  Oct: 'Thg 10',
  Nov: 'Thg 11',
  Dec: 'Thg 12',
  January: 'Tháng 1',
  February: 'Tháng 2',
  March: 'Tháng 3',
  April: 'Tháng 4',
  June: 'Tháng 6',
  July: 'Tháng 7',
  August: 'Tháng 8',
  September: 'Tháng 9',
  October: 'Tháng 10',
  November: 'Tháng 11',
  December: 'Tháng 12',
};

const DAY_MAP_VI: Record<string, string> = {
  Mon: 'T2',
  Tue: 'T3',
  Wed: 'T4',
  Thu: 'T5',
  Fri: 'T6',
  Sat: 'T7',
  Sun: 'CN',
  Monday: 'Thứ 2',
  Tuesday: 'Thứ 3',
  Wednesday: 'Thứ 4',
  Thursday: 'Thứ 5',
  Friday: 'Thứ 6',
  Saturday: 'Thứ 7',
  Sunday: 'Chủ Nhật',
};

const SORTED_MONTHS = Object.entries(MONTH_MAP_VI).sort((a, b) => b[0].length - a[0].length);
const SORTED_DAYS = Object.entries(DAY_MAP_VI).sort((a, b) => b[0].length - a[0].length);

const EN_MONTHS = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatDateStr(dateStr: string | undefined, lang: string): string {
  if (!dateStr) return '';

  const trimmed = dateStr.trim();

  // 1. Support ISO date ranges like "2026-10-02 – 2026-10-04" or "2026-10-02 - 2026-10-04"
  const isoRangeMatch = trimmed.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})\s*[-–/]\s*(\d{4})-(\d{1,2})-(\d{1,2})/,
  );
  if (isoRangeMatch) {
    const startDay = isoRangeMatch[3].padStart(2, '0');
    const endYear = isoRangeMatch[4];
    const endMonth = parseInt(isoRangeMatch[5], 10);
    const endDay = isoRangeMatch[6].padStart(2, '0');

    if (lang === 'vi') {
      return `${startDay} – ${endDay} Thg ${endMonth} ${endYear}`;
    } else {
      const enMonth = EN_MONTHS[endMonth] || endMonth;
      return `${startDay} – ${endDay} ${enMonth} ${endYear}`;
    }
  }

  // 2. Support single ISO date like "2026-10-04" or "2026-10-04T00:00:00"
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const monthNum = parseInt(isoMatch[2], 10);
    const day = isoMatch[3].padStart(2, '0');

    if (lang === 'vi') {
      return `${day} Thg ${monthNum} ${year}`;
    } else {
      const enMonth = EN_MONTHS[monthNum] || monthNum;
      return `${day} ${enMonth} ${year}`;
    }
  }

  // 3. Support slash format like "04/10/2026"
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const monthNum = parseInt(slashMatch[2], 10);
    const year = slashMatch[3];

    if (lang === 'vi') {
      return `${day} Thg ${monthNum} ${year}`;
    } else {
      const enMonth = EN_MONTHS[monthNum] || monthNum;
      return `${day} ${enMonth} ${year}`;
    }
  }

  // 4. For textual dates (e.g., "26 Jul 2026", "02 – 04 Oct 2026", "Sun 04 Oct")
  if (lang !== 'vi') return trimmed;

  let localized = trimmed;

  // Replace English month names
  SORTED_MONTHS.forEach(([en, vi]) => {
    // Match whole words to avoid partial matching errors
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    localized = localized.replace(regex, vi);
  });

  // Replace English day names
  SORTED_DAYS.forEach(([en, vi]) => {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    localized = localized.replace(regex, vi);
  });

  return localized;
}

const SESSION_NAME_MAP_VI: Record<string, string> = {
  'Practice 1': 'Thử nghiệm 1 (FP1)',
  'Practice 2': 'Thử nghiệm 2 (FP2)',
  'Practice 3': 'Thử nghiệm 3 (FP3)',
  'Sprint Qualifying': 'Phân hạng Sprint',
  'Sprint Shootout': 'Phân hạng Sprint',
  'Sprint Race': 'Đua Sprint',
  Sprint: 'Đua Sprint',
  Qualifying: 'Đua phân hạng',
  Race: 'Đua chính (Race)',
  'Grand Prix Race': 'Đua chính (Race)',
};

export function formatSessionName(name: string | undefined, lang: string): string {
  if (!name) return '';
  if (lang !== 'vi') return name;
  return SESSION_NAME_MAP_VI[name] || name;
}

/**
 * Convert a local venue time string "HH:MM" to Vietnam time (UTC+7).
 * @param timeStr  Local time at the race venue, e.g. "20:00"
 * @param venueUtcOffset  UTC offset of the venue in hours, e.g. +8 for Singapore
 * @returns Formatted Vietnam time string, e.g. "19:00" (with "+1 ngày" / "-1 ngày" if day boundary crossed)
 */
export function toVietnamTime(
  timeStr: string,
  venueUtcOffset: number,
): { time: string; dayShift: number } {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return { time: timeStr, dayShift: 0 };

  const localHour = parseInt(match[1], 10);
  const localMin = parseInt(match[2], 10);

  // Convert to UTC then to UTC+7
  const utcMinutes = localHour * 60 + localMin - venueUtcOffset * 60;
  const vnMinutes = utcMinutes + 7 * 60;

  // Normalise to 0–1440 range and track day shift
  const normalised = ((vnMinutes % 1440) + 1440) % 1440;
  const dayShift = vnMinutes < 0 ? -1 : vnMinutes >= 1440 ? 1 : 0;

  const h = Math.floor(normalised / 60)
    .toString()
    .padStart(2, '0');
  const m = (normalised % 60).toString().padStart(2, '0');

  return { time: `${h}:${m}`, dayShift };
}
