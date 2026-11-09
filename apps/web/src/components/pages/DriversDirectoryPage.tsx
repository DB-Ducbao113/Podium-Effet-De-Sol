import type { SeasonYear } from '../../types';
import { StandaloneProfileDirectory } from './StandaloneProfileDirectory';

export function DriversDirectoryPage({ initialSeason = 2026, hideHeader = false }: { initialSeason?: SeasonYear; hideHeader?: boolean }) {
  return <StandaloneProfileDirectory kind="drivers" initialSeason={initialSeason} hideHeader={hideHeader} />;
}
