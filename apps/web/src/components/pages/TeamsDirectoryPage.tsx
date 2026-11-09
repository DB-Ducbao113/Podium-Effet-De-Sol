import type { SeasonYear } from '../../types';
import { StandaloneProfileDirectory } from './StandaloneProfileDirectory';

export function TeamsDirectoryPage({ initialSeason = 2026, hideHeader = false }: { initialSeason?: SeasonYear; hideHeader?: boolean }) {
  return <StandaloneProfileDirectory kind="teams" initialSeason={initialSeason} hideHeader={hideHeader} />;
}
