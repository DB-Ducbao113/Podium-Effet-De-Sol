import type { PodiumFormEntry } from '../../utils/podiumStats';

/**
 * Last-five-rounds podium badges. The visible chip is decorative for assistive
 * tech; the round explanation is exposed as text so it is not hover-only.
 */
export function FormBadges({
  entries,
  lang,
  scope = 'driver',
}: {
  entries: PodiumFormEntry[];
  lang: 'vi' | 'en';
  scope?: 'driver' | 'team';
}) {
  return (
    <span
      className="p5-form"
      role="group"
      aria-label={lang === 'vi' ? 'Chuỗi 5 vòng gần nhất' : 'Last five rounds'}
    >
      {entries.map((entry) => {
        const description = entry.position
          ? scope === 'team'
            ? lang === 'vi'
              ? `Vòng ${entry.round}: đội đạt P${entry.position}`
              : `Round ${entry.round}: team finished P${entry.position}`
            : lang === 'vi'
              ? `Vòng ${entry.round}: P${entry.position}`
              : `Round ${entry.round}: P${entry.position}`
          : entry.source === 'detailed'
            ? scope === 'team'
              ? lang === 'vi'
                ? `Vòng ${entry.round}: đội không có podium`
                : `Round ${entry.round}: no team podium`
              : lang === 'vi'
                ? `Vòng ${entry.round}: không có podium`
                : `Round ${entry.round}: no podium`
            : lang === 'vi'
              ? `Vòng ${entry.round}: không có trong tóm tắt top 3`
              : `Round ${entry.round}: not in the podium summary`;
        return (
          <span
            key={entry.round}
            className="p5-form-cell"
            data-pos={entry.position ?? 0}
            title={description}
          >
            <span aria-hidden="true">{entry.position ? `P${entry.position}` : '–'}</span>
            <span className="sr-only">{description}</span>
          </span>
        );
      })}
    </span>
  );
}
