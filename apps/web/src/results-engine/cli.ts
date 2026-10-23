import { loadCalendar, runEngine } from './engine.ts';

function readArgument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const nowArgument = readArgument('--now');
const now = nowArgument ? new Date(nowArgument) : new Date();
if (Number.isNaN(now.getTime())) throw new Error('--now must be a valid ISO timestamp');

const report = await runEngine({
  now,
  calendar: readArgument('--calendar') ? loadCalendar(readArgument('--calendar')) : undefined,
  statePath: readArgument('--state'),
  allowHistoricalCorrections: process.argv.includes('--allow-historical-corrections'),
});
console.log(
  JSON.stringify(
    { processed: report.processed, skipped: report.skipped, warnings: report.warnings },
    null,
    2,
  ),
);
if (report.warnings.length > 0) process.exitCode = 1;
