import React, { useId } from 'react';

interface ModelOSLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ModelOSLogo: React.FC<ModelOSLogoProps> = ({
  className = '',
  size = 'lg',
}) => {
  const maskId = useId();

  // Size variations
  const isXl = size === 'xl';
  const isLg = size === 'lg';

  const textClass = isXl
    ? 'text-[36px] sm:text-[44px] md:text-[50px]'
    : isLg
    ? 'text-[30px] sm:text-[36px] md:text-[42px]'
    : 'text-[24px] sm:text-[28px]';

  const svgClass = isXl
    ? 'w-[32px] h-[32px] sm:w-[38px] sm:h-[38px] md:w-[44px] md:h-[44px] mx-[5px] sm:mx-[6px]'
    : isLg
    ? 'w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] md:w-[36px] md:h-[36px] mx-[4px] sm:mx-[5px]'
    : 'w-[21px] h-[21px] sm:w-[25px] sm:h-[25px] mx-[3.5px] sm:mx-[4.5px]';

  return (
    <div
      className={`inline-flex items-center select-none font-sans font-extrabold leading-none ${className}`}
      role="img"
      aria-label="ModelOS Logo"
    >
      {/* "Model" in Deep Royal Navy Blue (#2D398E) */}
      <span
        className={`text-[#2D398E] font-extrabold tracking-[-0.03em] leading-none ${textClass}`}
        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif" }}
      >
        Model
      </span>

      {/* 
        Official ModelOS Red Swirl "O" Emblem
      */}
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${svgClass} shrink-0`}
        aria-hidden="true"
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="-18" y="-18" width="36" height="36">
            <rect x="-18" y="-18" width="36" height="36" fill="white" />
            <circle cx="0" cy="0" r="3.8" fill="black" />
            {[0, 90, 180, 270].map((deg) => (
              <path
                key={`cut-${deg}`}
                transform={`rotate(${deg})`}
                d="M 0 -4 C 3.5 -5 7.8 -3.5 11.2 -0.8 C 13.5 0.8 14.8 2.8 15.2 5"
                stroke="black"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
            ))}
            {[0, 90, 180, 270].map((deg) => (
              <path
                key={`sweep-${deg}`}
                transform={`rotate(${deg})`}
                d="M 0.5 -14.8 C 4.5 -10.5 8 -4.8 10.5 1 C 7.5 -0.5 4 -1 1 -3.8"
                stroke="black"
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </mask>
        </defs>

        <g transform="translate(18, 18)">
          <circle cx="0" cy="0" r="14.5" fill="#E31837" mask={`url(#${maskId})`} />
        </g>
      </svg>

      {/* "S" in Deep Royal Navy Blue (#2D398E) */}
      <span
        className={`text-[#2D398E] font-extrabold tracking-[-0.03em] leading-none ${textClass}`}
        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif" }}
      >
        S
      </span>
    </div>
  );
};