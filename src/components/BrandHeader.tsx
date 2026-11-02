import React from 'react';
import { PLATFORM_URL } from '../lib/platform';
import logoDark from '../assets/landing/logos/logo-dark.webp';

/**
 * The brand line used on the workspace header: the same logo lockup as the landing page (light-on-ink version,
 * since the workspace header is an ink bar). Clicking it opens the ModelOS platform.
 */
export const BrandHeader: React.FC = () => (
  <a
    href={PLATFORM_URL}
    title="Go to the ModelOS platform"
    aria-label="ModelOS Source, powered by Tech Mahindra"
    className="inline-flex items-center select-none cursor-pointer hover:opacity-90 transition-opacity focus-techm"
  >
    <img src={logoDark} alt="" width={720} height={143} className="h-8 md:h-9 w-auto" draggable={false} />
  </a>
);
