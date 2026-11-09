import { TeamId } from './team';

export interface F1Driver {
  id: string;
  number: number;
  code: string;
  name: string;
  shortName: string;
  teamId: TeamId;
  country: string;
  countryCode: string;
  flagEmoji: string;
  imageUrl?: string;
  careerWins?: number;
  podiums?: number;
}
