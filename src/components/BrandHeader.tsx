import React from 'react';
import { PLATFORM_URL } from '../lib/platform';
import logo from '../assets/landing/logos/logo-dark.webp';

/** The brand line on every screen: ModelOS, "Powered By Tech Mahindra" and "Source" in one image. It opens the ModelOS platform. */
export const BrandHeader: React.FC = () => (
  <a
    href={PLATFORM_URL}
    title="Go to the ModelOS platform"
    aria-label="ModelOS Source, powered by Tech Mahindra"
    className="inline-flex items-center select-none cursor-pointer opacity-100 hover:opacity-85 transition-opacity focus-techm rounded-xs"
  >
    <img src={logo} alt="ModelOS Source, powered by Tech Mahindra" className="h-7 md:h-8 w-auto" draggable={false} />
  </a>
);
