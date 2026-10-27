import React from 'react';
import { PLATFORM_URL } from '../lib/platform';
import { ModelOSLogo } from './ModelOSLogo';
import { TechMahindraLogo } from './TechMahindraLogo';

interface BrandHeaderProps {
  /** Called when "Source" is clicked: go to this module's home page. */
  onHome: () => void;
}

/**
 * The brand line used on every screen: ModelOS logo | Tech Mahindra logo | Source.
 * The ModelOS logo opens the ModelOS platform; "Source" (this module) goes to the home page.
 */
export const BrandHeader: React.FC<BrandHeaderProps> = ({ onHome }) => (
  <div className="flex items-center gap-0 sm:gap-2 flex-wrap select-none">
    <a
      href={PLATFORM_URL}
      title="Go to the ModelOS platform"
      aria-label="ModelOS platform"
      className="flex items-center py-1 cursor-pointer hover:opacity-90 transition-opacity focus-techm rounded-md"
    >
      <ModelOSLogo className="h-3 sm:h-5 md:h-7" />
    </a>

    <div className="h-6 sm:h-8 w-px bg-slate-300/80 hidden sm:block" />

    <div className="flex items-center py-1 text-[#29251D]" title="Tech Mahindra">
      <TechMahindraLogo className="h-3 sm:h-5 md:h-7 w-auto" />
    </div>

    <div className="h-6 sm:h-8 w-px bg-slate-300/80 hidden sm:block" />

    <button
      type="button"
      onClick={onHome}
      title="Go to the Source home page"
      className="text-xs sm:text-base md:text-xl font-bold tracking-tight leading-none text-[#E31837] hover:opacity-90 transition-opacity cursor-pointer focus-techm rounded-md px-1 py-1 ml-1 sm:ml-2"
    >
      Source
    </button>
  </div>
);
