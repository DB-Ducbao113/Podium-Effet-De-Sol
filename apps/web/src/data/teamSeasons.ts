import { SeasonYear, TeamId } from '../types';

export interface TeamSeasonProfile {
  fullName: string;
  base: string;
  teamLead: string;
  teamLeadTitle: string;
  powerUnit: string;
}

type TeamSeasonProfiles = Partial<Record<TeamId, Partial<Record<SeasonYear, TeamSeasonProfile>>>>;

const profile = (
  fullName: string,
  base: string,
  teamLead: string,
  powerUnit: string,
  teamLeadTitle = 'Team Principal',
): TeamSeasonProfile => ({ fullName, base, teamLead, teamLeadTitle, powerUnit });

// Seasonal snapshots use the leadership and entry name at the end of each season.
export const TEAM_SEASON_PROFILES: TeamSeasonProfiles = {
  ferrari: {
    2024: profile('Scuderia Ferrari HP', 'Maranello, Italy', 'Frédéric Vasseur', 'Ferrari'),
    2025: profile('Scuderia Ferrari HP', 'Maranello, Italy', 'Frédéric Vasseur', 'Ferrari'),
    2026: profile('Scuderia Ferrari HP', 'Maranello, Italy', 'Frédéric Vasseur', 'Ferrari'),
  },
  mclaren: {
    2024: profile('McLaren Formula 1 Team', 'Woking, United Kingdom', 'Andrea Stella', 'Mercedes'),
    2025: profile('McLaren Formula 1 Team', 'Woking, United Kingdom', 'Andrea Stella', 'Mercedes'),
    2026: profile('McLaren Mastercard F1 Team', 'Woking, United Kingdom', 'Andrea Stella', 'Mercedes'),
  },
  redbull: {
    2024: profile('Oracle Red Bull Racing', 'Milton Keynes, United Kingdom', 'Christian Horner', 'Honda RBPT'),
    2025: profile('Oracle Red Bull Racing', 'Milton Keynes, United Kingdom', 'Laurent Mekies', 'Honda RBPT'),
    2026: profile('Oracle Red Bull Racing', 'Milton Keynes, United Kingdom', 'Laurent Mekies', 'Red Bull Ford'),
  },
  mercedes: {
    2024: profile('Mercedes-AMG PETRONAS Formula One Team', 'Brackley, United Kingdom', 'Toto Wolff', 'Mercedes'),
    2025: profile('Mercedes-AMG PETRONAS Formula One Team', 'Brackley, United Kingdom', 'Toto Wolff', 'Mercedes'),
    2026: profile('Mercedes-AMG PETRONAS Formula One Team', 'Brackley, United Kingdom', 'Toto Wolff', 'Mercedes'),
  },
  astonmartin: {
    2024: profile('Aston Martin Aramco Formula One Team', 'Silverstone, United Kingdom', 'Mike Krack', 'Mercedes'),
    2025: profile('Aston Martin Aramco Formula One Team', 'Silverstone, United Kingdom', 'Andy Cowell', 'Mercedes'),
    2026: profile('Aston Martin Aramco Formula One Team', 'Silverstone, United Kingdom', 'Adrian Newey', 'Honda'),
  },
  alpine: {
    2024: profile('BWT Alpine F1 Team', 'Enstone, United Kingdom / Viry, France', 'Oliver Oakes', 'Renault'),
    2025: profile('BWT Alpine Formula One Team', 'Enstone, United Kingdom', 'Flavio Briatore', 'Renault', 'Acting team lead'),
    2026: profile('BWT Alpine Formula One Team', 'Enstone, United Kingdom', 'Flavio Briatore / Steve Nielsen', 'Mercedes', 'Executive advisor / Managing director'),
  },
  racingbulls: {
    2024: profile('Visa Cash App RB Formula One Team', 'Faenza, Italy', 'Laurent Mekies', 'Honda RBPT'),
    2025: profile('Visa Cash App Racing Bulls Formula One Team', 'Faenza, Italy', 'Alan Permane', 'Honda RBPT'),
    2026: profile('Visa Cash App Racing Bulls Formula One Team', 'Faenza, Italy', 'Alan Permane', 'Red Bull Ford'),
  },
  haas: {
    2024: profile('MoneyGram Haas F1 Team', 'Kannapolis, United States', 'Ayao Komatsu', 'Ferrari'),
    2025: profile('MoneyGram Haas F1 Team', 'Kannapolis, United States', 'Ayao Komatsu', 'Ferrari'),
    2026: profile('TGR Haas F1 Team', 'Kannapolis, United States', 'Ayao Komatsu', 'Ferrari'),
  },
  williams: {
    2024: profile('Williams Racing', 'Grove, United Kingdom', 'James Vowles', 'Mercedes'),
    2025: profile('Atlassian Williams Racing', 'Grove, United Kingdom', 'James Vowles', 'Mercedes'),
    2026: profile('Williams F1 Team', 'Grove, United Kingdom', 'James Vowles', 'Mercedes'),
  },
  audi: {
    2024: profile('Stake F1 Team Kick Sauber', 'Hinwil, Switzerland', 'Alessandro Alunni Bravi', 'Ferrari', 'Team Representative'),
    2025: profile('Stake F1 Team Kick Sauber', 'Hinwil, Switzerland', 'Jonathan Wheatley', 'Ferrari'),
    2026: profile('Audi Revolut F1 Team', 'Hinwil, Switzerland', 'Mattia Binotto', 'Audi'),
  },
  cadillac: {
    2026: profile('Cadillac Formula 1 Team', 'Fishers, United States / Silverstone, United Kingdom', 'Marcin Budkowski', 'Ferrari'),
  },
};

export const getTeamSeasonProfile = (teamId: TeamId, season: SeasonYear) =>
  TEAM_SEASON_PROFILES[teamId]?.[season];
