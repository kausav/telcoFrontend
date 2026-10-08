import React from 'react';
import {
  BfsiDomainLogo,
  HealthcareDomainLogo,
  ManufacturingDomainLogo,
  TelecomDomainLogo,
  TrustSafetyDomainLogo,
} from '../components/DomainLogos';

interface DomainVisual {
  Logo: React.FC<{ className?: string }>;
  color: string;
}

const VISUALS: { match: RegExp; visual: DomainVisual }[] = [
  { match: /tele|5g|network/i, visual: { Logo: TelecomDomainLogo, color: 'text-[#E31837]' } },
  { match: /bank|bfsi|financ|insur|payment/i, visual: { Logo: BfsiDomainLogo, color: 'text-[#185F8D]' } },
  { match: /health|clinic|pharma|medic/i, visual: { Logo: HealthcareDomainLogo, color: 'text-[#247153]' } },
  { match: /manufact|industr|factory/i, visual: { Logo: ManufacturingDomainLogo, color: 'text-[#8A5200]' } },
  { match: /trust|safety|t&s/i, visual: { Logo: TrustSafetyDomainLogo, color: 'text-[#7C3AED]' } },
];

/** Presentation only: which logo and colour an industry gets, chosen from its name. Unknown industries get a neutral one. */
export function getDomainVisual(industryName: string): DomainVisual {
  return VISUALS.find(item => item.match.test(industryName))?.visual ?? { Logo: TrustSafetyDomainLogo, color: 'text-[#4D4D4F]' };
}
