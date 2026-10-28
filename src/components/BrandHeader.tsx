import React from 'react';
import { PLATFORM_URL } from '../lib/platform';
import modelOsSourceLogo from '../assets/images/modelos_source_logo.png';

/**
 * The brand line used on every screen: one image holding the ModelOS logo, "Powered By Tech Mahindra" and "Source".
 * Clicking it opens the ModelOS platform.
 */
export const BrandHeader: React.FC = () => (
  <a
    href={PLATFORM_URL}
    title="Go to the ModelOS platform"
    aria-label="ModelOS Source, powered by Tech Mahindra"
    className="inline-flex items-center py-0 select-none cursor-pointer hover:opacity-90 transition-opacity focus-techm rounded-md"
  >
    <img src={modelOsSourceLogo} alt="ModelOS Source, powered by Tech Mahindra" className="h-9 sm:h-10 md:h-12 w-auto" draggable={false} />
  </a>
);
