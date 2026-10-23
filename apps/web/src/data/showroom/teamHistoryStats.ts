import { TeamId } from '../../types';

export interface DriverHistoryItem {
  name: string;
  role: string; // e.g. "2026 Driver", "5x World Champion", "Race Winner"
  isChampion?: boolean;
  years?: string;
}

export interface TeamAllTimeStats {
  constructorTitles: number;
  driverTitles: number;
  raceWins: number;
  polePositions: number;
  podiums: number;
  fastestLaps: number;
  debutYear: number | string;
  heritageNoteVi: string;
  heritageNoteEn: string;
}

export interface TeamHistoryData {
  drivers: DriverHistoryItem[];
  stats: TeamAllTimeStats;
}

export const TEAM_HISTORY_DATA: Record<TeamId, TeamHistoryData> = {
  ferrari: {
    drivers: [
      { name: 'Charles Leclerc', role: '2026 Race Driver', years: '2019-Hiện tại' },
      { name: 'Lewis Hamilton', role: '2026 Race Driver · 7x Vô Địch', isChampion: true, years: '2025-Hiện tại' },
      { name: 'Michael Schumacher', role: '5x Vô Địch cùng Ferrari', isChampion: true, years: '1996-2006' },
      { name: 'Niki Lauda', role: '2x Vô Địch cùng Ferrari', isChampion: true, years: '1974-1977' },
      { name: 'Kimi Räikkönen', role: 'Nhà Vô Địch Thế Giới 2007', isChampion: true, years: '2007-09, 14-18' },
      { name: 'Sebastian Vettel', role: '14 Chiến thắng cùng Ferrari', isChampion: true, years: '2015-2020' },
      { name: 'Fernando Alonso', role: '11 Chiến thắng cùng Ferrari', isChampion: true, years: '2010-2014' },
      { name: 'Gilles Villeneuve', role: 'Huyền thoại tốc độ Ferrari', years: '1977-1982' },
    ],
    stats: {
      constructorTitles: 16,
      driverTitles: 15,
      raceWins: 248,
      polePositions: 253,
      podiums: 825,
      fastestLaps: 262,
      debutYear: 1950,
      heritageNoteVi: 'Đội đua duy nhất tham gia trọn vẹn mọi mùa giải F1 kể từ 1950, biểu tượng tối thượng của tốc độ và danh vọng.',
      heritageNoteEn: 'The only constructor to compete in every F1 season since 1950, the pinnacle of racing heritage.',
    },
  },

  mclaren: {
    drivers: [
      { name: 'Lando Norris', role: '2026 Race Driver · Chiến Thắng GP', years: '2019-Hiện tại' },
      { name: 'Oscar Piastri', role: '2026 Race Driver · Chiến Thắng GP', years: '2023-Hiện tại' },
      { name: 'Ayrton Senna', role: '3x Vô Địch cùng McLaren', isChampion: true, years: '1988-1993' },
      { name: 'Alain Prost', role: '3x Vô Địch cùng McLaren', isChampion: true, years: '1980, 84-89' },
      { name: 'Mika Häkkinen', role: '2x Vô Địch Thế Giới', isChampion: true, years: '1993-2001' },
      { name: 'Lewis Hamilton', role: 'Nhà Vô Địch Thế Giới 2008', isChampion: true, years: '2007-2012' },
      { name: 'Niki Lauda', role: 'Vô Địch Thế Giới 1984', isChampion: true, years: '1982-1985' },
      { name: 'Bruce McLaren', role: 'Nhà Sáng Lập & Tay Đua', years: '1966-1970' },
    ],
    stats: {
      constructorTitles: 9,
      driverTitles: 12,
      raceWins: 189,
      polePositions: 163,
      podiums: 522,
      fastestLaps: 169,
      debutYear: 1966,
      heritageNoteVi: 'Đội đua giàu thành tích thứ hai lịch sử F1, nổi danh với kỷ nguyên vàng Senna - Prost và di sản Papaya.',
      heritageNoteEn: 'The second most successful team in F1 history, legendary for the Senna-Prost golden era and iconic Papaya livery.',
    },
  },

  mercedes: {
    drivers: [
      { name: 'George Russell', role: '2026 Race Driver · Lãnh Đội', years: '2022-Hiện tại' },
      { name: 'Kimi Antonelli', role: '2026 Race Driver · Siêu Tài Năng', years: '2025-Hiện tại' },
      { name: 'Lewis Hamilton', role: '6x Vô Địch cùng Mercedes', isChampion: true, years: '2013-2024' },
      { name: 'Nico Rosberg', role: 'Nhà Vô Địch Thế Giới 2016', isChampion: true, years: '2010-2016' },
      { name: 'Michael Schumacher', role: 'Huyền Thoại Trở Lại F1', isChampion: true, years: '2010-2012' },
      { name: 'Juan Manuel Fangio', role: '2x Vô Địch cùng Mercedes', isChampion: true, years: '1954-1955' },
      { name: 'Valtteri Bottas', role: '10 Chiến Thắng cùng Mũi Tên Bạc', years: '2017-2021' },
      { name: 'Stirling Moss', role: 'Huyền thoại Silver Arrows', years: '1955' },
    ],
    stats: {
      constructorTitles: 8,
      driverTitles: 9,
      raceWins: 128,
      polePositions: 139,
      podiums: 296,
      fastestLaps: 109,
      debutYear: '1954 / 2010',
      heritageNoteVi: 'Kỷ lục vô tiền khoáng hậu: 8 năm liên tiếp vô địch đội đua thế giới (2014-2021) trong kỷ nguyên Hybrid.',
      heritageNoteEn: 'Unprecedented modern dominance: 8 consecutive Constructors World Championships (2014-2021) in the hybrid era.',
    },
  },

  redbull: {
    drivers: [
      { name: 'Max Verstappen', role: '2026 Race Driver · 4x Vô Địch', isChampion: true, years: '2016-Hiện tại' },
      { name: 'Isack Hadjar', role: '2026 Race Driver · Tân Binh', years: '2026-Hiện tại' },
      { name: 'Sebastian Vettel', role: '4x Vô Địch cùng Red Bull', isChampion: true, years: '2009-2014' },
      { name: 'Daniel Ricciardo', role: '7 Chiến Thắng cùng Red Bull', years: '2014-2018' },
      { name: 'Mark Webber', role: '9 Chiến Thắng cùng Red Bull', years: '2007-2013' },
      { name: 'Sergio Pérez', role: '5 Chiến Thắng cùng Red Bull', years: '2021-2024' },
      { name: 'David Coulthard', role: 'Tay đua đặt nền móng Red Bull', years: '2005-2008' },
      { name: 'Alex Albon', role: 'Podium Finisher', years: '2019-2020' },
    ],
    stats: {
      constructorTitles: 6,
      driverTitles: 7,
      raceWins: 121,
      polePositions: 103,
      podiums: 281,
      fastestLaps: 99,
      debutYear: 2005,
      heritageNoteVi: 'Biểu tượng của sự táo bạo và triết lý khí động học đỉnh cao Adrian Newey, hai kỷ nguyên thống trị Vettel & Verstappen.',
      heritageNoteEn: 'Pioneers of extreme aerodynamics under Adrian Newey, authoring dominant eras under Vettel and Verstappen.',
    },
  },

  cadillac: {
    drivers: [
      { name: 'Sergio Pérez', role: '2026 Race Driver · 6x GP Winner', years: '2026-Hiện tại' },
      { name: 'Valtteri Bottas', role: '2026 Race Driver · 10x GP Winner', years: '2026-Hiện tại' },
      { name: 'Earl Bamber', role: 'Cadillac V-Series.R Le Mans Pilot', years: 'Cadillac Racing' },
      { name: 'Alex Lynn', role: 'FIA WEC Hypercar Pole Winner', years: 'Cadillac Racing' },
      { name: 'Sébastien Bourdais', role: 'Rolex 24 at Daytona Winner', years: 'Cadillac Racing' },
      { name: 'Renger van der Zande', role: 'IMSA GTP Champion', years: 'Cadillac Racing' },
      { name: 'Pipo Derani', role: 'IMSA WeatherTech Champion', years: 'Cadillac Racing' },
      { name: 'Scott Dixon', role: 'IndyCar Legend & Cadillac Pilot', isChampion: true, years: 'Cadillac Racing' },
    ],
    stats: {
      constructorTitles: 0,
      driverTitles: 0,
      raceWins: 0,
      polePositions: 0,
      podiums: 0,
      fastestLaps: 0,
      debutYear: 2026,
      heritageNoteVi: 'Tân binh F1 2026 danh giá mang sức mạnh cơ bắp Mỹ, sở hữu 4 chức vô địch IMSA GTP và 3 cúp Daytona 24h.',
      heritageNoteEn: 'Premier American factory works constructor entering F1 in 2026, backed by 4 IMSA titles and 3 Rolex 24 overall victories.',
    },
  },

  williams: {
    drivers: [
      { name: 'Carlos Sainz', role: '2026 Race Driver · 3x GP Winner', years: '2025-Hiện tại' },
      { name: 'Alex Albon', role: '2026 Race Driver · Trụ Cột', years: '2022-Hiện tại' },
      { name: 'Nigel Mansell', role: 'Nhà Vô Địch Thế Giới 1992', isChampion: true, years: '1985-88, 91-92, 94' },
      { name: 'Alain Prost', role: 'Nhà Vô Địch Thế Giới 1993', isChampion: true, years: '1993' },
      { name: 'Damon Hill', role: 'Nhà Vô Địch Thế Giới 1996', isChampion: true, years: '1993-1996' },
      { name: 'Jacques Villeneuve', role: 'Nhà Vô Địch Thế Giới 1997', isChampion: true, years: '1996-1998' },
      { name: 'Nelson Piquet', role: 'Nhà Vô Địch Thế Giới 1987', isChampion: true, years: '1986-1987' },
      { name: 'Ayrton Senna', role: 'Huyền Thoại Bất Tử F1', isChampion: true, years: '1994' },
    ],
    stats: {
      constructorTitles: 9,
      driverTitles: 7,
      raceWins: 114,
      polePositions: 128,
      podiums: 313,
      fastestLaps: 133,
      debutYear: 1977,
      heritageNoteVi: 'Đội đua truyền thống huyền thoại của ngài Frank Williams, sở hữu 9 danh hiệu Vô địch Thế giới và 114 chiến thắng GP.',
      heritageNoteEn: 'Historic British racing powerhouse founded by Sir Frank Williams, boasting 9 Constructors Championships.',
    },
  },

  astonmartin: {
    drivers: [
      { name: 'Fernando Alonso', role: '2026 Race Driver · 2x Vô Địch', isChampion: true, years: '2023-Hiện tại' },
      { name: 'Lance Stroll', role: '2026 Race Driver · Podium Finisher', years: '2021-Hiện tại' },
      { name: 'Sebastian Vettel', role: 'Podium cùng Aston Martin', isChampion: true, years: '2021-2022' },
      { name: 'Sergio Pérez', role: 'Chiến thắng GP tại Racing Point', years: 'Heritage' },
      { name: 'Nico Hülkenberg', role: 'Reserve & Points Scorer', years: '2021-2022' },
      { name: 'Roy Salvadori', role: 'Tay đua F1 đầu tiên của Aston Martin', years: '1959' },
      { name: 'Carroll Shelby', role: 'Huyền thoại thể thao tốc độ', years: '1959' },
      { name: 'Maurice Trintignant', role: 'Le Mans & F1 Driver', years: '1959' },
    ],
    stats: {
      constructorTitles: 0,
      driverTitles: 0,
      raceWins: 1,
      polePositions: 1,
      podiums: 10,
      fastestLaps: 3,
      debutYear: '1959 / 2021',
      heritageNoteVi: 'Thương hiệu quý tộc Anh Quốc hợp tác cùng Adrian Newey & Honda hướng tới đỉnh cao vô địch thế giới từ 2026.',
      heritageNoteEn: 'British ultra-luxury pedigree partnering with Adrian Newey and Honda works power for the 2026 championship assault.',
    },
  },

  alpine: {
    drivers: [
      { name: 'Pierre Gasly', role: '2026 Race Driver · GP Winner', years: '2023-Hiện tại' },
      { name: 'Franco Colapinto', role: '2026 Race Driver · Sao Trẻ', years: '2025-Hiện tại' },
      { name: 'Fernando Alonso', role: '2x Vô Địch cùng Renault', isChampion: true, years: '2003-06, 08-09, 21-22' },
      { name: 'Alain Prost', role: '9 Chiến Thắng cùng Renault', isChampion: true, years: '1981-1983' },
      { name: 'René Arnoux', role: 'Huyền Thoại Turbo Renault', years: '1979-1982' },
      { name: 'Esteban Ocon', role: 'Chiến Thắng GP Hungary 2021', years: '2020-2024' },
      { name: 'Giancarlo Fisichella', role: '2 Chiến Thắng cùng Renault', years: '2005-2007' },
      { name: 'Daniel Ricciardo', role: 'Podiums cùng Renault', years: '2019-2020' },
    ],
    stats: {
      constructorTitles: 2,
      driverTitles: 2,
      raceWins: 36,
      polePositions: 51,
      podiums: 107,
      fastestLaps: 33,
      debutYear: 1977,
      heritageNoteVi: 'Tiên phong công nghệ động cơ Turbo tại F1, kế thừa di sản vô địch thế giới 2005-2006 của tập đoàn Renault.',
      heritageNoteEn: 'Pioneers of F1 turbocharging, custodians of Renaults back-to-back 2005-2006 world championships.',
    },
  },

  audi: {
    drivers: [
      { name: 'Nico Hülkenberg', role: '2026 Factory Driver · 230+ GP', years: '2025-Hiện tại' },
      { name: 'Gabriel Bortoleto', role: '2026 Factory Driver · F2 Champion', isChampion: true, years: '2025-Hiện tại' },
      { name: 'Robert Kubica', role: 'Chiến Thắng GP Canada 2008', years: 'Sauber Heritage' },
      { name: 'Kimi Räikkönen', role: 'Ra mắt F1 tại Sauber 2001', isChampion: true, years: '2001, 2019-2021' },
      { name: 'Nick Heidfeld', role: '12 Podiums cùng Sauber', years: '2001-03, 06-10' },
      { name: 'Felipe Massa', role: 'Ra mắt F1 cùng Sauber', years: '2002, 2004-2005' },
      { name: 'Sebastian Vettel', role: 'Ra mắt F1 cùng BMW Sauber 2007', isChampion: true, years: '2007' },
      { name: 'Charles Leclerc', role: 'Ra mắt F1 tại Sauber 2018', years: '2018' },
    ],
    stats: {
      constructorTitles: 0,
      driverTitles: 0,
      raceWins: 1,
      polePositions: 1,
      podiums: 27,
      fastestLaps: 5,
      debutYear: 2026,
      heritageNoteVi: 'Gã khổng lồ Đức Audi chính thức bước vào F1 năm 2026 với tư cách Factory Works Team, tiếp quản di sản Sauber.',
      heritageNoteEn: 'German engineering titan Audi enters F1 in 2026 as a full factory works entry, building upon Saubers foundation.',
    },
  },

  racingbulls: {
    drivers: [
      { name: 'Liam Lawson', role: '2026 Race Driver', years: '2024-Hiện tại' },
      { name: 'Arvid Lindblad', role: '2026 Race Driver · Tân Binh', years: '2026-Hiện tại' },
      { name: 'Sebastian Vettel', role: 'Chiến Thắng Monza 2008 Lịch Sử', isChampion: true, years: '2007-2008' },
      { name: 'Pierre Gasly', role: 'Chiến Thắng Monza 2020 Cảm Xúc', years: '2017-18, 19-22' },
      { name: 'Max Verstappen', role: 'Ra mắt F1 tại Toro Rosso 2015', isChampion: true, years: '2015-2016' },
      { name: 'Daniel Ricciardo', role: '2x Podium Finisher & Mentor', years: '2012-13, 23-24' },
      { name: 'Carlos Sainz', role: 'Ra mắt F1 tại Toro Rosso 2015', years: '2015-2017' },
      { name: 'Yuki Tsunoda', role: 'Trụ cột VCARB', years: '2021-2025' },
    ],
    stats: {
      constructorTitles: 0,
      driverTitles: 0,
      raceWins: 2,
      polePositions: 1,
      podiums: 5,
      fastestLaps: 3,
      debutYear: 2006,
      heritageNoteVi: 'Vườn ươm siêu sao của Red Bull, cái nôi đưa Vettel và Verstappen bước lên đỉnh cao thế giới với 2 chiến thắng Monza.',
      heritageNoteEn: 'Red Bulls championship cradle where Vettel and Verstappen launched their legends, decorated by 2 iconic Monza wins.',
    },
  },

  haas: {
    drivers: [
      { name: 'Esteban Ocon', role: '2026 Race Driver · GP Winner', years: '2025-Hiện tại' },
      { name: 'Oliver Bearman', role: '2026 Race Driver · Siêu Tân Binh', years: '2025-Hiện tại' },
      { name: 'Romain Grosjean', role: 'Tay Đua Đặt Nền Móng Haas', years: '2016-2020' },
      { name: 'Kevin Magnussen', role: 'Pole Position Brazil 2022', years: '2017-20, 22-24' },
      { name: 'Nico Hülkenberg', role: 'Trụ Cột Kinh Nghiệm', years: '2023-2024' },
      { name: 'Mick Schumacher', role: 'Chiến Binh Trẻ Haas', years: '2021-2022' },
      { name: 'Pietro Fittipaldi', role: 'Dự Bị & Test Driver', years: '2020-2024' },
      { name: 'Ayao Komatsu', role: 'Kỹ Sư Trưởng Lên Lãnh Đội', years: 'Team Principal' },
    ],
    stats: {
      constructorTitles: 0,
      driverTitles: 0,
      raceWins: 0,
      polePositions: 1,
      podiums: 0,
      fastestLaps: 2,
      debutYear: 2016,
      heritageNoteVi: 'Đội đua tư nhân Mỹ đầy kiên cường của Gene Haas, sở hữu 1 Pole Position lịch sử và hơn 180 chặng đua F1.',
      heritageNoteEn: 'American racing grit founded by Gene Haas, capturing an unforgettable pole position across 180+ Grands Prix.',
    },
  },
};
