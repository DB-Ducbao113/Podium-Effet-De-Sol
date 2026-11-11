// Assets are copied from the cited publishers only for the isolated local owner review.
// Public portfolio or production use needs a separate rights decision.
import ferrariBadge from './reference-assets/ferrari-logo.webp';
import mclarenBadge from './reference-assets/mclaren-logo.webp';
import mclarenWordmark from './reference-assets/mclaren-wordmark-2021.svg';
import pirelliWordmark from './reference-assets/mclaren-pirelli-wordmark-transparent.svg';
import cadillacBadge from './reference-assets/cadillac-logo.webp';
import hpLogo from './reference-assets/hp-logo.svg';
import geminiLogo from './reference-assets/gemini-logo.webp';
import twgAiLogo from './reference-assets/twg-ai-partner.webp';
import mercedesBadge from './reference-assets/mercedes-official-logo.webp';
import redbullBadge from './reference-assets/redbull-official-logo.webp';
import racingbullsBadge from './reference-assets/racingbulls-official-logo.webp';
import astonmartinBadge from './reference-assets/astonmartin-official-logo.webp';
import alpineBadge from './reference-assets/alpine-official-logo.webp';
import williamsBadge from './reference-assets/williams-official-logo.webp';
import haasBadge from './reference-assets/haas-official-logo.webp';
import haasSidepodMark from './reference-assets/haas-2026-sidepod-mark-extracted.png';
import audiBadge from './reference-assets/audi-official-logo.webp';
import redbullGraphic from './reference-assets/redbull-sun-bulls.png';
import petronasWordmark from './reference-assets/petronas-wordmark-white.png';
import oracleWordmark from './reference-assets/oracle-wordmark.svg';
import visaWordmark from './reference-assets/visa-logo.svg';
import aramcoWordmark from './reference-assets/aramco-logo.webp';
import bwtWordmark from './reference-assets/bwt-logo.svg';
import atlassianWordmark from './reference-assets/atlassian-logo.svg';
import barclaysCarMark from './reference-assets/barclays-car-mark.png';
import komatsuWordmark from './reference-assets/komatsu-wordmark.svg';
import revolutWordmark from './reference-assets/revolut-logo.svg';
import tgrWordmark from './reference-assets/tgr-logo.svg';
import shellMark from './reference-assets/shell-logo.svg';
import cevaWordmark from './reference-assets/ceva-logo.svg';
import unicreditWordmark from './reference-assets/unicredit-logo.svg';
import mastercardMark from './reference-assets/mastercard-logo.svg';
import dellTechnologies from './reference-assets/mclaren-dell.svg';
import dropboxWordmark from './reference-assets/mclaren-dropbox.svg';
import ciscoWordmark from './reference-assets/mclaren-cisco.svg';
import workdayWordmark from './reference-assets/mclaren-workday.svg';
import allwynWordmark from './reference-assets/mclaren-allwyn.webp';
import okxWordmark from './reference-assets/mclaren-okx.svg';
import richardMilleWordmark from './reference-assets/mclaren-richardmille.webp';
import oktaWordmark from './reference-assets/mclaren-okta.webp';
import dpWorldWordmark from './reference-assets/mclaren-dpworld.webp';
import groqWordmark from './reference-assets/mclaren-groq.webp';
import ironMountainWordmark from './reference-assets/mclaren-ironmountain.webp';
import veloWordmark from './reference-assets/mclaren-velo.jpg';
import ibmWordmark from './reference-assets/ibm-logo.svg';
import valvolineWordmark from './reference-assets/valvoline-wing-horizontal.svg';
import eniWordmark from './reference-assets/media-logoEni.svg';
import fordWordmark from './reference-assets/ford-logo.svg';
import microsoftWordmark from './reference-assets/microsoft-logo.svg';

export type ArtworkKey = 'ferrari' | 'mclaren' | 'mclarenOrange' | 'mclarenWordmarkWhite' | 'pirelliBlack' | 'cadillac' | 'cadillacDark' | 'hp' | 'gemini' | 'twg' | 'twgInverse' | 'mercedes' | 'redbull' | 'racingbulls' | 'astonmartin' | 'alpine' | 'williams' | 'haas' | 'haasSidepod' | 'audi' | 'redbullGraphic' | 'petronas' | 'oracle' | 'visa' | 'aramco' | 'bwt' | 'atlassian' | 'barclays' | 'komatsuBlue' | 'komatsuWhite' | 'revolut' | 'revolutWhite' | 'tgr' | 'shell' | 'ceva' | 'unicredit' | 'mastercard' | 'dell' | 'dropbox' | 'cisco' | 'workday' | 'allwyn' | 'okx' | 'richardMille' | 'okta' | 'dpWorld' | 'groq' | 'groqWhite' | 'ironMountain' | 'velo' | 'ibmWhite' | 'valvoline' | 'eniWhite' | 'eniBlack' | 'fordWhite' | 'microsoft';

export const artwork: Record<ArtworkKey, { url: string; matte?: 'white' | 'gray'; invertDark?: boolean; darkInk?: boolean; inkColor?: string; removeBlackBackground?: boolean; source: string }> = {
  ferrari: { url: ferrariBadge, removeBlackBackground: true, source: 'https://www.formula1.com/en/teams/ferrari' },
  mclaren: { url: mclarenBadge, source: 'https://www.formula1.com/en/teams/mclaren' },
  mclarenOrange: { url: mclarenBadge, inkColor: '#ef6e12', source: 'https://www.formula1.com/en/teams/mclaren' },
  mclarenWordmarkWhite: { url: mclarenWordmark, inkColor: '#f5f5f0', source: 'https://worldvectorlogo.com/logo/mclaren-logo-1' },
  pirelliBlack: { url: pirelliWordmark, source: 'https://worldvectorlogo.com/logo/pirelli-1' },
  cadillac: { url: cadillacBadge, source: 'https://www.formula1.com/en/teams/cadillac' },
  cadillacDark: { url: cadillacBadge, darkInk: true, source: 'https://www.formula1.com/en/teams/cadillac' },
  hp: { url: hpLogo, source: 'https://commons.wikimedia.org/wiki/File:HP_logo_2012.svg' },
  gemini: { url: geminiLogo, matte: 'white', invertDark: true, source: 'https://www.mclaren.com/racing/partners/gemini/' },
  twg: { url: twgAiLogo, matte: 'gray', source: 'https://www.cadillacf1team.com/partners' },
  twgInverse: { url: twgAiLogo, matte: 'gray', invertDark: true, source: 'https://www.cadillacf1team.com/partners' },
  mercedes: { url: mercedesBadge, source: 'https://www.formula1.com/en/teams/mercedes' },
  redbull: { url: redbullBadge, source: 'https://www.formula1.com/en/teams/red-bull-racing' },
  racingbulls: { url: racingbullsBadge, inkColor: '#d82734', source: 'https://www.formula1.com/en/teams/racing-bulls' },
  astonmartin: { url: astonmartinBadge, source: 'https://www.formula1.com/en/teams/aston-martin' },
  alpine: { url: alpineBadge, source: 'https://www.formula1.com/en/teams/alpine' },
  williams: { url: williamsBadge, source: 'https://www.formula1.com/en/teams/williams' },
  haas: { url: haasBadge, darkInk: true, source: 'https://www.formula1.com/en/teams/haas' },
  haasSidepod: { url: haasSidepodMark, source: 'reference-assets/haas-2026-official-right.webp; source-derived exact glyph, DEV review only' },
  audi: { url: audiBadge, darkInk: true, source: 'https://www.formula1.com/en/teams/audi' },
  redbullGraphic: { url: redbullGraphic, source: 'https://www.formula1.com/en/teams/red-bull-racing' },
  petronas: { url: petronasWordmark, source: 'https://commons.wikimedia.org/wiki/File:Petronas_logo.svg' },
  oracle: { url: oracleWordmark, inkColor: '#f5f6f4', source: 'https://commons.wikimedia.org/wiki/File:Oracle_wordmark.svg' },
  visa: { url: visaWordmark, source: 'https://commons.wikimedia.org/wiki/File:Visa_2021.svg' },
  aramco: { url: aramcoWordmark, source: 'https://www.formula1.com/en/teams/aston-martin' },
  bwt: { url: bwtWordmark, inkColor: '#f184bd', source: 'https://commons.wikimedia.org/wiki/File:BWT_Logo_2024.svg' },
  atlassian: { url: atlassianWordmark, inkColor: '#f5f6f4', source: 'https://commons.wikimedia.org/wiki/File:Atlassian-logo.svg' },
  barclays: { url: barclaysCarMark, inkColor: '#f5f6f4', source: 'https://commons.wikimedia.org/wiki/File:Barclays-Logo.svg' },
  komatsuBlue: { url: komatsuWordmark, inkColor: '#12279e', source: 'https://www.komatsu.jp/assets/images/logo.svg' },
  komatsuWhite: { url: komatsuWordmark, inkColor: '#f5f6f4', source: 'https://www.komatsu.jp/assets/images/logo.svg' },
  revolut: { url: revolutWordmark, source: 'https://commons.wikimedia.org/wiki/File:Revolut_logo.svg' },
  revolutWhite: { url: revolutWordmark, inkColor: '#f5f6f4', source: 'https://commons.wikimedia.org/wiki/File:Revolut_logo.svg' },
  tgr: { url: tgrWordmark, source: 'https://commons.wikimedia.org/wiki/File:Toyota_Gazoo_Racing_logo.svg' },
  shell: { url: shellMark, source: 'https://commons.wikimedia.org/wiki/File:Shell.svg' },
  ceva: { url: cevaWordmark, inkColor: '#f5f6f4', source: 'https://commons.wikimedia.org/wiki/File:Logo_of_CEVA_Logistics_(2023).svg' },
  unicredit: { url: unicreditWordmark, inkColor: '#f5f6f4', source: 'https://commons.wikimedia.org/wiki/File:Unicredit_logo.svg' },
  mastercard: { url: mastercardMark, source: 'https://commons.wikimedia.org/wiki/File:Mastercard_2019_logo.svg' },
  dell: { url: dellTechnologies, darkInk: true, source: 'https://commons.wikimedia.org/wiki/File:Dell_Technologies_logo_black.svg' },
  dropbox: { url: dropboxWordmark, darkInk: true, source: 'https://commons.wikimedia.org/wiki/File:Dropbox_logo_2017.svg' },
  cisco: { url: ciscoWordmark, darkInk: true, source: 'https://commons.wikimedia.org/wiki/File:Cisco_logo_blue_2016.svg' },
  workday: { url: workdayWordmark, darkInk: true, source: 'https://commons.wikimedia.org/wiki/File:Workday_2024_logo.svg' },
  allwyn: { url: allwynWordmark, matte: 'white', invertDark: true, source: 'https://www.mclaren.com/racing/partners/allwyn/' },
  okx: { url: okxWordmark, inkColor: '#f5f6f4', source: 'https://commons.wikimedia.org/wiki/File:OKX_logo.svg' },
  richardMille: { url: richardMilleWordmark, matte: 'white', source: 'https://www.mclaren.com/racing/partners/richard-mille/' },
  okta: { url: oktaWordmark, matte: 'white', inkColor: '#f5f6f4', source: 'https://www.mclaren.com/racing/partners/okta/' },
  dpWorld: { url: dpWorldWordmark, matte: 'white', inkColor: '#f5f6f4', source: 'https://www.mclaren.com/racing/partners/dp-world/' },
  groq: { url: groqWordmark, matte: 'white', darkInk: true, source: 'https://www.mclaren.com/racing/partners/groq/' },
  groqWhite: { url: groqWordmark, matte: 'white', inkColor: '#f5f5f0', source: 'https://www.mclaren.com/racing/partners/groq/' },
  ironMountain: { url: ironMountainWordmark, matte: 'white', inkColor: '#f5f6f4', source: 'https://www.mclaren.com/racing/partners/iron-mountain/' },
  velo: { url: veloWordmark, matte: 'white', darkInk: true, source: 'https://www.prnewswire.co.uk/news-releases/velo--the-mclaren-formula-1-team-reveal-the-ultimate-fan-experience-with-live-your-fandom-campaign-302549915.html' },
  ibmWhite: { url: ibmWordmark, inkColor: '#f5f6f4', source: 'https://commons.wikimedia.org/wiki/File:IBM_logo.svg' },
  valvoline: { url: valvolineWordmark, source: 'https://commons.wikimedia.org/wiki/File:Valvoline_company_logo.svg' },
  eniWhite: { url: eniWordmark, inkColor: '#f5f6f4', source: 'https://www.eni.com/en-IT/media/press-kit.html' },
  eniBlack: { url: eniWordmark, darkInk: true, source: 'https://www.eni.com/en-IT/media/press-kit.html' },
  fordWhite: { url: fordWordmark, source: 'https://commons.wikimedia.org/wiki/File:Ford_logo_flat.svg' },
  microsoft: { url: microsoftWordmark, source: 'https://commons.wikimedia.org/wiki/File:Microsoft.svg' },
};

export const badgeForTeam: Record<string, string | undefined> = {
  ferrari: ferrariBadge,
  mclaren: mclarenBadge,
  cadillac: cadillacBadge,
  mercedes: mercedesBadge,
  redbull: redbullBadge,
  racingbulls: racingbullsBadge,
  astonmartin: astonmartinBadge,
  alpine: alpineBadge,
  williams: williamsBadge,
  haas: haasBadge,
  audi: audiBadge,
};
