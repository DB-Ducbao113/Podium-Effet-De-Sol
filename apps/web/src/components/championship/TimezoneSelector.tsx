import { useTimezoneStore } from '../../store/useTimezoneStore';
import type { GrandPrixRound } from '../../types';
import { TIMEZONE_OPTIONS, browserTimeZone, venueOffsetLabel, zoneOffsetLabel } from '../../utils/championshipTimezone';

export function TimezoneSelector({ lang, venue }: { lang: 'vi' | 'en'; venue?: GrandPrixRound }) {
  const { preference, setPreference } = useTimezoneStore();
  const label = lang === 'vi' ? 'Múi giờ hiển thị' : 'Display time zone';
  const venueOffset = venue?.venueUtcOffset;
  const currentLabel = preference === 'venue' && venueOffset !== undefined
    ? `${venue?.location} · ${venueOffsetLabel(venueOffset)}`
    : `${preference === 'venue' ? browserTimeZone() : preference === 'local' ? browserTimeZone() : preference} · ${zoneOffsetLabel(new Date(), preference)}`;
  return <label className="c1-timezone">
    <span>{label}</span>
    <select aria-label={label} value={preference} onChange={(event) => setPreference(event.target.value)}>
      {TIMEZONE_OPTIONS.map((zone) => <option key={zone} value={zone}>{zone === 'venue' ? (lang === 'vi' ? 'Giờ tại đường đua' : 'Circuit local time') : zone === 'local' ? `${lang === 'vi' ? 'Tự động theo thiết bị' : 'Automatic device time'} (${browserTimeZone()})` : zone}</option>)}
    </select>
    <small>{currentLabel}</small>
  </label>;
}
