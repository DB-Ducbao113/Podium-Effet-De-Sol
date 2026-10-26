import { useReducedMotion } from '../../hooks/useReducedMotion';

/** Decorative mechanical digits; the parent owns the single accessible value. */
export function RollingDigits({ value, minDigits = 2 }: { value: number; minDigits?: number }) {
  const reducedMotion = useReducedMotion();
  const digits = String(Math.max(0, Math.floor(value))).padStart(minDigits, '0').split('');

  return <span className="h25-odometer" aria-hidden="true" data-reduced-motion={reducedMotion}>
    {digits.map((digit, index) => <span className="h25-odometer__window" key={`${digits.length}-${index}`}>
      <span className="h25-odometer__strip" style={{ transform: `translateY(-${Number(digit) * 10}%)` }}>
        {Array.from({ length: 10 }, (_, numeral) => <span key={numeral}>{numeral}</span>)}
      </span>
    </span>)}
  </span>;
}
