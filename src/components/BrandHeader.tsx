import React from 'react';
import { PLATFORM_URL } from '../lib/platform';
import logo from '../assets/brand/modelos-source-white.webp';

/** The brand line on every screen: the Navixus ModelOS | Source lockup (white version, for the dark header). It opens the ModelOS platform. */
export const BrandHeader: React.FC = () => (
  <a
    href={PLATFORM_URL}
    title="Go to the ModelOS platform"
    aria-label="ModelOS Source by Navixus"
    className="inline-flex items-center select-none cursor-pointer opacity-100 hover:opacity-85 transition-opacity focus-techm rounded-xs"
  >
    <img src={logo} alt="ModelOS Source by Navixus" width={1600} height={169} className="h-6 md:h-7 w-auto" draggable={false} />
  </a>
);
