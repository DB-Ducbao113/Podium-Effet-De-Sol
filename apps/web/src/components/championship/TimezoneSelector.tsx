import { useTimezoneStore } from '../../store/useTimezoneStore';
import { TIMEZONE_OPTIONS, browserTimeZone, zoneOffsetLabel } from '../../utils/championshipTimezone';

export function TimezoneSelector({ lang }: { lang: 'vi' | 'en' }) {
  const { preference, setPreference } = useTimezoneStore();
  const label = lang === 'vi' ? 'Múi giờ hiển thị' : 'Display time zone';
  return <label className="c1-timezone">
    <span>{label}</span>
    <select aria-label={label} value={preference} onChange={(event) => setPreference(event.target.value)}>
      {TIMEZONE_OPTIONS.map((zone) => <option key={zone} value={zone}>{zone === 'local' ? `${lang === 'vi' ? 'Thiết bị' : 'Browser local'} (${browserTimeZone()})` : zone === 'Asia/Bangkok' ? 'UTC+07:00' : zone}</option>)}
    </select>
    <small>{zoneOffsetLabel(new Date(), preference)}</small>
  </label>;
}
