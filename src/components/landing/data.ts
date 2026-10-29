/* Content and illustration data for the landing page. */
import { rng } from './helpers';

export const CUSTOMERS = [
  'AusNet', 'Ausgrid', 'Horizon Power', 'Sydney Trains', 'Transpower', 'United Energy',
  'Yarra Valley Water', 'Endeavour Energy', 'Essential Energy', 'CitiPower / Powercor', 'Queensland Rail', 'Energy Queensland',
];

export const STATEMENT =
  'Most AI projects stall before a model is ever trained. The fraud is too rare to learn from, the customer records are too private to touch, and the real world sits out in the field, where no database reaches.';

// The synthetic subscriber rows shown in the hero tile and the "generated from a scenario" chapter.
// Seeded, so they are identical on every visit.
const R = rng(4);
const CH = ['USSD', 'App', 'Retail', 'IVR', 'Web'];
const OF = ['₹49 pack', 'Talktime', 'Data 1GB', 'None', '₹99 pack'];

export interface SynthRow {
  edge: boolean;
  id: string;
  bal: string;
  hrs: string;
  ch: string;
  of: string;
  top: string;
}

const makeRow = (i: number): SynthRow => {
  const edge = i % 7 === 3 || i % 11 === 6;
  const id = 'SUB-' + (10400 + ((R() * 900) | 0));
  const bal = (R() * 49).toFixed(2);
  const hrs = edge && i % 7 === 3 ? '48.00' : (R() * 47).toFixed(2);
  const top = edge && i % 11 === 6 ? 'never' : R() < 0.62 ? 'yes' : 'no';
  return { edge, id, bal, hrs, ch: CH[(R() * 5) | 0], of: OF[(R() * 5) | 0], top };
};

export const ROWS: SynthRow[] = Array.from({ length: 40 }, (_, i) => makeRow(i));

