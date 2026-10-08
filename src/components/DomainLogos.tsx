import React from 'react';

interface LogoProps {
  className?: string;
}

/**
 * 1. Telecommunication Domain Logo:
 * High-speed 5G broadcast tower with concentric radio-frequency wave arcs
 * and cellular core telemetry node.
 */
export const TelecomDomainLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Telecommunication Logo"
  >
    {/* Outer RF Broadcast Waves */}
    <path
      d="M7 13C11 8.5 17 6 20 6C23 6 29 8.5 33 13"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.45"
    />
    {/* Mid RF Wave */}
    <path
      d="M11 17.5C13.8 14.5 17.2 13 20 13C22.8 13 26.2 14.5 29 17.5"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.8"
    />
    {/* Inner RF Wave */}
    <path
      d="M15 22C16.8 20.2 18.6 19.5 20 19.5C21.4 19.5 23.2 20.2 25 22"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Lattice Mast Tower */}
    <path d="M20 21V35" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M14 35H26" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M16 28H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M17 23.5L23 32" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
    <path d="M23 23.5L17 32" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
    {/* 5G Core Signal Node */}
    <circle cx="20" cy="20.5" r="2.8" fill="#E31837" />
  </svg>
);

/**
 * 2. BFSI & Payments Domain Logo:
 * Classical interbank architectural monument with gold-standard pillars,
 * security vault pediment, and ISO currency exchange node.
 */
export const BfsiDomainLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="BFSI & Payments Logo"
  >
    {/* Pediment Roof */}
    <path
      d="M6 14.5L20 6.5L34 14.5H6Z"
      fill="currentColor"
      fillOpacity="0.18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Four Interbank Settlement Pillars */}
    <rect x="8.5" y="16.5" width="3.5" height="13.5" rx="1" fill="currentColor" />
    <rect x="15" y="16.5" width="3.5" height="13.5" rx="1" fill="currentColor" />
    <rect x="21.5" y="16.5" width="3.5" height="13.5" rx="1" fill="currentColor" />
    <rect x="28" y="16.5" width="3.5" height="13.5" rx="1" fill="currentColor" />
    {/* Foundation Plinth Base */}
    <rect x="5" y="31.5" width="30" height="3.5" rx="1" fill="currentColor" />
    {/* Central Monetary Seal */}
    <circle cx="20" cy="11.5" r="2.2" fill="#E31837" />
  </svg>
);

/**
 * 3. Healthcare & Life Sciences Domain Logo:
 * Clinical cross, protective shield contour, and dynamic ECG vital pulse waveform.
 */
export const HealthcareDomainLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Healthcare & Life Sciences Logo"
  >
    {/* Medical Clinical Shield Container */}
    <path
      d="M20 5C20 5 9 7.5 9 17C9 27 20 34.5 20 34.5C20 34.5 31 27 31 17C31 7.5 20 5 20 5Z"
      fill="currentColor"
      fillOpacity="0.15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Clinical Cross Outline in subtle opacity */}
    <path
      d="M17 10H23V15H28V21H23V26H17V21H12V15H17V10Z"
      fill="currentColor"
      fillOpacity="0.25"
    />
    {/* ECG Pulse Heartbeat Rhythm Line */}
    <path
      d="M10 21H15L17.5 15L20.5 27L23 18L24.5 21H30"
      stroke="#E31837"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 4. Manufacturing (IoT/Industry 4.0) Domain Logo:
 * High-precision interlocking industrial gear with smart IoT sensor node.
 */
export const ManufacturingDomainLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Manufacturing & IoT Logo"
  >
    {/* Industrial Gear Outline */}
    <path
      d="M17.5 6H22.5L23.5 10C24.8 10.5 26 11.2 27.1 12.1L31 10.7L33.5 15L30.5 17.8C30.7 18.5 30.8 19.3 30.8 20C30.8 20.7 30.7 21.5 30.5 22.2L33.5 25L31 29.3L27.1 27.9C26 28.8 24.8 29.5 23.5 30L22.5 34H17.5L16.5 30C15.2 29.5 14 28.8 12.9 27.9L9 29.3L6.5 25L9.5 22.2C9.3 21.5 9.2 20.7 9.2 20C9.2 19.3 9.3 18.5 9.5 17.8L6.5 15L9 10.7L12.9 12.1C14 11.2 15.2 10.5 16.5 10L17.5 6Z"
      fill="currentColor"
      fillOpacity="0.16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Central Smart Bearing Aperture */}
    <circle cx="20" cy="20" r="5.5" fill="white" stroke="currentColor" strokeWidth="2" />
    <circle cx="20" cy="20" r="2.8" fill="#E31837" />
  </svg>
);

/**
 * 5. Trust & Safety Domain Logo:
 * High-assurance AI safety shield with ethical balance check and governance guardrail.
 */
export const TrustSafetyDomainLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Trust & Safety Logo"
  >
    {/* Outer Defense Shield */}
    <path
      d="M20 5.5L8.5 10V18.5C8.5 26.5 13.5 33.5 20 35.5C26.5 33.5 31.5 26.5 31.5 18.5V10L20 5.5Z"
      fill="currentColor"
      fillOpacity="0.16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Inner Shield Contour */}
    <path
      d="M20 9L11.5 12.5V18.5C11.5 24.5 15.2 29.8 20 31.8C24.8 29.8 28.5 24.5 28.5 18.5V12.5L20 9Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeDasharray="2 2"
      opacity="0.6"
    />
    {/* Active Verification Checkmark */}
    <path
      d="M14.5 20L18.5 24L26 15"
      stroke="#E31837"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);